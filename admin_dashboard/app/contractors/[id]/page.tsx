'use client';

import VerificationReview from '@/components/contractors/VerificationReview';
import { apiClient } from '@/lib/utils/api';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ContractorDetail {
  contractor: {
    id: string;
    user_id: string;
    business_name: string;
    business_logo_url?: string;
    description?: string;
    service_types: string[];
    base_rate_per_hour?: number;
    per_service_rate?: Record<string, number>;
    is_verified: boolean;
    premium_listing: string;
    rating_avg?: number;
    rating_count: number;
    user: {
      id: string;
      email: string;
      full_name: string;
      phone_number?: string;
    };
    jobs: number;
    documents: number;
  };
}

export default function ContractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contractor, setContractor] = useState<ContractorDetail['contractor'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchContractor() {
      try {
        const response = await apiClient.get<ContractorDetail>(`/admin/contractors/${params.id}`);
        if (response.data) {
          setContractor(response.data.contractor);
        } else {
          setError(response.error?.message || 'Failed to load contractor');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contractor');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchContractor();
    }
  }, [params.id]);

  const handleVerify = async () => {
    try {
      const response = await apiClient.post(`/admin/contractors/${params.id}/verify`, {});
      if (response.data) {
        setContractor((prev) => prev ? { ...prev, is_verified: true } : null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify contractor');
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this contractor?')) return;

    try {
      const response = await apiClient.post(`/admin/contractors/${params.id}/suspend`, {});
      if (response.data) {
        router.push('/contractors');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to suspend contractor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading contractor details...</div>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
        {error || 'Contractor not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-[#00FF00] hover:underline mb-4"
          >
            ← Back to Contractors
          </button>
          <h1 className="text-3xl font-bold text-[#00FF00] mb-2">
            {contractor.business_name}
          </h1>
          <p className="text-gray-400">{contractor.user.email}</p>
        </div>
        <div className="flex gap-3">
          {!contractor.is_verified && (
            <button
              onClick={handleVerify}
              className="px-4 py-2 bg-[#00FF00] text-black font-semibold rounded-lg hover:bg-[#00FF00]/90"
            >
              Verify Contractor
            </button>
          )}
          <button
            onClick={handleSuspend}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Suspend
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Business Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Business Name</label>
                <p className="text-white font-semibold">{contractor.business_name}</p>
              </div>
              {contractor.description && (
                <div>
                  <label className="text-sm text-gray-400">Description</label>
                  <p className="text-white">{contractor.description}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400">Contact</label>
                <p className="text-white">{contractor.user.full_name}</p>
                <p className="text-gray-400">{contractor.user.email}</p>
                {contractor.user.phone_number && (
                  <p className="text-gray-400">{contractor.user.phone_number}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Services & Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Service Types</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {contractor.service_types.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1 bg-[#00FF00]/10 text-[#00FF00] rounded"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              {contractor.base_rate_per_hour && (
                <div>
                  <label className="text-sm text-gray-400">Base Rate</label>
                  <p className="text-white font-semibold">
                    ${contractor.base_rate_per_hour}/hour
                  </p>
                </div>
              )}
            </div>
          </div>

          <VerificationReview contractorId={contractor.user_id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Verified</span>
                <span className={contractor.is_verified ? 'text-[#00FF00]' : 'text-red-500'}>
                  {contractor.is_verified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Premium Listing</span>
                <span className="text-[#00FF00] capitalize">{contractor.premium_listing}</span>
              </div>
              {contractor.rating_avg && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Rating</span>
                  <span className="text-[#00FF00] font-semibold">
                    {contractor.rating_avg.toFixed(1)} ⭐ ({contractor.rating_count})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Jobs</span>
                <span className="text-white font-semibold">{contractor.jobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Documents</span>
                <span className="text-white font-semibold">{contractor.documents}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

