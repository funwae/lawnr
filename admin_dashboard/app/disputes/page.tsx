'use client';

import { useState } from 'react';
import DisputeList from '@/components/disputes/DisputeList';

export default function DisputesPage() {
  const [filters, setFilters] = useState({
    status: '',
    dispute_type: '',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Disputes</h1>
        <p className="text-gray-400">Manage and resolve platform disputes</p>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Dispute Type</label>
            <select
              value={filters.dispute_type}
              onChange={(e) => setFilters({ ...filters, dispute_type: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            >
              <option value="">All Types</option>
              <option value="payment">Payment</option>
              <option value="quality">Quality</option>
              <option value="cancellation">Cancellation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <DisputeList filters={filters} />
    </div>
  );
}

