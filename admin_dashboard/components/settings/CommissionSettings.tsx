'use client';

import { useState } from 'react';

interface CommissionSettingsProps {
  commissionRate: string;
  onChange: (value: string) => void;
}

export default function CommissionSettings({ commissionRate, onChange }: CommissionSettingsProps) {
  const [value, setValue] = useState(commissionRate);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  const percentage = (parseFloat(value) * 100).toFixed(1);

  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#00FF00] mb-4">Commission Rate</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Commission Rate ({percentage}%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter as decimal (0.10 = 10%)
          </p>
        </div>
      </div>
    </div>
  );
}

