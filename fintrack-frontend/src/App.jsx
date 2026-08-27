import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ExpenseModal } from './components/ExpenseModal';
import { api } from './api/client';

const MainLayout = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Quick Add Expense Modal State
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
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenAddExpense={() => setIsQuickExpenseModalOpen(true)}
      />

      {/* Main Page View */}
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

      {/* Quick Add Expense Modal */}
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

export function App() {
  return (
    <ToastProvider>
      <MainLayout />
    </ToastProvider>
  );
}

export default App;
