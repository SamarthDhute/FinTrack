import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken, setOnUnauthenticated } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('fintrack_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('fintrack_access_token') || null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(!user);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      try {
        localStorage.removeItem('fintrack_access_token');
        localStorage.removeItem('fintrack_user');
      } catch (_) {}
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
      try {
        localStorage.removeItem('fintrack_access_token');
        localStorage.removeItem('fintrack_user');
      } catch (_) {}
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
      try {
        localStorage.setItem('fintrack_user', JSON.stringify(profile));
      } catch (_) {}
      return profile;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // Try silent refresh before logging out
      try {
        const newAccessToken = await api.silentRefresh();
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          setToken(newAccessToken);
          const p = await api.auth.me();
          setUser(p);
          try {
            localStorage.setItem('fintrack_user', JSON.stringify(p));
          } catch (_) {}
          return p;
        }
      } catch (_) {}
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

        const savedToken = localStorage.getItem('fintrack_access_token');
        if (savedToken) {
          setAccessToken(savedToken);
          setToken(savedToken);
          await fetchProfile();
        } else {
          // Silent refresh check using HttpOnly cookie
          const newAccessToken = await api.silentRefresh();
          if (newAccessToken) {
            await handleAuthSuccess(newAccessToken);
          }
        }
      } catch {
        // If not logged in
        if (!localStorage.getItem('fintrack_access_token')) {
          setAccessToken(null);
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [handleAuthSuccess, logout, fetchProfile]);

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
