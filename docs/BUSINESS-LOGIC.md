# Business Logic Documentation

## Overview

This document describes the business rules, workflows, and logic that govern the AItrucks delivery planning system. Understanding these rules is critical for maintaining and extending the application.

## Core Entities

### Deliveries
Customer orders that need to be delivered to specific locations.

**Attributes:**
- Customer information (name, phone)
- Delivery address and geospatial location (required)
- Scheduled date/time
- Physical constraints (weight in kg, volume in m³)
- Status tracking
- Optional notes

**Status Lifecycle:**
```
pending → assigned → in_transit → delivered
                               → failed
```

**Business Rules:**
1. **Location Required**: `delivery_location` must be set before displaying on map
2. **Capacity Constraints**: Weight and volume must be positive values
3. **Status Transitions**:
   - `pending`: Initial state, not assigned to any trip
   - `assigned`: Assigned to a trip, waiting to start
   - `in_transit`: Trip is in progress, delivery is en route
   - `delivered`: Successfully completed
   - `failed`: Could not be completed
4. **Assignment Rules**:
   - Only deliveries with status `pending` or `assigned` can be assigned to trips
   - Deliveries with status `in_transit`, `delivered`, or `failed` cannot be reassigned
   - A delivery can only be assigned to ONE trip at a time
   - When assigned to a new trip, automatically removed from previous trip
5. **Status Updates**:
   - When assigned to a trip: status → `assigned`
   - When removed from a trip: status → `pending`
   - When trip is deleted: all deliveries → `pending`

### Vehicles
Fleet vehicles used to transport deliveries.

**Attributes:**
- Name and license plate (unique identifier)
- Capacity constraints (weight in kg, volume in m³)
- Current location (GPS coordinates)
- Status tracking

**Status Values:**
```
available    - Ready for assignment
in_use       - Currently on a trip
maintenance  - Under repair, not available
inactive     - Not in service
```

**Business Rules:**
1. **Capacity Enforcement**: Trip's total weight/volume cannot exceed vehicle capacity
2. **License Plate Uniqueness**: Each license plate must be unique
3. **Location Tracking**: Current location stored as PostGIS POINT
4. **Status Management**:
   - Only `available` vehicles can be assigned to new trips
   - Status should update to `in_use` when trip starts (future enhancement)

### Trips
Planned delivery routes assigned to a vehicle.

**Attributes:**
- Name (descriptive identifier)
- Assigned vehicle
- Start location and time
- Status tracking
- Calculated totals (weight, volume, distance)
- Ordered list of deliveries (via junction table)

**Status Lifecycle:**
```
planned → in_progress → completed
                     → cancelled
```

**Business Rules:**
1. **Vehicle Assignment**: Each trip must be assigned to exactly one vehicle
2. **Capacity Validation**:
   - Total weight of assigned deliveries ≤ vehicle capacity weight
   - Total volume of assigned deliveries ≤ vehicle capacity volume
   - Validation performed when assigning deliveries
3. **Delivery Sequence**:
   - Deliveries have a `sequence_order` (1-based)
   - Order can be changed via drag-and-drop
   - Determines the route optimization
4. **Calculated Totals**:
   - `total_weight`: Sum of all assigned delivery weights
   - `total_volume`: Sum of all assigned delivery volumes
   - `delivery_count`: Count of assigned deliveries
   - Calculated dynamically by API when fetching trips
5. **Deletion Rules**:
   - When a trip is deleted, all assigned deliveries return to `pending` status
   - Junction table entries (trip_deliveries) cascade delete

### Trip-Delivery Assignment
Many-to-many relationship with ordering.

**Business Rules:**
1. **Uniqueness**: One delivery cannot appear twice in the same trip
2. **Exclusivity**: A delivery can only be in ONE trip at a time
3. **Assignment Process**:
   ```
   Step 1: Remove delivery from any other trips
   Step 2: Remove existing assignments for current trip
   Step 3: Update removed deliveries to 'pending' status
   Step 4: Insert new assignments with sequence order
   Step 5: Update assigned deliveries to 'assigned' status
   ```
4. **Sequence Order**:
   - Integer starting from 1
   - Determines delivery order in the trip
   - Can be reordered via drag-and-drop interface
   - Reordering updates all sequence values atomically

