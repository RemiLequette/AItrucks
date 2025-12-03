# API Documentation

## Overview

The AItrucks API is built on Supabase, providing a REST API for all database operations with built-in authentication and Row Level Security. All API calls are centralized in `frontend/src/services/api.ts`.

## Base Configuration

```typescript
// frontend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'viewer'
    }
  }
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Returns: { user, session }
// session.access_token is JWT token
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Get Session
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

## Deliveries API

### Get All Deliveries
```typescript
export const getDeliveries = async () => {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .order('scheduled_date', { ascending: true });
    
  if (error) throw error;
  return { deliveries: data };
};
```

**Response:**
```json
{
  "deliveries": [
    {
      "id": "uuid",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "delivery_address": "123 Main St, City",
      "delivery_location": "POINT(-73.935242 40.730610)",
      "scheduled_date": "2025-12-05T10:00:00Z",
      "weight": 50.5,
      "volume": 2.3,
      "status": "pending",
      "notes": "Fragile items",
      "created_by": "uuid",
      "created_at": "2025-12-03T12:00:00Z",
      "updated_at": "2025-12-03T12:00:00Z"
    }
  ]
}
```

### Create Delivery
```typescript
export const createDelivery = async (deliveryData: any) => {
  const { data, error } = await supabase
    .from('deliveries')
    .insert([deliveryData])
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'Delivery created successfully', delivery: data };
};
```

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "delivery_address": "123 Main St",
  "delivery_location": "POINT(-73.935242 40.730610)",
  "scheduled_date": "2025-12-05T10:00:00Z",
  "weight": 50.5,
  "volume": 2.3,
  "notes": "Fragile"
}
```

### Update Delivery
```typescript
export const updateDelivery = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('deliveries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'Delivery updated successfully', delivery: data };
};
```

### Delete Delivery
```typescript
export const deleteDelivery = async (id: string) => {
  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return { message: 'Delivery deleted successfully' };
};
```

## Vehicles API

### Get All Vehicles
```typescript
export const getVehicles = async () => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return { vehicles: data };
};
```

**Response:**
```json
{
  "vehicles": [
    {
      "id": "uuid",
      "name": "Truck 1",
      "license_plate": "ABC123",
      "capacity_weight": 1000.0,
      "capacity_volume": 50.0,
      "current_location": "POINT(-73.935242 40.730610)",
      "status": "available",
      "created_at": "2025-12-01T12:00:00Z",
      "updated_at": "2025-12-01T12:00:00Z"
    }
  ]
}
```

### Create Vehicle
```typescript
export const createVehicle = async (vehicleData: any) => {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicleData])
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'Vehicle created successfully', vehicle: data };
};
```

### Update Vehicle
```typescript
export const updateVehicle = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'Vehicle updated successfully', vehicle: data };
};
```

## Trips API

