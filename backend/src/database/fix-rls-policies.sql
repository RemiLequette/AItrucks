-- Fix RLS policies to avoid infinite recursion
-- Run this in the Supabase SQL Editor

-- SOLUTION: Disable RLS on users table entirely
-- Since all authenticated users need to read user data, and we control writes through application logic
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on all tables
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view all users if they are admin" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins and trip planners can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can view deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Delivery creators can create deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Delivery creators can update deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Authenticated users can view trips" ON public.trips;
DROP POLICY IF EXISTS "Trip planners can manage trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can view trip deliveries" ON public.trip_deliveries;
DROP POLICY IF EXISTS "Trip planners can manage trip deliveries" ON public.trip_deliveries;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.get_my_role();

-- Create a security definer function to get user role (this bypasses RLS completely)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val FROM public.users WHERE id = auth.uid();
  RETURN user_role_val;
END;
$$;

-- Vehicles policies
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and trip planners can manage vehicles" ON public.vehicles
  FOR ALL USING (
    public.get_my_role() IN ('admin', 'trip_planner')
  );

-- Deliveries policies
CREATE POLICY "Authenticated users can view deliveries" ON public.deliveries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Delivery creators can create deliveries" ON public.deliveries
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('delivery_creator', 'trip_planner', 'admin')
  );

CREATE POLICY "Delivery creators can update deliveries" ON public.deliveries
  FOR UPDATE USING (
    public.get_my_role() IN ('delivery_creator', 'trip_planner', 'admin')
  );

-- Trips policies
CREATE POLICY "Authenticated users can view trips" ON public.trips
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trip planners can manage trips" ON public.trips
  FOR ALL USING (
    public.get_my_role() IN ('trip_planner', 'admin')
  );

-- Trip deliveries policies
CREATE POLICY "Authenticated users can view trip deliveries" ON public.trip_deliveries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trip planners can manage trip deliveries" ON public.trip_deliveries
  FOR ALL USING (
    public.get_my_role() IN ('trip_planner', 'admin')
  );
