-- Add missing DELETE policy for deliveries
-- Run this in the Supabase SQL Editor

CREATE POLICY "Delivery creators can delete deliveries" ON public.deliveries
  FOR DELETE USING (
    public.get_my_role() IN ('delivery_creator', 'trip_planner', 'admin')
  );
