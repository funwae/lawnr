'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/utils/api';
import type { Dispute, DisputeListResponse } from '@/lib/types/dispute';
import Link from 'next/link';

interface DisputeListProps {
  filters?: {
    status?: string;
    dispute_type?: string;
  };
}

export default function DisputeList({ filters = {} }: DisputeListProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const queryParams = new URLSearchParams();
        if (filters.status) {
          queryParams.append('status', filters.status);
        }
        if (filters.dispute_type) {
          queryParams.append('dispute_type', filters.dispute_type);
        }

        const endpoint = `/admin/disputes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiClient.get<DisputeListResponse>(endpoint);

        if (response.data) {
          setDisputes(response.data.disputes);
        } else {
          setError(response.error?.message || 'Failed to load disputes');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load disputes');
      } finally {
        setLoading(false);
      }
    }

    fetchDisputes();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500';
      case 'in_review':
        return 'bg-blue-500';
      case 'open':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading disputes...</div>
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
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#00FF00]/20">
              <th className="text-left p-4 text-[#00FF00] font-semibold">Dispute ID</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Type</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Description</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Status</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Created</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr
                key={dispute.id}
                className="border-b border-gray-700 hover:bg-[#1A1A1A] transition-colors"
              >
                <td className="p-4">
                  <Link
                    href={`/disputes/${dispute.id}`}
                    className="text-[#00FF00] hover:underline"
                  >
                    {dispute.id.slice(0, 8)}...
                  </Link>
                </td>
                <td className="p-4 text-white capitalize">
                  {dispute.dispute_type.replace('_', ' ')}
                </td>
                <td className="p-4 text-gray-300 text-sm max-w-md truncate">
                  {dispute.description}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded text-white ${getStatusColor(
                      dispute.status
                    )}`}
                  >
                    {dispute.status}
                  </span>
                </td>
                <td className="p-4 text-gray-300 text-sm">
                  {new Date(dispute.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <Link
                    href={`/disputes/${dispute.id}`}
                    className="text-[#00FF00] hover:underline text-sm"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {disputes.length === 0 && (
        <div className="text-center py-12 text-gray-400">No disputes found</div>
      )}
    </div>
  );
}

