-- Add explicit policies for trip_deliveries table
-- Run this in the Supabase SQL Editor

-- Drop the existing generic policy
DROP POLICY IF EXISTS "Trip planners can manage trip deliveries" ON public.trip_deliveries;

-- Create separate explicit policies
CREATE POLICY "Trip planners can insert trip deliveries" ON public.trip_deliveries
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('trip_planner', 'admin')
  );

CREATE POLICY "Trip planners can delete trip deliveries" ON public.trip_deliveries
  FOR DELETE USING (
    public.get_my_role() IN ('trip_planner', 'admin')
  );

CREATE POLICY "Trip planners can update trip deliveries" ON public.trip_deliveries
  FOR UPDATE USING (
    public.get_my_role() IN ('trip_planner', 'admin')
  );
