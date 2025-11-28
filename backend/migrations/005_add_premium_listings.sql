-- Add premium listing subscriptions table
CREATE TABLE IF NOT EXISTS premium_listing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('boosted', 'featured')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_premium_listings_contractor ON premium_listing_subscriptions(contractor_id);
CREATE INDEX idx_premium_listings_dates ON premium_listing_subscriptions(start_date, end_date);
CREATE INDEX idx_premium_listings_active ON premium_listing_subscriptions(contractor_id, end_date) WHERE end_date >= CURRENT_DATE;

-- Function to update contractor premium_listing status based on active subscriptions
CREATE OR REPLACE FUNCTION update_contractor_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contractor_profiles
  SET premium_listing = (
    SELECT CASE
      WHEN EXISTS (
        SELECT 1 FROM premium_listing_subscriptions
        WHERE contractor_id = NEW.contractor_id
        AND listing_type = 'featured'
        AND end_date >= CURRENT_DATE
        AND payment_status = 'paid'
      ) THEN 'featured'
      WHEN EXISTS (
        SELECT 1 FROM premium_listing_subscriptions
        WHERE contractor_id = NEW.contractor_id
        AND listing_type = 'boosted'
        AND end_date >= CURRENT_DATE
        AND payment_status = 'paid'
      ) THEN 'boosted'
      ELSE 'none'
    END
  )
  WHERE user_id = NEW.contractor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update premium status when subscription changes
CREATE TRIGGER update_premium_status_on_subscription
  AFTER INSERT OR UPDATE ON premium_listing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_premium_status();

-- Updated_at trigger
CREATE TRIGGER update_premium_listings_updated_at
  BEFORE UPDATE ON premium_listing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

