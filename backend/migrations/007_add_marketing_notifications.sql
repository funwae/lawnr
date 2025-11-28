-- Add referral system
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type VARCHAR(20) CHECK (reward_type IN ('credit', 'discount', 'cash')),
  reward_amount NUMERIC(10,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Add promotion codes
CREATE TABLE IF NOT EXISTS promotion_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  min_order_value NUMERIC(10,2),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  applicable_to VARCHAR(20) CHECK (applicable_to IN ('all', 'homeowner', 'contractor', 'service_type')),
  applicable_service_types TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_promotion_codes_code ON promotion_codes(code);
CREATE INDEX idx_promotion_codes_active ON promotion_codes(is_active, valid_from, valid_until);
CREATE INDEX idx_promotion_codes_dates ON promotion_codes(valid_from, valid_until);

-- Add promotion code usage tracking
CREATE TABLE IF NOT EXISTS promotion_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_code_id UUID NOT NULL REFERENCES promotion_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_promo_usage_code ON promotion_code_usage(promotion_code_id);
CREATE INDEX idx_promo_usage_user ON promotion_code_usage(user_id);

-- Add notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_address VARCHAR(255),
  phone_number VARCHAR(50),
  job_reminders BOOLEAN DEFAULT TRUE,
  quote_notifications BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Updated_at triggers
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotion_codes_updated_at
  BEFORE UPDATE ON promotion_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

