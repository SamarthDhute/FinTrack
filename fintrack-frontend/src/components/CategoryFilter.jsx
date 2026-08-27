import React from 'react';

export const CategoryFilter = ({ categories = [], value, onChange }) => (
  <select className="category-filter btn btn-outline" value={value} onChange={e => onChange(e.target.value)}>
    <option value="">All Categories</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>{cat.name}</option>
    ))}
  </select>
);
