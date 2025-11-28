'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface JobVolumeChartProps {
  data: Array<{
    date: string;
    jobs: number;
  }>;
}

export default function JobVolumeChart({ data }: JobVolumeChartProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#00FF00] mb-4">Job Volume</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #00FF00',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="jobs" fill="#00FF00" name="Jobs" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

