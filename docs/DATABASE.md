# Database Documentation

## Overview

AItrucks uses Supabase (PostgreSQL 15) with the PostGIS extension for geospatial data. The database schema is designed for delivery planning and fleet management with proper relationships, indexes, and Row Level Security policies.

## Database Provider

- **Platform**: Supabase
- **Database**: PostgreSQL 15
- **Extensions**: PostGIS (geography/geometry types)
- **Project URL**: https://tzukzotwqwwhvxgkwjud.supabase.co

## Schema Overview

### Tables
1. `users` - User profiles extending Supabase auth.users
2. `vehicles` - Fleet vehicles with capacity and location
3. `deliveries` - Delivery orders with customer and location info
4. `trips` - Planned trips assigned to vehicles
5. `trip_deliveries` - Junction table linking deliveries to trips with sequence

### Enums
- `user_role`: `viewer`, `delivery_creator`, `trip_planner`, `admin`
- `delivery_status`: `pending`, `assigned`, `in_transit`, `delivered`, `failed`
- `vehicle_status`: `available`, `in_use`, `maintenance`, `inactive`
- `trip_status`: `planned`, `in_progress`, `completed`, `cancelled`

## Table Schemas

### users
Extends Supabase's `auth.users` with application-specific fields.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_users_email` on email
- `idx_users_role` on role

**Relationships:**
- References `auth.users(id)` (Supabase built-in)
- Referenced by `deliveries.created_by`
- Referenced by `trips.created_by`

### vehicles
Fleet management with capacity constraints and location tracking.

```sql
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  capacity_weight DECIMAL(10, 2) NOT NULL,  -- kg
  capacity_volume DECIMAL(10, 2) NOT NULL,  -- m³
  start_location GEOGRAPHY(POINT, 4326),    -- PostGIS: default starting location
  current_location GEOGRAPHY(POINT, 4326),  -- PostGIS: current position (optional)
  status vehicle_status DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_vehicles_status` on status
- `idx_vehicles_location` GIST index on current_location (spatial)

**Relationships:**
- Referenced by `trips.vehicle_id`

**PostGIS Notes:**
- `start_location` stores the vehicle's default starting point (e.g., depot, garage)
  - Used as the default trip starting location when creating new trips
  - Configured once per vehicle
- `current_location` stores real-time vehicle position (optional)
  - Updated during active trips to track vehicle movement
  - May differ from start_location when vehicle is in use
- Both use `GEOGRAPHY(POINT, 4326)` - SRID 4326 = WGS84 (standard GPS)
- Insert with `ST_GeogFromText('POINT(lng lat)')`

### deliveries
Customer delivery orders with location and scheduling.

```sql
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  delivery_address TEXT NOT NULL,
  delivery_location GEOGRAPHY(POINT, 4326) NOT NULL,  -- Required
  scheduled_date TIMESTAMP NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,  -- kg
  volume DECIMAL(10, 2) NOT NULL,  -- m³
  status delivery_status DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_deliveries_status` on status
- `idx_deliveries_scheduled_date` on scheduled_date
- `idx_deliveries_location` GIST index on delivery_location (spatial)

**Relationships:**
- References `users.id` (created_by)
- Referenced by `trip_deliveries.delivery_id`

**Business Rules:**
- `delivery_location` is required (validated before map display)
- Weight in kilograms, volume in cubic meters
- Status changes: `pending` → `assigned` → `in_transit` → `delivered`/`failed`

### trips
Planned delivery routes assigned to vehicles.

```sql
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_location GEOGRAPHY(POINT, 4326),  -- Optional trip starting point
  status trip_status DEFAULT 'planned',
  planned_start_time TIMESTAMP NOT NULL,
  planned_end_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  total_distance DECIMAL(10, 2),  -- km
  total_weight DECIMAL(10, 2),    -- kg (calculated from deliveries)
  total_volume DECIMAL(10, 2),    -- m³ (calculated from deliveries)
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_trips_vehicle` on vehicle_id
- `idx_trips_status` on status

**Relationships:**
- References `vehicles.id` (vehicle_id) - CASCADE DELETE
- References `users.id` (created_by)
- Referenced by `trip_deliveries.trip_id`

**Business Rules:**
- `start_location` is optional - can specify where the trip begins
- `total_weight` and `total_volume` calculated dynamically from assigned deliveries
- Must not exceed vehicle capacity (capacity_weight and capacity_volume)
- Status workflow: `planned` → `in_progress` → `completed`/`cancelled`

### trip_deliveries
Junction table linking deliveries to trips with sequence order.