## User Roles & Permissions

### Role Hierarchy
```
viewer < delivery_creator < trip_planner < admin
```

### Role Definitions

#### Viewer
**Permissions:**
- Read-only access to all deliveries, vehicles, and trips
- Can view dashboard statistics
- Can view map with delivery/vehicle locations
- Cannot create, edit, or delete anything

**Use Case:** Stakeholders who need visibility but not modification rights

#### Delivery Creator
**Permissions:**
- All viewer permissions
- Create new deliveries
- Edit delivery details (customer info, address, weight, volume)
- Delete deliveries (only if not assigned to a trip)
- Import/export deliveries via Excel

**Use Case:** Customer service representatives who manage delivery orders

**Business Rules:**
- Cannot delete deliveries that are assigned to trips
- Cannot modify delivery status directly (status managed by trip assignments)

#### Trip Planner
**Permissions:**
- All delivery creator permissions
- Create new trips
- Assign deliveries to trips
- Modify trip assignments (add/remove deliveries)
- Reorder deliveries within trips
- Update trip status
- Cannot delete trips

**Use Case:** Logistics coordinators who plan delivery routes

**Business Rules:**
- Can only assign deliveries with status `pending` or `assigned`
- Must respect vehicle capacity constraints
- Cannot start a trip if total weight/volume exceeds vehicle capacity

#### Admin
**Permissions:**
- All trip planner permissions
- Delete trips
- Manage users (create, edit roles, activate/deactivate)
- Delete any delivery (even if assigned)
- Access to all administrative functions

**Use Case:** System administrators with full control

## Workflows

### Delivery Management Workflow

```
1. Create Delivery
   ↓
2. Enter customer info, address, weight, volume
   ↓
3. Geocode address to get GPS coordinates (optional)
   ↓
4. Delivery saved with status = 'pending'
   ↓
5. [Optional] Import multiple deliveries via Excel
```

### Trip Planning Workflow

```
1. Create Trip
   ↓
2. Select vehicle and planned start time
   ↓
3. Open "Assign Deliveries" modal
   ↓
4. Select deliveries from available list (pending/assigned only)
   ↓
5. System validates:
   - Total weight ≤ vehicle capacity
   - Total volume ≤ vehicle capacity
   ↓
6. Save assignments
   - Remove deliveries from other trips
   - Update delivery status to 'assigned'
   - Create trip_deliveries records with sequence
   ↓
7. [Optional] Reorder deliveries via drag-and-drop
   ↓
8. [Optional] Modify assignments (add/remove deliveries)
```

### Delivery Reordering Workflow

```
1. Select a trip to view deliveries
   ↓
2. Drag delivery row to new position
   ↓
3. Drop delivery at target position
   ↓
4. System updates sequence_order for all affected deliveries
   ↓
5. New order saved to database
```

### Trip Deletion Workflow

```
1. Admin clicks "Delete" on trip
   ↓
2. Confirmation dialog appears
   ↓
3. If confirmed:
   - Get all deliveries assigned to trip
   - Update delivery status to 'pending'
   - Delete trip (cascade deletes trip_deliveries)
   ↓
4. Deliveries now available for reassignment
```

## Validation Rules

### Delivery Validation

```typescript
// Required fields
- customer_name: non-empty string
- delivery_address: non-empty string
- delivery_location: valid POINT(lng, lat)
- scheduled_date: future timestamp
- weight: positive decimal
- volume: positive decimal

// Optional fields
- customer_phone: string
- notes: text

// Geocoding validation
- If address provided, attempt to geocode
- If geocoding fails, allow manual coordinate entry
- Validate coordinates are within valid range
  - Latitude: -90 to 90
  - Longitude: -180 to 180
```

### Trip Validation

```typescript
// Required fields
- name: non-empty string
- vehicle_id: valid UUID reference
- planned_start_time: future timestamp

// Capacity validation
function validateTripCapacity(trip, vehicle, deliveries) {
  const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);
  const totalVolume = deliveries.reduce((sum, d) => sum + d.volume, 0);
  
  if (totalWeight > vehicle.capacity_weight) {
    throw new Error('Total weight exceeds vehicle capacity');
  }
  
  if (totalVolume > vehicle.capacity_volume) {
    throw new Error('Total volume exceeds vehicle capacity');
  }
  
  return true;
}
```

