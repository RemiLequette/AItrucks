-- Create function to get deliveries with text location format
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_deliveries_with_location()
RETURNS TABLE (
  id UUID,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  delivery_address TEXT,
  delivery_location TEXT,
  scheduled_date TIMESTAMP,
  weight DECIMAL,
  volume DECIMAL,
  status delivery_status,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.customer_name,
    d.customer_phone,
    d.delivery_address,
    ST_AsText(d.delivery_location::geometry) as delivery_location,
    d.scheduled_date,
    d.weight,
    d.volume,
    d.status,
    d.notes,
    d.created_by,
    d.created_at,
    d.updated_at
  FROM deliveries d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Similar function for vehicles
CREATE OR REPLACE FUNCTION get_vehicles_with_location()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  license_plate VARCHAR,
  capacity_weight DECIMAL,
  capacity_volume DECIMAL,
  current_location TEXT,
  start_location TEXT,
  status vehicle_status,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.license_plate,
    v.capacity_weight,
    v.capacity_volume,
    ST_AsText(v.current_location::geometry) as current_location,
    v.start_location,
    v.status,
    v.created_at,
    v.updated_at
  FROM vehicles v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
