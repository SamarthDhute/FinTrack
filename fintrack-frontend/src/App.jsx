import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { DebtsPage } from './pages/DebtsPage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { ExpenseModal } from './components/ExpenseModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { QuickAddFAB } from './components/QuickAddFAB';
import { FloatingBottomNav } from './components/FloatingBottomNav';
import { api } from './api/client';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainLayout = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [isQuickExpenseModalOpen, setIsQuickExpenseModalOpen] = useState(false);
  const [isSavingQuickExpense, setIsSavingQuickExpense] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
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
      success('Expense logged ⚡');
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
    <div className="app-container" style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenAddExpense={() => setIsQuickExpenseModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
      />
      
      <main className="main-content" style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.25rem 1rem 80px' }}>
        {activeTab === 'dashboard' && (
          <DashboardPage
            key={refreshTrigger}
            categories={categories}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onOpenAddExpense={() => setIsQuickExpenseModalOpen(true)}
            onOpenAIChat={() => setIsAIChatOpen(true)}
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
        {activeTab === 'debts' && (
          <DebtsPage
            key={refreshTrigger}
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

      {/* Floating Action Button for 2-Tap Quick Log */}
      <QuickAddFAB onClick={() => setIsQuickExpenseModalOpen(true)} />

      {/* Glassmorphic Floating Bottom Navigation */}
      <FloatingBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
      />

      {/* Fast Expense Modal */}
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

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Floating AI Financial Chat Assistant */}
      <AIChatDrawer 
        externalOpen={isAIChatOpen} 
        onExternalClose={() => setIsAIChatOpen(false)} 
      />
    </div>
  );
};

const AppShell = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState('auth');
  const [resetToken, setResetToken] = useState(null);
  const [verifyToken, setVerifyToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');

    const hash = window.location.hash || '';
    const path = window.location.pathname || '';

    if (!token && hash) {
      const cleanHash = hash.replace(/^#\/?/, '');
      const queryPart = cleanHash.includes('?') ? cleanHash.split('?')[1] : (cleanHash.includes('=') ? cleanHash : '');
      if (queryPart) {
        const hashParams = new URLSearchParams(queryPart);
        token = hashParams.get('token');
      }
    }

    if (hash.includes('verify-email') || path.includes('verify-email')) {
      if (token) setVerifyToken(token);
      setAuthView('verify-email');
    } else if (hash.includes('reset-password') || path.includes('reset-password')) {
      if (token) setResetToken(token);
      setAuthView('reset-password');
    } else if (token) {
      setResetToken(token);
      setAuthView('reset-password');
    }
  }, []);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB', color: '#3B82F6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '45px', height: '45px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.04em', color: '#111827' }}>LOADING FINTRACK...</p>
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

  if (authView === 'verify-email') {
    return (
      <VerifyEmailPage
        token={verifyToken}
        onBackToLogin={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setVerifyToken(null);
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
    return (
      <AuthPage
        onForgotPassword={() => setAuthView('forgot-password')}
        onGoToVerify={() => setAuthView('verify-email')}
      />
    );
  }

  return <MainLayout />;
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <InstallPrompt />
          <OfflineBanner />
          <AppShell />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
