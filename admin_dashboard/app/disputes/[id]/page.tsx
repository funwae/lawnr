'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/utils/api';
import EvidenceViewer from '@/components/disputes/EvidenceViewer';
import ResolutionForm from '@/components/disputes/ResolutionForm';
import type { Dispute } from '@/lib/types/dispute';

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDispute() {
      try {
        const response = await apiClient.get<{ dispute: Dispute }>(`/admin/disputes/${params.id}`);
        if (response.data) {
          setDispute(response.data.dispute);
        } else {
          setError(response.error?.message || 'Failed to load dispute');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dispute');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchDispute();
    }
  }, [params.id]);

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
        <div className="text-[#00FF00] text-xl">Loading dispute details...</div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
        {error || 'Dispute not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-[#00FF00] hover:underline mb-4"
        >
          ← Back to Disputes
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Dispute Details</h1>
            <p className="text-gray-400">Dispute ID: {dispute.id}</p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-semibold rounded text-white ${getStatusColor(
              dispute.status
            )}`}
          >
            {dispute.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Description</h2>
          <p className="text-white">{dispute.description}</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Type:</span>
              <span className="text-white capitalize">{dispute.dispute_type.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Job ID:</span>
              <span className="text-white text-sm">{dispute.job_id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Created:</span>
              <span className="text-white text-sm">
                {new Date(dispute.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Evidence</h2>
          <EvidenceViewer evidence={dispute.evidence || []} />
        </div>

        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Resolution</h2>
          {dispute.resolution_notes ? (
            <div className="space-y-3">
              <p className="text-white">{dispute.resolution_notes}</p>
              {dispute.resolved_at && (
                <p className="text-gray-400 text-sm">
                  Resolved: {new Date(dispute.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <ResolutionForm disputeId={dispute.id} currentStatus={dispute.status} />
          )}
        </div>
      </div>
    </div>
  );
}

