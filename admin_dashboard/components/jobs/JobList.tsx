'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/utils/api';
import type { Job, JobListResponse } from '@/lib/types/job';
import Link from 'next/link';

interface JobListProps {
  filters?: {
    status?: string;
    contractor_id?: string;
  };
}

export default function JobList({ filters = {} }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchJobs() {
      try {
        const queryParams = new URLSearchParams();
        if (filters.status) {
          queryParams.append('status', filters.status);
        }
        if (filters.contractor_id) {
          queryParams.append('contractor_id', filters.contractor_id);
        }

        const endpoint = `/admin/jobs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiClient.get<JobListResponse>(endpoint);

        if (response.data) {
          setJobs(response.data.jobs);
        } else {
          setError(response.error?.message || 'Failed to load jobs');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'started':
      case 'on_way':
        return 'bg-blue-500';
      case 'scheduled':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading jobs...</div>
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
              <th className="text-left p-4 text-[#00FF00] font-semibold">Job ID</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Scheduled Date</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Status</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Contractor</th>
              <th className="text-left p-4 text-[#00FF00] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-gray-700 hover:bg-[#1A1A1A] transition-colors"
              >
                <td className="p-4">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-[#00FF00] hover:underline"
                  >
                    {job.id.slice(0, 8)}...
                  </Link>
                </td>
                <td className="p-4 text-white">
                  {new Date(job.scheduled_date).toLocaleDateString()}
                  {job.scheduled_time_from && (
                    <span className="text-gray-400 text-sm ml-2">
                      {job.scheduled_time_from}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded text-white ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="p-4 text-gray-300 text-sm">{job.contractor_id.slice(0, 8)}...</td>
                <td className="p-4">
                  <Link
                    href={`/jobs/${job.id}`}
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

      {jobs.length === 0 && (
        <div className="text-center py-12 text-gray-400">No jobs found</div>
      )}
    </div>
  );
}

