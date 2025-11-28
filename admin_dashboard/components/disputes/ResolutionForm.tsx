'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/utils/api';
import { useRouter } from 'next/navigation';

interface ResolutionFormProps {
  disputeId: string;
  currentStatus: string;
}

export default function ResolutionForm({ disputeId, currentStatus }: ResolutionFormProps) {
  const router = useRouter();
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post(`/admin/disputes/${disputeId}/resolve`, {
        resolution,
      });

      if (response.data) {
        router.refresh();
      } else {
        setError(response.error?.message || 'Failed to resolve dispute');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === 'resolved' || currentStatus === 'rejected') {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Resolution Notes</label>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          required
          rows={4}
          className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
          placeholder="Enter resolution details..."
        />
      </div>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#00FF00] text-black font-semibold rounded-lg hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resolving...' : 'Resolve Dispute'}
        </button>
      </div>
    </form>
  );
}