### Get All Trips (with calculated totals)
```typescript
export const getTrips = async () => {
  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      *,
      vehicle:vehicles(name, license_plate),
      trip_deliveries(
        delivery:deliveries(weight, volume)
      )
    `)
    .order('planned_start_time', { ascending: false });
  
  if (error) throw error;
  
  // Calculate totals from deliveries
  const tripsWithTotals = trips.map(trip => {
    const deliveries = trip.trip_deliveries?.map((td: any) => td.delivery) || [];
    return {
      ...trip,
      vehicle_name: trip.vehicle?.name,
      license_plate: trip.vehicle?.license_plate,
      delivery_count: deliveries.length,
      total_weight: deliveries.reduce((sum: number, d: any) => sum + (d?.weight || 0), 0),
      total_volume: deliveries.reduce((sum: number, d: any) => sum + (d?.volume || 0), 0),
    };
  });
  
  return { trips: tripsWithTotals };
};
```

**Response:**
```json
{
  "trips": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "name": "Route A - Morning",
      "status": "planned",
      "planned_start_time": "2025-12-05T08:00:00Z",
      "vehicle_name": "Truck 1",
      "license_plate": "ABC123",
      "delivery_count": 5,
      "total_weight": 250.5,
      "total_volume": 12.3,
      "created_at": "2025-12-03T12:00:00Z"
    }
  ]
}
```

### Get Single Trip (with deliveries)
```typescript
export const getTrip = async (id: string) => {
  // Get trip details
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*, vehicle:vehicles(*)')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  
  // Get trip deliveries in order
  const { data: deliveries } = await supabase
    .from('trip_deliveries')
    .select('*, delivery:deliveries(*)')
    .eq('trip_id', id)
    .order('sequence_order');
  
  return {
    trip: { ...trip, vehicle_name: trip.vehicle?.name },
    deliveries: deliveries?.map((td: any) => td.delivery) || []
  };
};
```

### Create Trip
```typescript
export const createTrip = async (tripData: any) => {
  const { data, error } = await supabase
    .from('trips')
    .insert([tripData])
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'Trip created successfully', trip: data };
};
```

**Request Body:**
```json
{
  "name": "Route A - Morning",
  "vehicle_id": "uuid",
  "planned_start_time": "2025-12-05T08:00:00Z"
}
```

### Update Trip Status
```typescript
export const updateTripStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('trips')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'Trip status updated successfully', trip: data };
};
```

### Delete Trip
```typescript
export const deleteTrip = async (id: string) => {
  // Get all deliveries assigned to this trip
  const { data: tripDeliveries } = await supabase
    .from('trip_deliveries')
    .select('delivery_id')
    .eq('trip_id', id);
  
  const deliveryIds = tripDeliveries?.map((td: any) => td.delivery_id) || [];
  
  // Update delivery status back to pending
  if (deliveryIds.length > 0) {
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ status: 'pending' })
      .in('id', deliveryIds);
    if (updateError) throw updateError;
  }
  
  // Delete the trip (trip_deliveries cascade deleted)
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
  
  return { message: 'Trip deleted successfully' };
};
```

### Assign Deliveries to Trip
```typescript
export const assignDeliveriesToTrip = async (tripId: string, deliveryIds: string[]) => {
  // 1. Get existing assignments for this trip
  const { data: existingAssignments } = await supabase
    .from('trip_deliveries')
    .select('delivery_id')
    .eq('trip_id', tripId);
  
  const existingDeliveryIds = existingAssignments?.map((a: any) => a.delivery_id) || [];
  const removedDeliveryIds = existingDeliveryIds.filter((id: string) => !deliveryIds.includes(id));
  
  // 2. Remove deliveries from ANY other trip (prevent double assignment)
  if (deliveryIds.length > 0) {
    const { error: removeError } = await supabase
      .from('trip_deliveries')
      .delete()
      .in('delivery_id', deliveryIds)
      .neq('trip_id', tripId);
    if (removeError) throw removeError;
  }
  
  // 3. Remove existing assignments from this trip
  const { error: deleteError } = await supabase
    .from('trip_deliveries')
    .delete()
    .eq('trip_id', tripId);
  if (deleteError) throw deleteError;
  
  // 4. Update removed deliveries to pending
  if (removedDeliveryIds.length > 0) {
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ status: 'pending' })
      .in('id', removedDeliveryIds);
    if (updateError) throw updateError;
  }
  
  // 5. Add new assignments with sequence
  const assignments = deliveryIds.map((deliveryId, index) => ({
    trip_id: tripId,
    delivery_id: deliveryId,
    sequence_order: index + 1
  }));
  
  if (assignments.length > 0) {
    const { error: insertError } = await supabase
      .from('trip_deliveries')
      .insert(assignments);
    if (insertError) throw insertError;
    
    // 6. Update delivery status to assigned
    const { error: updateStatusError } = await supabase
      .from('deliveries')
      .update({ status: 'assigned' })
      .in('id', deliveryIds);
    if (updateStatusError) throw updateStatusError;
  }
  
  return { message: 'Deliveries assigned successfully' };
};
```

**Request:**
```typescript
assignDeliveriesToTrip('trip-uuid', [
  'delivery-1-uuid',
  'delivery-2-uuid',
  'delivery-3-uuid'
]);
```

## Users API

### Get All Users
```typescript
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return { users: data };
};
```

### Update User Role
```typescript
export const updateUserRole = async (userId: string, role: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'User role updated successfully', user: data };
};
```

### Update User Status
```typescript
export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return { message: 'User status updated successfully', user: data };
};
```

## Error Handling

### Standard Error Response
All API functions throw errors that should be caught:

```typescript
try {
  await createDelivery(data);
} catch (error: any) {
  console.error('Error:', error);
  alert(error.message || 'Operation failed');
}
```

### Common Error Codes
- `PGRST116`: Row not found
- `23505`: Unique constraint violation
- `23503`: Foreign key violation
- `42501`: Insufficient privilege (RLS)

## Rate Limiting

Supabase has built-in rate limiting based on your plan:
- **Free Tier**: 500 requests per second
- **Pro Tier**: 1000+ requests per second

## Real-time Subscriptions (Optional)

```typescript
// Subscribe to delivery changes
const subscription = supabase
  .channel('deliveries-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'deliveries'
  }, (payload) => {
    console.log('Delivery changed:', payload);
  })
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

## Best Practices

1. **Always handle errors**: Use try-catch blocks
2. **Use type safety**: Define TypeScript interfaces for responses
3. **Batch operations**: Minimize API calls where possible
4. **Cache responses**: Use React state/context to avoid repeated fetches
5. **Validate input**: Check data before sending to API
6. **Use RLS**: Let database handle permissions, don't check in frontend
