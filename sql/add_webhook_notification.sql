-- ========================================
-- Webhook Integration for New Download Tickets
-- Sends notification to Make.com when new ticket is created
-- ========================================

-- Step 1: Enable pg_net extension (for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Create function to send webhook notification
CREATE OR REPLACE FUNCTION notify_new_download_ticket()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm';
  payload JSONB;
BEGIN
  -- Build the payload with all ticket details
  payload := jsonb_build_object(
    'event', 'new_download_ticket',
    'ticket_id', NEW.id,
    'timestamp', NOW(),
    'ticket', jsonb_build_object(
      'id', NEW.id,
      'user_name', NEW.user_name,
      'user_email', NEW.user_email,
      'user_phone', NEW.user_phone,
      'provider', NEW.provider,
      'provider_display_name', NEW.provider_display_name,
      'report_month', NEW.report_month,
      'report_year', NEW.report_year,
      'status', NEW.status,
      'credential_username', NEW.credential_username,
      'assigned_to', NEW.assigned_to,
      'assigned_at', NEW.assigned_at,
      'created_at', NEW.created_at
    )
  );

  -- Send HTTP POST request to webhook (async)
  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger on INSERT
DROP TRIGGER IF EXISTS on_new_download_ticket ON download_tickets;

CREATE TRIGGER on_new_download_ticket
  AFTER INSERT ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_download_ticket();

-- ========================================
-- Optional: Webhook for Status Updates
-- ========================================

CREATE OR REPLACE FUNCTION notify_ticket_status_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm';
  payload JSONB;
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    payload := jsonb_build_object(
      'event', 'ticket_status_changed',
      'ticket_id', NEW.id,
      'timestamp', NOW(),
      'old_status', OLD.status,
      'new_status', NEW.status,
      'ticket', jsonb_build_object(
        'id', NEW.id,
        'user_name', NEW.user_name,
        'provider', NEW.provider,
        'provider_display_name', NEW.provider_display_name,
        'report_month', NEW.report_month,
        'report_year', NEW.report_year,
        'status', NEW.status,
        'otp_code', NEW.otp_code,
        'result_file_path', NEW.result_file_path,
        'result_file_name', NEW.result_file_name,
        'completed_at', NEW.completed_at,
        'error_message', NEW.error_message
      )
    );

    PERFORM net.http_post(
      url := webhook_url,
      body := payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on UPDATE
DROP TRIGGER IF EXISTS on_ticket_status_change ON download_tickets;

CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_status_change();

-- ========================================
-- Optional: Webhook for OTP Received
-- ========================================

CREATE OR REPLACE FUNCTION notify_otp_received()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm';
  payload JSONB;
BEGIN
  -- Only notify if OTP code was just added
  IF OLD.otp_code IS NULL AND NEW.otp_code IS NOT NULL THEN
    payload := jsonb_build_object(
      'event', 'otp_received',
      'ticket_id', NEW.id,
      'timestamp', NOW(),
      'otp_code', NEW.otp_code,
      'ticket', jsonb_build_object(
        'id', NEW.id,
        'user_name', NEW.user_name,
        'provider', NEW.provider,
        'provider_display_name', NEW.provider_display_name,
        'report_month', NEW.report_month,
        'report_year', NEW.report_year,
        'otp_submitted_at', NEW.otp_submitted_at,
        'assigned_to', NEW.assigned_to
      )
    );

    PERFORM net.http_post(
      url := webhook_url,
      body := payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for OTP
DROP TRIGGER IF EXISTS on_otp_received ON download_tickets;

CREATE TRIGGER on_otp_received
  AFTER UPDATE ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_otp_received();

-- ========================================
-- Test the webhook (optional)
-- ========================================

-- Uncomment to test:
/*
INSERT INTO download_tickets (
  user_name,
  user_email,
  provider,
  provider_display_name,
  report_month,
  report_year,
  credential_username,
  status
) VALUES (
  'Test User',
  'test@example.com',
  'migdal',
  'מגדל',
  12,
  2024,
  '123456789',
  'pending'
);

-- Check the webhook received the notification!
*/

-- ========================================
-- Summary
-- ========================================

SELECT 
  'Webhook integration installed!' as status,
  'New tickets will be sent to Make.com' as info;

-- ========================================
-- Webhook Events
-- ========================================

-- The webhook will receive these events:
-- 1. new_download_ticket - when ticket is created
-- 2. ticket_status_changed - when status changes
-- 3. otp_received - when OTP code is submitted

-- Payload structure:
-- {
--   "event": "new_download_ticket",
--   "ticket_id": "uuid",
--   "timestamp": "2024-12-06T...",
--   "ticket": {
--     "id": "uuid",
--     "user_name": "...",
--     "provider": "migdal",
--     "report_month": 11,
--     "report_year": 2024,
--     ...
--   }
-- }

