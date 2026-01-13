-- Add is_read column if it does not exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Create index for faster queries on is_read
CREATE INDEX IF NOT EXISTS idx_invoices_is_read ON invoices(is_read);

-- Enable realtime for invoices table (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
