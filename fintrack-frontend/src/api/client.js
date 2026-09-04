/**
 * FinTrack API Client
 * Centralized HTTP layer handling requests to FastAPI backend.
 * Includes in-memory access token storage, CSRF headers, and silent 401 refresh interceptor.
 */

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const BASE_URL = typeof RAW_BASE_URL === 'string' ? RAW_BASE_URL.trim().replace(/\/+$/, '') : 'http://localhost:8000';
const API_PREFIX = `${BASE_URL}/api/v1`;

// In-memory access token (never stored in localStorage for security)
let _accessToken = null;
let _refreshPromise = null;
let _onUnauthenticated = null;

export const setAccessToken = (token) => {
  _accessToken = token;
};

export const getAccessToken = () => _accessToken;

export const setOnUnauthenticated = (callback) => {
  _onUnauthenticated = callback;
};

// Helper to get cookie value by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function request(endpoint, options = {}, isRetry = false) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_PREFIX}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  // Include credentials for cookie exchange (refresh_token, csrf_token)
  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Handle 401 Unauthorized (attempt silent refresh if not already refreshing)
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register')) {
      try {
        const newAccessToken = await silentRefresh();
        if (newAccessToken) {
          // Retry original request with new token
          return request(endpoint, options, true);
        }
      } catch {
        if (_onUnauthenticated) _onUnauthenticated();
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `HTTP error ${response.status}: ${response.statusText}`;
      throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }

    return data;
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${url}]:`, error);
    throw error;
  }
}

async function silentRefresh() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const csrfToken = getCookie('csrf_token') || '';
      const response = await fetch(`${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      return data.access_token;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

export const api = {
  request: (endpoint, options = {}) => request(endpoint, options),
  silentRefresh,

  // System Health
  health: () => fetch(`${BASE_URL}/health`).then((r) => r.json()),

  // Authentication
  auth: {
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    refresh: () => silentRefresh(),
    logout: () => request('/auth/logout', { method: 'POST' }),
    logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
    me: () => request('/auth/me'),
    forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    verifyEmail: (data) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
    resendVerification: (data) => request('/auth/resend-verification', { method: 'POST', body: JSON.stringify(data) }),
    googleAuthorizeUrl: `${API_PREFIX}/auth/google/authorize`,
  },

  // Categories
  categories: {
    list: () => request('/categories'),
    get: (id) => request(`/categories/${id}`),
    create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  },

  // Payment Methods (predefined: Cash, Card, UPI, Net Banking, Wallet)
  paymentMethods: {
    list: () => request('/payment-methods'),
  },

  // Budgets
  budgets: {
    list: () => request('/budgets'),
    get: (id) => request(`/budgets/${id}`),
    create: (data) => request('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),
  },

  // Expenses
  expenses: {
    list: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const queryString = searchParams.toString();
      return request(`/expenses${queryString ? `?${queryString}` : ''}`);
    },
    get: (id) => request(`/expenses/${id}`),
    create: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  },

  // Dashboard & Analytics
  dashboard: {
    summary: () => request('/dashboard/summary'),
    categoryChart: () => request('/dashboard/charts/category'),
    paymentMethodChart: () => request('/dashboard/charts/payment-method'),
    trendChart: () => request('/dashboard/charts/trend'),
  },

  // Debts & Udhaar Tracker (Lent, Borrowed, Partial Repayments)
  debts: {
    list: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const queryString = searchParams.toString();
      return request(`/debts${queryString ? `?${queryString}` : ''}`);
    },
    summary: () => request('/debts/summary'),
    get: (id) => request(`/debts/${id}`),
    create: (data) => request('/debts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/debts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/debts/${id}`, { method: 'DELETE' }),
    addRepayment: (debtId, data) => request(`/debts/${debtId}/repayments`, { method: 'POST', body: JSON.stringify(data) }),
    deleteRepayment: (debtId, repaymentId) => request(`/debts/${debtId}/repayments/${repaymentId}`, { method: 'DELETE' }),
  },

  // AI Financial Advisor & Super-Features Suite
  ai: {
    getInsights: () => request('/ai/insights', { method: 'POST' }),
    categorize: (data) => request('/ai/categorize', { method: 'POST', body: JSON.stringify(data) }),
    chat: (data) => request('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
    scanReceipt: (data) => request('/ai/scan-receipt', { method: 'POST', body: JSON.stringify(data) }),
    getSubscriptions: () => request('/ai/subscriptions'),
    getForecast: () => request('/ai/forecast'),
    getGoalPlan: (data) => request('/ai/goal-plan', { method: 'POST', body: JSON.stringify(data) }),
    getProviderStatus: () => request('/ai/provider-status'),
  },
};

