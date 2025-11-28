'use client';

import { useState } from 'react';
import JobList from '@/components/jobs/JobList';

export default function JobsPage() {
  const [filters, setFilters] = useState({
    status: '',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Jobs</h1>
        <p className="text-gray-400">View and manage all platform jobs</p>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="on_way">On the Way</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <JobList filters={filters} />
    </div>
  );
}

