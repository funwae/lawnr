'use client';

import type { PlatformAnalytics } from '@/lib/types/analytics';

interface TopContractorsProps {
  analytics: PlatformAnalytics;
}

export default function TopContractors({ analytics }: TopContractorsProps) {
  const topContractors = analytics.top_contractors || [];

  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#00FF00] mb-4">Top Contractors</h3>
      {topContractors.length === 0 ? (
        <p className="text-gray-400">No data available</p>
      ) : (
        <div className="space-y-3">
          {topContractors.slice(0, 10).map((contractor, index) => (
            <div
              key={contractor.contractor_id}
              className="flex items-center justify-between p-3 bg-black rounded border border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00FF00] text-black rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {contractor.business_name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {contractor.job_count} jobs
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#00FF00] font-semibold">
                  ${contractor.total_earnings.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

