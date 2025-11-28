-- Make delivery_location optional
-- Run this in the Supabase SQL Editor

ALTER TABLE public.deliveries 
  ALTER COLUMN delivery_location DROP NOT NULL;

-- Add a comment to document that deliveries without location are considered invalid
COMMENT ON COLUMN public.deliveries.delivery_location IS 'Geographic coordinates for the delivery. NULL values indicate deliveries that need geocoding before they can be assigned to trips.';
