import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { ExpenseModal } from './components/ExpenseModal';
import { api } from './api/client';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineBanner } from './components/OfflineBanner';

const MainLayout = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [isQuickExpenseModalOpen, setIsQuickExpenseModalOpen] = useState(false);
  const [isSavingQuickExpense, setIsSavingQuickExpense] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchGlobalMetadata = useCallback(async () => {
    try {
      const [cats, pms] = await Promise.all([
        api.categories.list().catch(() => []),
        api.paymentMethods.list().catch(() => []),
      ]);
      setCategories(cats || []);
      setPaymentMethods(pms || []);
    } catch (err) {
      console.error('Error fetching global metadata:', err);
    }
  }, []);

  useEffect(() => {
    fetchGlobalMetadata();
  }, [fetchGlobalMetadata, refreshTrigger]);

  const handleRefreshGlobalData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSaveQuickExpense = async (payload) => {
    try {
      setIsSavingQuickExpense(true);
      await api.expenses.create(payload);
      success('Expense logged successfully!');
      setIsQuickExpenseModalOpen(false);
      handleRefreshGlobalData();
    } catch (err) {
      console.error('Save expense error:', err);
      error(err.message || 'Failed to add expense');
    } finally {
      setIsSavingQuickExpense(false);
    }
  };

  const handleQuickAddCategory = async (catData) => {
    const newCat = await api.categories.create(catData);
    handleRefreshGlobalData();
    return newCat;
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenAddExpense={() => setIsQuickExpenseModalOpen(true)}
      />
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardPage
            key={refreshTrigger}
            categories={categories}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onOpenAddExpense={() => setIsQuickExpenseModalOpen(true)}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesPage
            key={refreshTrigger}
            categories={categories}
            paymentMethods={paymentMethods}
            onRefreshGlobalData={handleRefreshGlobalData}
          />
        )}
        {activeTab === 'budgets' && (
          <BudgetsPage
            key={refreshTrigger}
            categories={categories}
            onRefreshGlobalData={handleRefreshGlobalData}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesPage
            key={refreshTrigger}
            onRefreshGlobalData={handleRefreshGlobalData}
          />
        )}
      </main>
      <ExpenseModal
        isOpen={isQuickExpenseModalOpen}
        onClose={() => setIsQuickExpenseModalOpen(false)}
        onSave={handleSaveQuickExpense}
        categories={categories}
        paymentMethods={paymentMethods}
        expense={null}
        isSaving={isSavingQuickExpense}
        onQuickAddCategory={handleQuickAddCategory}
      />
    </div>
  );
};

const AppShell = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState('auth'); // 'auth' | 'forgot-password' | 'reset-password'
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    // 1. Check window.location.search (?token=...)
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');

    // 2. Check window.location.hash (#token=... or #reset-password?token=... or #/reset-password?token=...)
    if (!token && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const queryPart = hash.includes('?') ? hash.split('?')[1] : (hash.includes('=') ? hash : '');
      if (queryPart) {
        const hashParams = new URLSearchParams(queryPart);
        token = hashParams.get('token');
      }
    }

    if (token) {
      setResetToken(token);
      setAuthView('reset-password');
    } else if (
      window.location.pathname.includes('reset-password') ||
      window.location.hash.includes('reset-password')
    ) {
      setAuthView('reset-password');
    }
  }, []);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading FinTrack...</p>
        </div>
      </div>
    );
  }

  if (authView === 'reset-password') {
    return (
      <ResetPasswordPage
        token={resetToken}
        onBackToLogin={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setResetToken(null);
          setAuthView('auth');
        }}
      />
    );
  }

  if (authView === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onBackToLogin={() => setAuthView('auth')}
        onGoToReset={() => setAuthView('reset-password')}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onForgotPasswordClick={() => setAuthView('forgot-password')} />;
  }

  return <MainLayout />;
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <InstallPrompt />
        <OfflineBanner />
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
