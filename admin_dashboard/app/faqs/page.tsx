'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/utils/api';
import FAQList from '@/components/faqs/FAQList';
import FAQForm from '@/components/faqs/FAQForm';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  created_at: string;
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = selectedCategory ? `?category=${selectedCategory}` : '';
      const response = await apiClient.get<{ faqs: FAQ[] }>(`/faqs${queryParams}`);
      if (response.data) {
        setFaqs(response.data.faqs);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get<{ categories: string[] }>('/faqs/categories');
      if (response.data) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleCreate = () => {
    setEditingFAQ(null);
    setShowForm(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setShowForm(true);
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      await apiClient.delete(`/faqs/${id}`);
      fetchFAQs();
    } catch (err) {
      alert('Failed to delete FAQ');
    }
  }, [fetchFAQs]);

  const handleSave = useCallback(async () => {
    setShowForm(false);
    fetchFAQs();
  }, [fetchFAQs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00FF00] mb-2">FAQs</h1>
          <p className="text-gray-400">Manage frequently asked questions</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-2 bg-[#00FF00] text-black font-semibold rounded-lg hover:bg-[#00FF00]/90"
        >
          + Add FAQ
        </button>
      </div>

      {showForm && (
        <FAQForm
          faq={editingFAQ}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-4">
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-[#00FF00] text-xl">Loading FAQs...</div>
        </div>
      ) : (
        <FAQList
          faqs={faqs}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

