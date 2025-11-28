'use client';

import { useState } from 'react';
import TransactionList from '@/components/transactions/TransactionList';

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    payment_status: '',
    start_date: '',
    end_date: '',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Transactions</h1>
        <p className="text-gray-400">View all platform transactions and commissions</p>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Payment Status</label>
            <select
              value={filters.payment_status}
              onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ payment_status: '', start_date: '', end_date: '' })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <TransactionList filters={filters} />
    </div>
  );
}

