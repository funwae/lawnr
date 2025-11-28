-- Add disputes table for conflict resolution
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('payment', 'quality', 'cancellation', 'other')),
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_disputes_job ON disputes(job_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Add dispute evidence (media attachments)
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  evidence_type VARCHAR(20) NOT NULL CHECK (evidence_type IN ('photo', 'video', 'document')),
  media_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);

-- Add contractor verification documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('license', 'insurance', 'background_check', 'business_registration', 'other')),
  document_url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_verification_contractor ON verification_documents(contractor_id);
CREATE INDEX idx_verification_status ON verification_documents(status);
CREATE INDEX idx_verification_expires ON verification_documents(expires_at) WHERE status = 'approved';

-- Updated_at triggers
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_updated_at
  BEFORE UPDATE ON verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

