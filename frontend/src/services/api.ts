import { supabase } from '../config/supabase';

// Auth
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
  return { token: data.session.access_token, user: profile };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  return { user: profile };
};

// Deliveries
export const getDeliveries = async () => {
  // Query with ST_AsText to get human-readable coordinates
  const { data, error } = await supabase
    .rpc('get_deliveries_with_location')
    .order('scheduled_date', { ascending: true });
  
  if (error) {
    // Fallback to basic query if RPC doesn't exist
    const { data: basicData, error: basicError } = await supabase
      .from('deliveries')
      .select('*')
      .order('scheduled_date', { ascending: true });
    if (basicError) throw basicError;
    return { deliveries: basicData || [] };
  }
  
  return { deliveries: data || [] };
};

export const getDelivery = async (id: string) => {
  const { data, error } = await supabase.from('deliveries').select('*').eq('id', id).single();
  if (error) throw error;
  return { delivery: data };
};

export const createDelivery = async (deliveryData: any) => {
  const { data, error } = await supabase.from('deliveries').insert([deliveryData]).select().single();
  if (error) throw error;
  return { message: 'Delivery created successfully', delivery: data };
};

export const updateDelivery = async (id: string, deliveryData: any) => {
  const { data, error } = await supabase.from('deliveries').update(deliveryData).eq('id', id).select().single();
  if (error) throw error;
  return { message: 'Delivery updated successfully', delivery: data };
};

export const deleteDelivery = async (id: string) => {
  const { error } = await supabase.from('deliveries').delete().eq('id', id);
  if (error) throw error;
  return { message: 'Delivery deleted successfully' };
};

// Vehicles
export const getVehicles = async () => {
  // Query with ST_AsText to get human-readable coordinates
  const { data, error } = await supabase.rpc('get_vehicles_with_location');
  
  if (error) {
    // Fallback to basic query if RPC doesn't exist
    const { data: basicData, error: basicError } = await supabase
      .from('vehicles')
      .select('*')
      .order('name', { ascending: true });
    if (basicError) throw basicError;
    return { vehicles: basicData || [] };
  }
  
  return { vehicles: data || [] };
};

export const getVehicle = async (id: string) => {
  const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
  if (error) throw error;
  return { vehicle: data };
};

export const createVehicle = async (vehicleData: any) => {
  const { data, error } = await supabase.from('vehicles').insert([vehicleData]).select().single();
  if (error) throw error;
  return { message: 'Vehicle created successfully', vehicle: data };
};

export const updateVehicle = async (id: string, vehicleData: any) => {
  const { data, error } = await supabase.from('vehicles').update(vehicleData).eq('id', id).select().single();
  if (error) throw error;
  return { message: 'Vehicle updated successfully', vehicle: data };
};

export const deleteVehicle = async (id: string) => {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
  return { message: 'Vehicle deleted successfully' };
};

// Trips
export const getTrips = async () => {
  const { data, error } = await supabase.from('trips').select('*, vehicle:vehicles(name, license_plate)').order('planned_start_time', { ascending: false });
  if (error) throw error;
  const trips = data?.map((t: any) => ({ ...t, vehicle_name: t.vehicle?.name, license_plate: t.vehicle?.license_plate, delivery_count: 0 })) || [];
  return { trips };
};

export const getTrip = async (id: string) => {
  const { data: trip, error } = await supabase.from('trips').select('*, vehicle:vehicles(*)').eq('id', id).single();
  if (error) throw error;
  const { data: deliveries } = await supabase.from('trip_deliveries').select('*, delivery:deliveries(*)').eq('trip_id', id).order('sequence_order');
  return { trip: { ...trip, vehicle_name: trip.vehicle?.name }, deliveries: deliveries?.map((td: any) => td.delivery) || [] };
};

export const createTrip = async (tripData: any) => {
  const { data, error } = await supabase.from('trips').insert([tripData]).select().single();
  if (error) throw error;
  return { message: 'Trip created successfully', trip: data };
};

export const updateTripStatus = async (id: string, status: string) => {
  const { data, error } = await supabase.from('trips').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return { message: 'Trip status updated successfully', trip: data };
};

export const deleteTrip = async (id: string) => {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
  return { message: 'Trip deleted successfully' };
};

// Assign deliveries to trip
export const assignDeliveriesToTrip = async (tripId: string, deliveryIds: string[]) => {
  // First, remove existing assignments
  await supabase.from('trip_deliveries').delete().eq('trip_id', tripId);
  
  // Then add new assignments with sequence
  const assignments = deliveryIds.map((deliveryId, index) => ({
    trip_id: tripId,
    delivery_id: deliveryId,
    sequence_order: index + 1
  }));
  
  const { error } = await supabase.from('trip_deliveries').insert(assignments);
  if (error) throw error;
  return { message: 'Deliveries assigned successfully' };
};

// Users
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return { users: data || [] };
};

export const updateUserRole = async (id: string, role: string) => {
  const { data, error } = await supabase.from('users').update({ role }).eq('id', id).select().single();
  if (error) throw error;
  return { message: 'User role updated successfully', user: data };
};

export const updateUserStatus = async (id: string, is_active: boolean) => {
  const { data, error } = await supabase.from('users').update({ is_active }).eq('id', id).select().single();
  if (error) throw error;
  return { message: 'User status updated successfully', user: data };
};

export default supabase;
