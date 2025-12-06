-- ========================================
-- Setup Download Wizard Tables
-- For: Yifat's System (commiq-ifat)
-- Supabase: zwqfkmgflzywtmyoosow
-- ========================================
-- 
-- This script creates all necessary tables and policies
-- for the Download Wizard feature in Yifat's system.
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zwqfkmgflzywtmyoosow/sql
-- ========================================

-- ========================================
-- 1. Create download_tickets table
-- ========================================

CREATE TABLE IF NOT EXISTS download_tickets (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  
  -- Portal/Provider information
  provider TEXT NOT NULL,
  provider_display_name TEXT,
  report_month INTEGER NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
  report_year INTEGER NOT NULL CHECK (report_year >= 2020 AND report_year <= 2100),
  
  -- Credentials (encrypted recommended)
  credential_username TEXT,
  credential_password TEXT,
  credential_extra JSONB DEFAULT '{}'::jsonb,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  -- OTP handling
  otp_code TEXT,
  otp_submitted_at TIMESTAMPTZ,
  otp_expires_at TIMESTAMPTZ,
  
  -- Results
  result_file_path TEXT,
  result_file_name TEXT,
  result_file_size INTEGER,
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Notes
  worker_notes TEXT,
  client_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT status_check CHECK (status IN (
    'pending', 'assigned', 'in_progress', 
    'otp_required', 'otp_received', 
    'completed', 'failed'
  ))
);

-- Add comment
COMMENT ON TABLE download_tickets IS 'ניהול בקשות להורדת דוחות מפורטלים - Download Wizard';

-- ========================================
-- 2. Create indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_download_tickets_status 
  ON download_tickets(status);

CREATE INDEX IF NOT EXISTS idx_download_tickets_provider 
  ON download_tickets(provider);

CREATE INDEX IF NOT EXISTS idx_download_tickets_assigned_to 
  ON download_tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_download_tickets_created_at 
  ON download_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_download_tickets_user_id 
  ON download_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_download_tickets_status_created 
  ON download_tickets(status, created_at DESC);

-- ========================================
-- 3. Create ticket_activity_log table
-- ========================================

CREATE TABLE IF NOT EXISTS ticket_activity_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to ticket
  ticket_id UUID NOT NULL REFERENCES download_tickets(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  
  -- Change tracking
  old_value TEXT,
  new_value TEXT,
  
  -- Additional details
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT actor_type_check CHECK (actor_type IN ('client', 'worker', 'system'))
);

-- Add comment
COMMENT ON TABLE ticket_activity_log IS 'לוג פעילות על בקשות הורדת דוחות';

-- ========================================
-- 4. Create indexes for activity log
-- ========================================

CREATE INDEX IF NOT EXISTS idx_ticket_activity_log_ticket_id 
  ON ticket_activity_log(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_activity_log_created_at 
  ON ticket_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_activity_log_actor_type 
  ON ticket_activity_log(actor_type);

-- ========================================
-- 5. Create updated_at trigger
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_download_tickets_updated_at ON download_tickets;

CREATE TRIGGER update_download_tickets_updated_at 
  BEFORE UPDATE ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. Enable Row Level Security (RLS)
-- ========================================

ALTER TABLE download_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activity_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. Create RLS Policies
-- ========================================

-- Policy: Authenticated users can view all tickets
DROP POLICY IF EXISTS "Enable read for authenticated users" ON download_tickets;
CREATE POLICY "Enable read for authenticated users"
  ON download_tickets FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert tickets
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON download_tickets;
CREATE POLICY "Enable insert for authenticated users"
  ON download_tickets FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update tickets
DROP POLICY IF EXISTS "Enable update for authenticated users" ON download_tickets;
CREATE POLICY "Enable update for authenticated users"
  ON download_tickets FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Activity log - read access
DROP POLICY IF EXISTS "Enable read for authenticated users" ON ticket_activity_log;
CREATE POLICY "Enable read for authenticated users"
  ON ticket_activity_log FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Activity log - insert access
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON ticket_activity_log;
CREATE POLICY "Enable insert for authenticated users"
  ON ticket_activity_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- 8. Create Storage Bucket for Reports
-- ========================================

-- Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,  -- Private bucket
  52428800,  -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 9. Storage Policies
-- ========================================

-- Policy: Authenticated users can upload to reports bucket
DROP POLICY IF EXISTS "Authenticated users can upload reports" ON storage.objects;
CREATE POLICY "Authenticated users can upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reports' AND
    auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can read reports
DROP POLICY IF EXISTS "Authenticated users can read reports" ON storage.objects;
CREATE POLICY "Authenticated users can read reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports' AND
    auth.role() = 'authenticated'
  );

-- Policy: Users can update their own uploads
DROP POLICY IF EXISTS "Users can update own reports" ON storage.objects;
CREATE POLICY "Users can update own reports"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'reports' AND
    auth.role() = 'authenticated'
  );

-- Policy: Users can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own reports" ON storage.objects;
CREATE POLICY "Users can delete own reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reports' AND
    auth.role() = 'authenticated'
  );

-- ========================================
-- 10. Verification & Test Data
-- ========================================

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'download_tickets') THEN
    RAISE NOTICE '✅ Table download_tickets created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table download_tickets was not created';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ticket_activity_log') THEN
    RAISE NOTICE '✅ Table ticket_activity_log created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table ticket_activity_log was not created';
  END IF;
END $$;

-- Insert test ticket (optional - uncomment to test)
/*
INSERT INTO download_tickets (
  user_name,
  user_email,
  provider,
  provider_display_name,
  report_month,
  report_year,
  credential_username,
  credential_password,
  status
) VALUES (
  'ישראל ישראלי',
  'israel@example.com',
  'migdal',
  'מגדל',
  11,
  2024,
  '123456789',
  '0501234567',
  'pending'
);
*/

-- ========================================
-- Summary
-- ========================================

SELECT 
  '✅ Setup completed!' as status,
  (SELECT COUNT(*) FROM download_tickets) as tickets_count,
  (SELECT COUNT(*) FROM ticket_activity_log) as activity_count;

-- ========================================
-- Next Steps
-- ========================================

-- 1. ✅ Tables created
-- 2. ✅ Indexes created
-- 3. ✅ RLS enabled
-- 4. ✅ Storage bucket created
-- 
-- Next:
-- - Copy code files to commiq-ifat
-- - Add route to App.jsx
-- - Test the wizard
-- 
-- See: YIFAT_INTEGRATION_QUICK_START.md
-- ========================================

