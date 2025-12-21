-- Migration: Add notification preferences to profiles table
-- Date: 2025-12-15
-- Description: Adds send_whatsapp and send_email columns to allow users to control notification channels

-- Add notification preference columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS send_whatsapp boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS send_email boolean NOT NULL DEFAULT true;

-- Create index for notification preference queries
CREATE INDEX IF NOT EXISTS idx_profiles_send_whatsapp ON public.profiles(send_whatsapp)
WHERE send_whatsapp = true;

CREATE INDEX IF NOT EXISTS idx_profiles_send_email ON public.profiles(send_email)
WHERE send_email = true;

-- Composite index for finding doctors with specific preferences
CREATE INDEX IF NOT EXISTS idx_profiles_notification_prefs ON public.profiles(send_whatsapp, send_email)
WHERE send_whatsapp = true OR send_email = true;

-- Update trigger to track preference changes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;

CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Grant RLS access for notification preference queries
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own preferences
DROP POLICY IF EXISTS "Users can read own notification preferences" ON public.profiles;
CREATE POLICY "Users can read own notification preferences"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own preferences
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.profiles;
CREATE POLICY "Users can update own notification preferences"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.send_whatsapp IS 'User preference for WhatsApp notifications (calls, messages via Twilio)';
COMMENT ON COLUMN public.profiles.send_email IS 'User preference for email notifications (SendGrid)';
