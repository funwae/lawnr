'use client';

interface FeatureFlagsProps {
  settings: Record<string, { value: string; type: string; description?: string }>;
  onChange: (key: string, value: string) => void;
}

export default function FeatureFlags({ settings, onChange }: FeatureFlagsProps) {
  const featureFlags = Object.entries(settings).filter(
    ([key]) => key.startsWith('feature_')
  );

  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#00FF00] mb-4">Feature Flags</h3>
      <div className="space-y-4">
        {featureFlags.map(([key, setting]) => {
          const isEnabled = setting.value === 'true';
          return (
            <div key={key} className="flex items-center justify-between p-3 bg-black rounded border border-gray-700">
              <div>
                <div className="text-white font-semibold capitalize">
                  {key.replace('feature_', '').replace('_', ' ')}
                </div>
                {setting.description && (
                  <div className="text-gray-400 text-sm mt-1">{setting.description}</div>
                )}
              </div>
              <button
                onClick={() => onChange(key, isEnabled ? 'false' : 'true')}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  isEnabled
                    ? 'bg-[#00FF00] text-black'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {isEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