### Vehicle Validation

```typescript
// Required fields
- name: non-empty string
- license_plate: unique string
- capacity_weight: positive decimal
- capacity_volume: positive decimal

// Uniqueness validation
- License plate must be unique across all vehicles
```

## Business Constraints

### Hard Constraints (Enforced)
1. **One delivery per trip**: A delivery cannot be in multiple trips simultaneously
2. **Capacity limits**: Trip weight/volume cannot exceed vehicle capacity
3. **Status restrictions**: Cannot assign deliveries that are in_transit/delivered/failed
4. **Unique license plates**: Each vehicle must have unique license plate
5. **Required location**: Deliveries must have valid GPS coordinates

### Soft Constraints (Recommended)
1. **Scheduled date**: Deliveries should be scheduled in the future
2. **Route optimization**: Deliveries should be ordered efficiently by location
3. **Time windows**: Consider delivery time windows (future enhancement)
4. **Vehicle availability**: Prefer available vehicles for new trips

## Error Handling

### Common Error Scenarios

#### Capacity Exceeded
```
Error: "Total weight/volume exceeds vehicle capacity"
Solution: Remove some deliveries or choose a larger vehicle
```

#### Delivery Already Assigned
```
Behavior: Delivery automatically removed from previous trip
Status: Updated to reflect new assignment
```

#### Invalid Location
```
Error: "Delivery location is required"
Solution: Geocode address or enter coordinates manually
```

#### Permission Denied
```
Error: "You don't have permission to perform this action"
Solution: Contact admin to upgrade role
```

#### Database Constraint Violation
```
Error: "Unique constraint violated" (e.g., duplicate license plate)
Solution: Change the conflicting value
```

## Future Business Logic Enhancements

### Planned Features
1. **Route Optimization**: Automatic reordering of deliveries by distance
2. **Time Windows**: Support for delivery time constraints
3. **Driver Assignment**: Link trips to specific drivers
4. **Real-time Tracking**: Update delivery status as trip progresses
5. **Notifications**: Alert customers when delivery is en route
6. **Proof of Delivery**: Photo/signature capture
7. **Return Trips**: Handle failed deliveries and returns
8. **Multi-day Trips**: Support trips spanning multiple days
9. **Cost Calculation**: Estimate fuel costs based on distance
10. **Historical Analytics**: Trip performance metrics

### Proposed Status Transitions

#### Enhanced Delivery Status
```
pending → assigned → loaded → in_transit → arrived → delivered
                                        → → failed → returned
```

#### Enhanced Trip Status
```
planned → confirmed → loading → in_progress → returning → completed
                                           → → paused → resumed
```

## Integration Points

### External Systems
1. **Geocoding API**: Convert addresses to coordinates (currently using Nominatim)
2. **Mapping API**: Display routes and calculate distances (Leaflet/OpenStreetMap)
3. **Future**: SMS notifications, route optimization APIs, telematics integration

### Data Export/Import
1. **Excel Import**: Bulk create deliveries from spreadsheet
2. **Excel Export**: Download delivery data for analysis
3. **Future**: PDF reports, route sheets, driver manifests

## Performance Considerations

### Optimization Strategies
1. **Batch Operations**: Assign multiple deliveries in single transaction
2. **Calculated Fields**: Cache total weight/volume on trips table
3. **Spatial Indexing**: Use PostGIS GIST indexes for location queries
4. **Pagination**: Limit large result sets in UI
5. **Real-time Updates**: Use Supabase subscriptions sparingly

### Scalability Limits
- **Deliveries per Trip**: Recommended max 50 (UI performance)
- **Trips per Day**: No hard limit (database can handle thousands)
- **Concurrent Users**: Limited by Supabase plan (500-1000+ users)

## Audit & Compliance

### Tracking Changes
- All tables have `created_at` and `updated_at` timestamps
- `created_by` field tracks who created deliveries/trips
- Future: Add audit log table for detailed change history

### Data Retention
- No automatic deletion of historical data
- Soft delete pattern for important records (future enhancement)
- Completed trips remain in database for reporting
