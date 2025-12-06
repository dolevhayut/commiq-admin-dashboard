-- ========================================
-- Webhook Integration for Dolev's System
-- Supabase: qrcfnsmotffomtjusimg
-- Webhook: https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm
-- ========================================

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send webhook on new ticket
CREATE OR REPLACE FUNCTION notify_webhook_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm';
BEGIN
  PERFORM net.http_post(
    url := webhook_url,
    body := jsonb_build_object(
      'event', 'new_download_ticket',
      'ticket_id', NEW.id,
      'timestamp', NOW(),
      'ticket', to_jsonb(NEW)
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS webhook_new_ticket ON download_tickets;

CREATE TRIGGER webhook_new_ticket
  AFTER INSERT ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_webhook_new_ticket();

-- Function for status changes
CREATE OR REPLACE FUNCTION notify_webhook_status_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm';
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'event', 'ticket_status_changed',
        'ticket_id', NEW.id,
        'timestamp', NOW(),
        'old_status', OLD.status,
        'new_status', NEW.status,
        'ticket', to_jsonb(NEW)
      ),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS webhook_status_change ON download_tickets;

CREATE TRIGGER webhook_status_change
  AFTER UPDATE ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_webhook_status_change();

-- Function for OTP received
CREATE OR REPLACE FUNCTION notify_webhook_otp()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://hook.eu1.make.com/cnl5cf547ie9l3aoz3jmk4ir4oy6jlnm';
BEGIN
  IF OLD.otp_code IS NULL AND NEW.otp_code IS NOT NULL THEN
    PERFORM net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'event', 'otp_received',
        'ticket_id', NEW.id,
        'timestamp', NOW(),
        'otp_code', NEW.otp_code,
        'ticket', to_jsonb(NEW)
      ),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for OTP
DROP TRIGGER IF EXISTS webhook_otp ON download_tickets;

CREATE TRIGGER webhook_otp
  AFTER UPDATE ON download_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_webhook_otp();

-- Verify
SELECT 'Webhook triggers created successfully!' as status;

