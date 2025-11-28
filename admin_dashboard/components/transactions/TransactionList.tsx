'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/utils/api';
import type { Transaction, TransactionListResponse } from '@/lib/types/transaction';

interface TransactionListProps {
  filters?: {
    payment_status?: string;
    start_date?: string;
    end_date?: string;
  };
}

export default function TransactionList({ filters = {} }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const queryParams = new URLSearchParams();
        if (filters.payment_status) {
          queryParams.append('payment_status', filters.payment_status);
        }
        if (filters.start_date) {
          queryParams.append('start_date', filters.start_date);
        }
        if (filters.end_date) {
          queryParams.append('end_date', filters.end_date);
        }

        const endpoint = `/admin/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiClient.get<TransactionListResponse>(endpoint);

        if (response.data) {
          setTransactions(response.data.transactions);
        } else {
          setError(response.error?.message || 'Failed to load transactions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'refunded':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const totalRevenue = transactions
    .filter(t => t.payment_status === 'paid')
    .reduce((sum, t) => sum + t.amount_total, 0);

  const totalCommission = transactions
    .filter(t => t.payment_status === 'paid')
    .reduce((sum, t) => sum + t.platform_commission, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-[#00FF00]">
            ${totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Platform Commission</div>
          <div className="text-2xl font-bold text-[#00FF00]">
            ${totalCommission.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Total Transactions</div>
          <div className="text-2xl font-bold text-white">{transactions.length}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#00FF00]/20">
              <th className="text-left p-4 text-[#00FF00] font-semibold">Transaction ID</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Amount</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Commission</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Status</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-700 hover:bg-[#1A1A1A] transition-colors"
              >
                <td className="p-4 text-white text-sm">{transaction.id.slice(0, 8)}...</td>
                <td className="p-4 text-white font-semibold">
                  ${transaction.amount_total.toLocaleString()}
                </td>
                <td className="p-4 text-[#00FF00]">
                  ${transaction.platform_commission.toLocaleString()}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded text-white ${getStatusColor(
                      transaction.payment_status
                    )}`}
                  >
                    {transaction.payment_status}
                  </span>
                </td>
                <td className="p-4 text-gray-300 text-sm">
                  {new Date(transaction.issued_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12 text-gray-400">No transactions found</div>
      )}
    </div>
  );
}

