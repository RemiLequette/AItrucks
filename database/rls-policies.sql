-- Row Level Security (RLS) Policies
-- These policies have been applied to your Supabase project

-- Disable RLS on users table to avoid infinite recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_deliveries ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get user role (bypasses RLS)
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
