-- Add start_location column to vehicles table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS start_location TEXT;

COMMENT ON COLUMN public.vehicles.start_location IS 'Text address where the vehicle starts (depot/warehouse address)';
