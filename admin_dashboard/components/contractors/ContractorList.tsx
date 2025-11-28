'use client';

import type { ContractorListResponse, ContractorProfile } from '@/lib/types/contractor';
import { apiClient } from '@/lib/utils/api';
import { useEffect, useState } from 'react';
import ContractorCard from './ContractorCard';

interface ContractorListProps {
  filters?: {
    is_verified?: boolean;
    premium_listing?: string;
    min_rating?: number;
  };
}

export default function ContractorList({ filters = {} }: ContractorListProps) {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchContractors() {
      try {
        const queryParams = new URLSearchParams();
        if (filters.is_verified !== undefined) {
          queryParams.append('is_verified', filters.is_verified.toString());
        }
        if (filters.premium_listing) {
          queryParams.append('premium_listing', filters.premium_listing);
        }
        if (filters.min_rating) {
          queryParams.append('min_rating', filters.min_rating.toString());
        }

        const endpoint = `/admin/contractors${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiClient.get<ContractorListResponse>(endpoint);

        if (response.data) {
          setContractors(response.data.contractors);
        } else {
          setError(response.error?.message || 'Failed to load contractors');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contractors');
      } finally {
        setLoading(false);
      }
    }

    fetchContractors();
  }, [filters]);

  const filteredContractors = contractors.filter((contractor) =>
    contractor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading contractors...</div>
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
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search contractors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContractors.map((contractor) => (
          <ContractorCard key={contractor.id} contractor={contractor} />
        ))}
      </div>

      {filteredContractors.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No contractors found
        </div>
      )}
    </div>
  );
}

