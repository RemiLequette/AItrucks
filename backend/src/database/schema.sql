-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types
CREATE TYPE user_role AS ENUM ('viewer', 'delivery_creator', 'trip_planner', 'admin');
CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'inactive');
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
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
CREATE TABLE deliveries (
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
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
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
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip deliveries junction table (many-to-many with order)
CREATE TABLE trip_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL, -- order of delivery in the trip
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, delivery_id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_scheduled_date ON deliveries(scheduled_date);
CREATE INDEX idx_deliveries_location ON deliveries USING GIST(delivery_location);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(current_location);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trip_deliveries_trip ON trip_deliveries(trip_id);
CREATE INDEX idx_trip_deliveries_delivery ON trip_deliveries(delivery_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
