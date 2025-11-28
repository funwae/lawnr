'use client';

import { useState } from 'react';

interface PricingSettingsProps {
  boostPrice: string;
  featuredPrice: string;
  minWithdrawal: string;
  onChange: (key: string, value: string) => void;
}

export default function PricingSettings({
  boostPrice,
  featuredPrice,
  minWithdrawal,
  onChange,
}: PricingSettingsProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#00FF00] mb-4">Pricing</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Boost Price (Monthly)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={boostPrice}
            onChange={(e) => onChange('boost_price_monthly', e.target.value)}
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Featured Price (Monthly)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={featuredPrice}
            onChange={(e) => onChange('featured_price_monthly', e.target.value)}
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Min Withdrawal Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={minWithdrawal}
            onChange={(e) => onChange('min_withdrawal_amount', e.target.value)}
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
          />
        </div>
      </div>
    </div>
  );
}

