-- Add consultation type (online/offline) support to appointments system
-- This migration adds consultation_type column to appointments table only

DO $$
BEGIN
  -- Step 1: Add consultation_type to appointments table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'consultation_type'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN consultation_type TEXT NOT NULL DEFAULT 'online' 
    CHECK (consultation_type IN ('online', 'offline'));
    
    CREATE INDEX IF NOT EXISTS idx_appointments_consultation_type 
      ON public.appointments(consultation_type);
  END IF;

  -- Step 2: Add meeting_url for online consultations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'meeting_url'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN meeting_url TEXT;
  END IF;

  -- Step 3: Add meeting_password for online consultations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'meeting_password'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN meeting_password TEXT;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Column addition note: %', SQLERRM;
END $$;

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_type 
  ON public.appointments(doctor_id, consultation_type);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_type 
  ON public.appointments(patient_id, consultation_type);

-- Add comments to document the new columns
COMMENT ON COLUMN public.appointments.consultation_type IS 'Type of consultation: online or offline';
COMMENT ON COLUMN public.appointments.meeting_url IS 'Video meeting URL for online consultations (e.g., Zoom, Google Meet) - filled by doctor after approval';
COMMENT ON COLUMN public.appointments.meeting_password IS 'Password for online meeting (if required) - filled by doctor after approval';
