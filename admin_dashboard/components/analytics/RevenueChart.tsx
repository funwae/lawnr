'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    commission: number;
  }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#00FF00] mb-4">Revenue Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#00FF00"
            strokeWidth={2}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="commission"
            stroke="#FFD700"
            strokeWidth={2}
            name="Commission"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

