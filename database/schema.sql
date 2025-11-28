-- Supabase Database Schema for AI Trucks Delivery Planning System
-- This schema has been applied to your Supabase project
-- Project URL: https://tzukzotwqwwhvxgkwjud.supabase.co

-- Enable PostGIS extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types
CREATE TYPE user_role AS ENUM ('viewer', 'delivery_creator', 'trip_planner', 'admin');
CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'inactive');
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  capacity_weight DECIMAL(10, 2) NOT NULL, -- in kg
  capacity_volume DECIMAL(10, 2) NOT NULL, -- in cubic meters
  current_location GEOGRAPHY(POINT, 4326), -- PostGIS geography type
  status vehicle_status DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  delivery_address TEXT NOT NULL,
  delivery_location GEOGRAPHY(POINT, 4326) NOT NULL, -- lat/lng
  scheduled_date TIMESTAMP NOT NULL,
  weight DECIMAL(10, 2) NOT NULL, -- in kg
  volume DECIMAL(10, 2) NOT NULL, -- in cubic meters
  status delivery_status DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_location GEOGRAPHY(POINT, 4326),
  status trip_status DEFAULT 'planned',
  planned_start_time TIMESTAMP NOT NULL,
  planned_end_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  total_distance DECIMAL(10, 2), -- in km
  total_weight DECIMAL(10, 2), -- in kg
  total_volume DECIMAL(10, 2), -- in cubic meters
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip deliveries junction table (many-to-many with order)
CREATE TABLE public.trip_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL, -- order of delivery in the trip
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, delivery_id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_deliveries_scheduled_date ON public.deliveries(scheduled_date);
CREATE INDEX idx_deliveries_location ON public.deliveries USING GIST(delivery_location);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_location ON public.vehicles USING GIST(current_location);
CREATE INDEX idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trip_deliveries_trip ON public.trip_deliveries(trip_id);
CREATE INDEX idx_trip_deliveries_delivery ON public.trip_deliveries(delivery_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