```sql
CREATE TABLE public.trip_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, delivery_id)
);
```

**Indexes:**
- `idx_trip_deliveries_trip` on trip_id
- `idx_trip_deliveries_delivery` on delivery_id
- UNIQUE constraint on (trip_id, delivery_id)

**Relationships:**
- References `trips.id` (trip_id) - CASCADE DELETE
- References `deliveries.id` (delivery_id) - CASCADE DELETE

**Business Rules:**
- `sequence_order` determines delivery order in trip (1-based)
- One delivery can only be in ONE trip at a time
- Drag-and-drop reordering updates sequence_order

## Row Level Security (RLS) Policies

All tables have RLS enabled with policies based on `auth.uid()` and user role.

### Common Pattern
```sql
-- Viewers can read
CREATE POLICY "viewers_read" ON table_name
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('viewer', 'delivery_creator', 'trip_planner', 'admin'))
  );

-- Admins have full access
CREATE POLICY "admins_all" ON table_name
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Delivery-Specific Policies
- `delivery_creator` can INSERT, UPDATE, DELETE deliveries
- Prevents deletion if delivery is assigned to a trip

### Trip-Specific Policies
- `trip_planner` can manage trips and trip_deliveries
- Vehicle capacity validation on assignment

## Triggers & Functions

### update_updated_at_column()
Automatically updates `updated_at` timestamp on row modification.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

Applied to: users, vehicles, deliveries, trips

### handle_new_user()
Creates user profile in `public.users` when Supabase auth user is created.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## PostGIS Usage

### Storing Locations
```sql
-- Insert with PostGIS function
INSERT INTO deliveries (delivery_location, ...)
VALUES (ST_GeogFromText('POINT(-73.935242 40.730610)'), ...);

-- Format: POINT(longitude latitude)
-- Note: Longitude first, then latitude!
```

### Querying Locations
```sql
-- Get as text
SELECT ST_AsText(delivery_location) FROM deliveries;
-- Returns: POINT(-73.935242 40.730610)

-- Extract coordinates
SELECT ST_X(delivery_location::geometry) AS lng,
       ST_Y(delivery_location::geometry) AS lat
FROM deliveries;
```

### Distance Calculations
```sql
-- Distance between two points in meters
SELECT ST_Distance(
  location1::geography,
  location2::geography
) AS distance_meters;
```

## Indexes & Performance

### Spatial Indexes (GIST)
- Used for geospatial queries (e.g., nearby deliveries)
- Significantly faster than sequential scans
- Applied to all GEOGRAPHY columns

### B-Tree Indexes
- Standard indexes on frequently queried columns
- Status columns for filtering
- Foreign keys for joins
- Scheduled dates for time-based queries

## Data Migration

### Initial Setup
1. Run `database/schema.sql` in Supabase SQL Editor
2. Run `database/fix-trip-deliveries-policies.sql` for RLS policies
3. Create first admin user via Supabase dashboard

### Backup & Restore
```bash
# Backup (from Supabase dashboard)
Database > Backups > Create Backup

# Or via pg_dump (requires service role key)
pg_dump -h db.project.supabase.co -U postgres -d postgres > backup.sql
```

## Common Queries

### Get trips with delivery counts
```sql
SELECT t.*, COUNT(td.delivery_id) as delivery_count
FROM trips t
LEFT JOIN trip_deliveries td ON t.id = td.trip_id
GROUP BY t.id;
```

### Get available deliveries (not assigned)
```sql
SELECT * FROM deliveries
WHERE status IN ('pending', 'assigned')
ORDER BY scheduled_date;
```

### Validate vehicle capacity
```sql
SELECT t.id, t.total_weight, t.total_volume,
       v.capacity_weight, v.capacity_volume,
       (t.total_weight <= v.capacity_weight) as weight_ok,
       (t.total_volume <= v.capacity_volume) as volume_ok
FROM trips t
JOIN vehicles v ON t.vehicle_id = v.id;
```

## Troubleshooting

### RLS Policy Issues
If queries return empty even with correct authentication:
1. Check user role in `public.users` table
2. Verify RLS policies with `EXPLAIN` query
3. Use service role key temporarily to debug (be careful!)

### PostGIS Issues
```sql
-- Verify PostGIS is installed
SELECT PostGIS_Version();

-- Check SRID of existing points
SELECT ST_SRID(delivery_location) FROM deliveries LIMIT 1;
-- Should return 4326
```

### Performance Issues
```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM deliveries WHERE status = 'pending';

-- Rebuild indexes if needed
REINDEX TABLE deliveries;
```
