'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/utils/api';
import CommissionSettings from '@/components/settings/CommissionSettings';
import PricingSettings from '@/components/settings/PricingSettings';
import FeatureFlags from '@/components/settings/FeatureFlags';
import type { PlatformSettings } from '@/lib/types/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await apiClient.get<{ settings: PlatformSettings }>('/admin/settings');
        if (response.data) {
          setSettings(response.data.settings);
        } else {
          setError(response.error?.message || 'Failed to load settings');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.put('/admin/settings', { settings });
      if (response.data) {
        setSettings(response.data.settings);
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.error?.message || 'Failed to save settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#00FF00] text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00FF00] mb-2">Platform Settings</h1>
          <p className="text-gray-400">Configure platform-wide settings and features</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#00FF00] text-black font-semibold rounded-lg hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-300">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {settings.commission_rate && (
          <CommissionSettings
            commissionRate={settings.commission_rate.value}
            onChange={(value) => handleSettingChange('commission_rate', value)}
          />
        )}

        {settings.boost_price_monthly && (
          <PricingSettings
            boostPrice={settings.boost_price_monthly.value}
            featuredPrice={settings.featured_price_monthly?.value || '0'}
            minWithdrawal={settings.min_withdrawal_amount?.value || '0'}
            onChange={handleSettingChange}
          />
        )}

        <FeatureFlags settings={settings} onChange={handleSettingChange} />
      </div>
    </div>
  );
}

