-- Add escalation tracking columns to emergency_bookings table
-- These columns enable automatic doctor reassignment and admin fallback

ALTER TABLE public.emergency_bookings
ADD COLUMN IF NOT EXISTS escalation_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.emergency_bookings
ADD COLUMN IF NOT EXISTS needs_manual_attention boolean NOT NULL DEFAULT false;

ALTER TABLE public.emergency_bookings
ADD COLUMN IF NOT EXISTS last_escalated_at timestamp with time zone;

ALTER TABLE public.emergency_bookings
ADD COLUMN IF NOT EXISTS escalation_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create index on escalation columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_escalation_count ON public.emergency_bookings(escalation_count);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_needs_manual_attention ON public.emergency_bookings(needs_manual_attention);
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_last_escalated_at ON public.emergency_bookings(last_escalated_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_emergency_bookings_pending_escalation ON public.emergency_bookings(status, escalation_count, needs_manual_attention)
WHERE status = 'pending';
