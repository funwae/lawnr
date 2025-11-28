'use client';

import JobVolumeChart from '@/components/analytics/JobVolumeChart';
import MetricsCards from '@/components/analytics/MetricsCards';
import RevenueChart from '@/components/analytics/RevenueChart';
import TopContractors from '@/components/analytics/TopContractors';
import type { PlatformAnalytics } from '@/lib/types/analytics';
import { apiClient } from '@/lib/utils/api';
import { useEffect, useState } from 'react';

interface DashboardData {
  analytics: PlatformAnalytics;
  pending: {
    verifications: number;
    disputes: number;
  };
  recent: {
    verifications: any[];
    disputes: any[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await apiClient.get<DashboardData>('/admin/dashboard');
        if (response.data) {
          setData(response.data);
        } else {
          setError(response.error?.message || 'Failed to load dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // Generate mock chart data (in real app, this would come from API)
  const revenueData = [
    { date: 'Week 1', revenue: 5000, commission: 500 },
    { date: 'Week 2', revenue: 7500, commission: 750 },
    { date: 'Week 3', revenue: 6000, commission: 600 },
    { date: 'Week 4', revenue: 8500, commission: 850 },
  ];

  const jobVolumeData = [
    { date: 'Week 1', jobs: 45 },
    { date: 'Week 2', jobs: 62 },
    { date: 'Week 3', jobs: 58 },
    { date: 'Week 4', jobs: 71 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading dashboard...</div>
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

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Dashboard</h1>
          <p className="text-gray-400">Platform overview and metrics</p>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
            className="px-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white"
          />
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
            className="px-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white"
          />
        </div>
      </div>

      <MetricsCards analytics={data.analytics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <JobVolumeChart data={jobVolumeData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopContractors analytics={data.analytics} />

        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-[#00FF00] mb-4">Popular Services</h3>
          {data.analytics.popular_services && data.analytics.popular_services.length > 0 ? (
            <div className="space-y-3">
              {data.analytics.popular_services.map((service, index) => (
                <div
                  key={service.service}
                  className="flex items-center justify-between p-3 bg-black rounded border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#00FF00] text-black rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="text-white font-semibold capitalize">
                      {service.service.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-[#00FF00] font-semibold">{service.count} jobs</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No data available</p>
          )}
        </div>
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Pending Verifications</h2>
          <div className="text-4xl font-bold text-white mb-2">{data.pending.verifications}</div>
          <a
            href="/contractors?filter=pending"
            className="text-[#00FF00] hover:underline text-sm"
          >
            View all →
          </a>
        </div>

        <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Open Disputes</h2>
          <div className="text-4xl font-bold text-white mb-2">{data.pending.disputes}</div>
          <a
            href="/disputes?status=open"
            className="text-[#00FF00] hover:underline text-sm"
          >
            View all →
          </a>
        </div>
      </div>
    </div>
  );
}
