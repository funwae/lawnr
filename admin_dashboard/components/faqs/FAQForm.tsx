'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/utils/api';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
}

interface FAQFormProps {
  faq: FAQ | null;
  categories: string[];
  onSave: () => void;
  onCancel: () => void;
}

export default function FAQForm({ faq, categories, onSave, onCancel }: FAQFormProps) {
  const [category, setCategory] = useState(faq?.category || '');
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [order, setOrder] = useState(faq?.order || 0);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (faq) {
      setCategory(faq.category);
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setOrder(faq.order);
    }
  }, [faq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalCategory = showNewCategory && newCategory ? newCategory : category;
      const data = {
        category: finalCategory,
        question,
        answer,
        order: parseInt(order.toString()),
      };

      if (faq) {
        await apiClient.put(`/faqs/${faq.id}`, data);
      } else {
        await apiClient.post('/faqs', data);
      }

      onSave();
    } catch (err) {
      alert('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-[#00FF00] mb-4">
        {faq ? 'Edit FAQ' : 'Create FAQ'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Category</label>
          {showNewCategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
              />
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategory('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                + New
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            placeholder="Enter question"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            placeholder="Enter answer"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#00FF00] text-black font-semibold rounded-lg hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : faq ? 'Update FAQ' : 'Create FAQ'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

