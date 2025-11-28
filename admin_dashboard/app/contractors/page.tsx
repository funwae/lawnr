'use client';

import ContractorList from '@/components/contractors/ContractorList';
import { useState } from 'react';

export default function ContractorsPage() {
  const [filters, setFilters] = useState({
    is_verified: undefined as boolean | undefined,
    premium_listing: '',
    min_rating: undefined as number | undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Contractors</h1>
          <p className="text-gray-400">Manage contractor profiles and verifications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Verification Status</label>
            <select
              value={filters.is_verified === undefined ? '' : filters.is_verified.toString()}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  is_verified: e.target.value === '' ? undefined : e.target.value === 'true',
                })
              }
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Premium Listing</label>
            <select
              value={filters.premium_listing}
              onChange={(e) =>
                setFilters({ ...filters, premium_listing: e.target.value })
              }
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            >
              <option value="">All</option>
              <option value="boosted">Boosted</option>
              <option value="featured">Featured</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Min Rating</label>
            <select
              value={filters.min_rating || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  min_rating: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            >
              <option value="">All</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      <ContractorList filters={filters} />
    </div>
  );
}

