-- Add label_storage_url and expires_at columns to shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS label_storage_url TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index on expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_shipments_expires_at ON shipments(expires_at);

-- Add comment to explain the columns
COMMENT ON COLUMN shipments.label_storage_url IS 'Public URL to the label PDF stored in Vercel Blob';
COMMENT ON COLUMN shipments.expires_at IS 'Expiration date for the stored label (90 days from creation)';
