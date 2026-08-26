/**
 * Format numerical amounts to Indian Rupee (INR / ₹) with 2 decimal places.
 * Example: 1250.5 -> "₹1,250.50"
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format a Date string or Date object into human-readable format.
 * Example: "2026-08-26" -> "26 Aug 2026"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Returns today's date formatted as YYYY-MM-DD for HTML5 date inputs.
 */
export const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Format percentage with + / - sign.
 */
export const formatPercentage = (percent) => {
  if (percent === null || percent === undefined) return '0%';
  const num = Number(percent);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
};

/**
 * Return health status badge details for budget spending:
 * - 'on_track' (< 80%)
 * - 'near_limit' (80% - 100%)
 * - 'over_budget' (> 100%)
 */
export const getBudgetStatusInfo = (status, percentageSpent) => {
  const pct = Number(percentageSpent) || 0;
  if (status === 'over_budget' || pct > 100) {
    return {
      label: 'Over Budget',
      colorClass: 'status-over-budget',
      barColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      badgeText: '#f87171',
    };
  }
  if (status === 'near_limit' || pct >= 80) {
    return {
      label: 'Near Limit',
      colorClass: 'status-near-limit',
      barColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeText: '#fbbf24',
    };
  }
  return {
    label: 'On Track',
    colorClass: 'status-on-track',
    barColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#34d399',
  };
};
