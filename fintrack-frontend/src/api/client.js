/**
 * FinTrack API Client
 * Centralized HTTP layer handling requests to FastAPI backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = `${BASE_URL}/api/v1`;

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_PREFIX}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
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

export const api = {
  // System Health
  health: () => fetch(`${BASE_URL}/health`).then(r => r.json()),

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
};
