-- Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO platform_settings (key, value, type, description) VALUES
  ('commission_rate', '0.10', 'number', 'Platform commission rate (0.10 = 10%)'),
  ('boost_price_monthly', '29.99', 'number', 'Monthly boost price'),
  ('featured_price_monthly', '99.99', 'number', 'Monthly featured listing price'),
  ('min_withdrawal_amount', '50.00', 'number', 'Minimum withdrawal amount for contractors'),
  ('feature_chat_enabled', 'true', 'boolean', 'Enable support chat feature'),
  ('feature_subscriptions_enabled', 'true', 'boolean', 'Enable subscription feature'),
  ('feature_route_optimization', 'false', 'boolean', 'Enable route optimization feature')
ON CONFLICT (key) DO NOTHING;

