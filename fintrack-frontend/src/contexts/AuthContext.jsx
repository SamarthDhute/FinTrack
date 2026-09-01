import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken, setOnUnauthenticated } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await api.auth.logoutAll();
    } catch (err) {
      console.warn('Logout-all error:', err);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      logout();
      return null;
    }
  }, [logout]);

  const handleAuthSuccess = useCallback(async (accessToken) => {
    setAccessToken(accessToken);
    setToken(accessToken);
    await fetchProfile();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    await handleAuthSuccess(data.access_token);
    return data;
  };

  const register = async (display_name, email, password) => {
    const data = await api.auth.register({ display_name, email, password });
    await handleAuthSuccess(data.access_token);
    return data;
  };

  // Initial silent auth check on mount & hash check for Google OAuth redirect
  useEffect(() => {
    setOnUnauthenticated(logout);

    const initAuth = async () => {
      try {
        // Check if redirected from Google OAuth with fragment
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.replace('#', ''));
          const accessToken = params.get('access_token');
          if (accessToken) {
            window.location.hash = ''; // clean hash
            await handleAuthSuccess(accessToken);
            setIsLoading(false);
            return;
          }
        }

        // Silent refresh check using HttpOnly cookie
        const newAccessToken = await api.silentRefresh();
        if (newAccessToken) {
          await handleAuthSuccess(newAccessToken);
        }
      } catch {
        // Not logged in or expired cookie
        setAccessToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [handleAuthSuccess, logout]);

  // Periodic silent refresh every 12 minutes (before 15m expiration)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const newAccessToken = await api.silentRefresh();
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          setToken(newAccessToken);
        }
      } catch (err) {
        console.warn('Periodic token refresh failed:', err);
      }
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        logoutAll,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
