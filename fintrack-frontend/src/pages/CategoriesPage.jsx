import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  CreditCard, 
  Receipt, 
  Layers, 
  Lock,
  Search,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { CategoryModal } from '../components/CategoryModal';
import { DeleteModal } from '../components/DeleteModal';

export const CategoriesPage = ({ onRefreshGlobalData }) => {
  const { success, error } = useToast();

  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States for Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, pmRes] = await Promise.all([
        api.categories.list(),
        api.paymentMethods.list(),
      ]);
      setCategories(catRes || []);
      setPaymentMethods(pmRes || []);
    } catch (err) {
      console.error('Failed to load categories & payment methods:', err);
      error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCategory = async (payload) => {
    try {
      setIsSavingCategory(true);
      if (editingCategory) {
        await api.categories.update(editingCategory.id, payload);
        success('Category renamed successfully!');
      } else {
        await api.categories.create(payload);
        success('Category created successfully!');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      fetchData();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Save category error:', err);
      error(err.message || 'Failed to save category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      await api.categories.delete(categoryToDelete.id);
      success('Category deleted successfully!');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchData();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Delete category error:', err);
      error(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  const filteredPaymentMethods = paymentMethods.filter((pm) =>
    (pm.name || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Categories & Payment Methods</h1>
          <p className="page-subtitle">Organize your spending tags and inspect payment method channels</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingCategory(null);
            setIsCategoryModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>New Category</span>
        </button>
      </div>

      {/* Search Filter Toolbar */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '14px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', width: '100%', maxWidth: '100%' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#9CA3AF', 
              pointerEvents: 'none' 
            }} 
          />
          <input
            type="text"
            placeholder="Search custom categories or payment channels..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              paddingLeft: '2.5rem', 
              paddingRight: search ? '2.5rem' : '0.85rem', 
              height: '42px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              background: '#F9FAFB',
              fontSize: '0.875rem'
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#E5E7EB',
                border: 'none',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                color: '#4B5563',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'background 0.15s ease',
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
        {search && (
          <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>
            Showing <strong>{filteredCategories.length}</strong> categories, <strong>{filteredPaymentMethods.length}</strong> payment channels
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Loading categories and payment methods...</p>
        </div>
      ) : (
        <div className="categories-split-view">
          {/* Custom Categories Card */}
          <div className="card zoom-card-interactive" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Tag size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.15rem' }}>Custom Categories ({filteredCategories.length})</h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--primary)' }}
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
              >
                + Add
              </button>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <Layers size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  {search ? 'No categories matching your search.' : 'No categories created yet.'}
                </p>
              </div>
            ) : (
              <div>
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="list-item-row activity-item-interactive">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge badge-indigo">🏷️</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Receipt size={12} />
                          <span>{cat.expense_count || 0} expenses linked</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Rename Category"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                      >
                        <Edit3 size={15} color="var(--text-muted)" />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Delete Category"
                        onClick={() => {
                          setCategoryToDelete(cat);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 size={15} color="var(--rose-danger)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Predefined Payment Methods Card */}
          <div className="card zoom-card-interactive" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CreditCard size={20} color="var(--secondary-accent)" />
                <h2 style={{ fontSize: '1.15rem' }}>Payment Methods ({filteredPaymentMethods.length})</h2>
              </div>
              <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                <Lock size={10} style={{ marginRight: 2 }} /> System Predefined
              </span>
            </div>

            {filteredPaymentMethods.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <CreditCard size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  {search ? 'No payment methods matching your search.' : 'No payment methods available.'}
                </p>
              </div>
            ) : (
              <div>
                {filteredPaymentMethods.map((pm) => (
                  <div key={pm.id} className="list-item-row activity-item-interactive">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge badge-emerald">💳</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                          {pm.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Receipt size={12} />
                          <span>{pm.expense_count || 0} expenses recorded</span>
                        </div>
                      </div>
                    </div>

                    <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Add/Edit Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
        isSaving={isSavingCategory}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={
          categoryToDelete
            ? `Are you sure you want to delete category "${categoryToDelete.name}"? ${
                categoryToDelete.expense_count > 0
                  ? `Warning: This will also remove ${categoryToDelete.expense_count} associated expense(s).`
                  : ''
              }`
            : ''
        }
        isDeleting={isDeleting}
      />
    </div>
  );
};
