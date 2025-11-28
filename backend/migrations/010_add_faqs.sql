-- FAQ Table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_order ON faqs("order");

-- Insert sample FAQs
INSERT INTO faqs (category, question, answer, "order") VALUES
  ('Getting Started', 'How do I create an account?', 'Download the Lawnr app and tap "Sign Up". Enter your email, create a password, and choose whether you are a homeowner or contractor.', 1),
  ('Getting Started', 'How do I request a service?', 'After creating an account, add a property, then tap "Request Service" to create a service request with your preferences.', 2),
  ('Payments', 'How do I pay for services?', 'Payment is processed securely through the app after job completion. You can use credit/debit cards or bank transfer.', 1),
  ('Payments', 'When am I charged?', 'You are charged after the contractor marks the job as completed and you confirm satisfaction.', 2),
  ('Contractors', 'How do I become a verified contractor?', 'Complete your profile, upload required documents (license, insurance), and wait for admin verification.', 1),
  ('Support', 'How do I contact support?', 'Use the Support section in the app to chat with our team or file a dispute if needed.', 1)
ON CONFLICT DO NOTHING;

