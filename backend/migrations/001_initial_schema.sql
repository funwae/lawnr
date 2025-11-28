-- Lawnr Database Schema
-- PostgreSQL with PostGIS extension for geolocation support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('homeowner','contractor','admin')),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  fcm_token TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- CONTRACTOR_PROFILES
CREATE TABLE contractor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_logo_url TEXT,
  description TEXT,
  service_area_geom GEOGRAPHY,
  service_types TEXT[],
  base_rate_per_hour NUMERIC(10,2),
  per_service_rate JSONB,
  availability JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  premium_listing VARCHAR(20) DEFAULT 'none' CHECK (premium_listing IN ('none','boosted','featured')),
  rating_avg NUMERIC(3,2) DEFAULT NULL,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_contractor_profiles_user_id ON contractor_profiles(user_id);
CREATE INDEX idx_contractor_profiles_service_types ON contractor_profiles USING GIN(service_types);
CREATE INDEX idx_contractor_profiles_geo ON contractor_profiles USING GIST(service_area_geom);

-- PROPERTIES
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  geo_location GEOGRAPHY,
  yard_size_estimate VARCHAR(20),
  yard_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_geo ON properties USING GIST(geo_location);

-- PROPERTY_MEDIA
CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  media_type VARCHAR(10) CHECK (media_type IN ('photo','video')),
  media_url TEXT NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_media_property_id ON property_media(property_id);

-- SERVICE_REQUESTS
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_services TEXT[] NOT NULL,
  schedule_preference VARCHAR(20) NOT NULL CHECK (schedule_preference IN ('ASAP','scheduled')),
  preferred_date DATE,
  preferred_time_from TIME,
  preferred_time_to TIME,
  notes TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','quoted','accepted','scheduled','cancelled','expired')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_requests_property_id ON service_requests(property_id);
CREATE INDEX idx_service_requests_homeowner_id ON service_requests(homeowner_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_services ON service_requests USING GIN(requested_services);

-- QUOTES
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quoted_price NUMERIC(10,2) NOT NULL,
  breakdown JSONB,
  valid_until TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','accepted','rejected','expired')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_service_request_id ON quotes(service_request_id);
CREATE INDEX idx_quotes_contractor_id ON quotes(contractor_id);
CREATE INDEX idx_quotes_status ON quotes(status);

-- JOBS
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  scheduled_date DATE NOT NULL,
  scheduled_time_from TIME,
  scheduled_time_to TIME,
  status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled','on_way','started','completed','cancelled')),
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  before_media JSONB,
  after_media JSONB,
  cost_log JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_quote_id ON jobs(quote_id);
CREATE INDEX idx_jobs_contractor_id ON jobs(contractor_id);
CREATE INDEX idx_jobs_property_id ON jobs(property_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);

-- INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES users(id),
  contractor_id UUID NOT NULL REFERENCES users(id),
  amount_total NUMERIC(10,2) NOT NULL,
  platform_commission NUMERIC(10,2) NOT NULL,
  contractor_payout NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(20),
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending','paid','failed','refunded')),
  issued_at TIMESTAMP NOT NULL DEFAULT now(),
  paid_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_homeowner_id ON invoices(homeowner_id);
CREATE INDEX idx_invoices_contractor_id ON invoices(contractor_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);

-- REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES users(id),
  contractor_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_reviews_contractor_id ON reviews(contractor_id);

-- SUBSCRIPTIONS (Recurring Jobs)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homeowner_id UUID NOT NULL REFERENCES users(id),
  contractor_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  service_types TEXT[] NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  next_scheduled_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_homeowner_id ON subscriptions(homeowner_id);
CREATE INDEX idx_subscriptions_contractor_id ON subscriptions(contractor_id);
CREATE INDEX idx_subscriptions_property_id ON subscriptions(property_id);
CREATE INDEX idx_subscriptions_next_date ON subscriptions(next_scheduled_date);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  job_id UUID,
  type VARCHAR(30) NOT NULL,
  payload JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','sent','read')),
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_job_id ON notifications(job_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

-- SUPPORT_TICKETS / DISPUTES
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  homeowner_id UUID NOT NULL REFERENCES users(id),
  contractor_id UUID NOT NULL REFERENCES users(id),
  issue_type VARCHAR(30),
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open','in_review','resolved','rejected')),
  resolution_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_job_id ON disputes(job_id);
CREATE INDEX idx_disputes_status ON disputes(status);

