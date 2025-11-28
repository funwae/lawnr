'use client';

import type { PlatformAnalytics } from '@/lib/types/analytics';

interface MetricsCardsProps {
  analytics: PlatformAnalytics;
}

export default function MetricsCards({ analytics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
        <div className="text-gray-400 text-sm mb-2">Total Users</div>
        <div className="text-3xl font-bold text-[#00FF00]">
          {analytics.total_users || 0}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {analytics.total_homeowners || 0} homeowners, {analytics.total_contractors || 0} contractors
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
        <div className="text-gray-400 text-sm mb-2">Total Jobs</div>
        <div className="text-3xl font-bold text-[#00FF00]">
          {analytics.total_jobs || 0}
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
        <div className="text-gray-400 text-sm mb-2">Total Revenue</div>
        <div className="text-3xl font-bold text-[#00FF00]">
          ${(analytics.total_revenue || 0).toLocaleString()}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Commission: ${(analytics.total_commission || 0).toLocaleString()}
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
        <div className="text-gray-400 text-sm mb-2">Avg Order Value</div>
        <div className="text-3xl font-bold text-[#00FF00]">
          ${(analytics.average_order_value || 0).toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Repeat rate: {((analytics.repeat_customer_rate || 0) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

