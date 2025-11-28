-- Add subscriptions table for recurring maintenance
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_types TEXT[] NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'custom')),
  frequency_value INTEGER, -- For custom frequencies (e.g., every 3 weeks)
  next_service_date DATE NOT NULL,
  preferred_time_from TIME,
  preferred_time_to TIME,
  quoted_price NUMERIC(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  auto_accept_quote BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subscriptions_homeowner ON subscriptions(homeowner_id);
CREATE INDEX idx_subscriptions_contractor ON subscriptions(contractor_id);
CREATE INDEX idx_subscriptions_property ON subscriptions(property_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_service ON subscriptions(next_service_date) WHERE status = 'active';

-- Subscription service history (tracks each service instance)
CREATE TABLE IF NOT EXISTS subscription_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'skipped', 'completed', 'cancelled')),
  skipped_at TIMESTAMP WITH TIME ZONE,
  skipped_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_subscription_services_subscription ON subscription_services(subscription_id);
CREATE INDEX idx_subscription_services_date ON subscription_services(scheduled_date);
CREATE INDEX idx_subscription_services_status ON subscription_services(status);

-- Updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_services_updated_at
  BEFORE UPDATE ON subscription_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

