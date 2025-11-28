-- Add request_media table for service request media uploads
CREATE TABLE IF NOT EXISTS request_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video')),
  thumbnail_url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_request_media_service_request ON request_media(service_request_id);

-- Add updated_at trigger
CREATE TRIGGER update_request_media_updated_at
  BEFORE UPDATE ON request_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

