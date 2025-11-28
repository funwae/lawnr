'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/utils/api';
import type { Job } from '@/lib/types/job';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await apiClient.get<{ job: Job }>(`/jobs/${params.id}`);
        if (response.data) {
          setJob(response.data.job);
        } else {
          setError(response.error?.message || 'Failed to load job');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading job details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
        {error || 'Job not found'}
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
          ← Back to Jobs
        </button>
        <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Job Details</h1>
        <p className="text-gray-400">Job ID: {job.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Schedule</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Date</label>
              <p className="text-white">
                {new Date(job.scheduled_date).toLocaleDateString()}
              </p>
            </div>
            {job.scheduled_time_from && (
              <div>
                <label className="text-sm text-gray-400">Time</label>
                <p className="text-white">
                  {job.scheduled_time_from}
                  {job.scheduled_time_to && ` - ${job.scheduled_time_to}`}
                </p>
              </div>
            )}
            {job.actual_start && (
              <div>
                <label className="text-sm text-gray-400">Started</label>
                <p className="text-white">
                  {new Date(job.actual_start).toLocaleString()}
                </p>
              </div>
            )}
            {job.actual_end && (
              <div>
                <label className="text-sm text-gray-400">Completed</label>
                <p className="text-white">
                  {new Date(job.actual_end).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Status</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Current Status</label>
              <p className="text-white font-semibold capitalize">{job.status}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Contractor ID</label>
              <p className="text-white text-sm">{job.contractor_id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Property ID</label>
              <p className="text-white text-sm">{job.property_id}</p>
            </div>
          </div>
        </div>

        {job.cost_log && (
          <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Cost Log</h2>
            <pre className="text-white text-sm bg-black p-4 rounded">
              {JSON.stringify(job.cost_log, null, 2)}
            </pre>
          </div>
        )}

        {(job.before_media?.length || job.after_media?.length) && (
          <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Media</h2>
            {job.before_media && job.before_media.length > 0 && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Before</label>
                <div className="grid grid-cols-2 gap-2">
                  {job.before_media.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00FF00] hover:underline text-sm"
                    >
                      Image {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {job.after_media && job.after_media.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">After</label>
                <div className="grid grid-cols-2 gap-2">
                  {job.after_media.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00FF00] hover:underline text-sm"
                    >
                      Image {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

