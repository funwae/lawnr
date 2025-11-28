export interface PlatformSetting {
  value: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
}

export interface PlatformSettings {
  [key: string]: PlatformSetting;
}

export interface SettingsResponse {
  settings: PlatformSettings;
}

