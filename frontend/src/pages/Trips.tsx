import React, { useEffect, useState, useMemo } from 'react';
import { getTrips, createTrip, getVehicles, getTrip, getDeliveries, assignDeliveriesToTrip } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Table, createBadgeColumn, createDateColumn, createNumberColumn, createActionColumn } from '../components/Table';

const Trips = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedTripForView, setSelectedTripForView] = useState<any>(null);
  const [tripDeliveries, setTripDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    vehicle_id: '',
    planned_start_time: ''
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await getTrips();
      setTrips(response.trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrip(formData);
      setShowModal(false);
      setFormData({
        name: '',
        vehicle_id: '',
        planned_start_time: ''
      });
      fetchTrips();
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip');
    }
  };

  const handleOpenModal = async () => {
    try {
      const response = await getVehicles();
      setVehicles(response.vehicles);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      alert('Failed to load vehicles');
    }
  };

  const handleOpenAssignModal = async (trip: any) => {
    try {
      setSelectedTrip(trip);
      
      // Get trip details with current deliveries
      const tripResponse = await getTrip(trip.id);
      const currentDeliveryIds = tripResponse.deliveries?.map((d: any) => d.id) || [];
      setSelectedDeliveryIds(currentDeliveryIds);
      
      // Get all pending deliveries
      const deliveriesResponse = await getDeliveries();
      setAvailableDeliveries(deliveriesResponse.deliveries.filter((d: any) => d.status === 'pending'));
      
      setShowAssignModal(true);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      alert('Failed to load deliveries');
    }
  };

  const handleToggleDelivery = (deliveryId: string) => {
    setSelectedDeliveryIds(prev => 
      prev.includes(deliveryId) 
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
    );
  };

  const handleAssignDeliveries = async () => {
    if (!selectedTrip) return;
    
    try {
      await assignDeliveriesToTrip(selectedTrip.id, selectedDeliveryIds);
      setShowAssignModal(false);
      setSelectedTrip(null);
      setSelectedDeliveryIds([]);
      fetchTrips();
      if (selectedTripForView?.id === selectedTrip.id) {
        handleTripClick(selectedTrip);
      }
      alert('Deliveries assigned successfully');
    } catch (error: any) {
      console.error('Error assigning deliveries:', error);
      alert(`Failed to assign deliveries: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTripClick = async (trip: any) => {
    setSelectedTripForView(trip);
    setLoadingDeliveries(true);
    try {
      const tripResponse = await getTrip(trip.id);
      setTripDeliveries(tripResponse.deliveries || []);
    } catch (error) {
      console.error('Error loading trip deliveries:', error);
      setTripDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleRemoveDeliveryFromTrip = async (deliveryId: string) => {
    if (!selectedTripForView) return;
    if (!confirm('Remove this delivery from the trip?')) return;

    try {
      const updatedDeliveryIds = tripDeliveries
        .filter(d => d.id !== deliveryId)
        .map(d => d.id);
      
      await assignDeliveriesToTrip(selectedTripForView.id, updatedDeliveryIds);
      await handleTripClick(selectedTripForView);
      fetchTrips();
    } catch (error) {
      console.error('Error removing delivery:', error);
      alert('Failed to remove delivery from trip');
    }
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (dropIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === dropIndex || !selectedTripForView) {
      setDraggedIndex(null);
      return;
    }

    const items = [...tripDeliveries];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    
    setTripDeliveries(items);
    setDraggedIndex(null);
    
    try {
      const updatedDeliveryIds = items.map(d => d.id);
      await assignDeliveriesToTrip(selectedTripForView.id, updatedDeliveryIds);
      fetchTrips();
    } catch (error) {
      console.error('Error updating delivery order:', error);
      alert('Failed to update delivery order');
      await handleTripClick(selectedTripForView);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Define table columns
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Trip Name',
      },
      {
        id: 'vehicle',
        header: 'Vehicle',
        cell: ({ row }) => `${row.original.vehicle_name} (${row.original.license_plate})`,
      },
      {
        accessorKey: 'delivery_count',
        header: 'Deliveries',
      },
      createDateColumn('planned_start_time', 'Start Time'),
      createBadgeColumn('status', 'Status'),
      createNumberColumn('total_weight', 'Weight (kg)', { decimals: 2, suffix: '' }),
      createNumberColumn('total_volume', 'Volume (m³)', { decimals: 2, suffix: '' }),
      createActionColumn({
        onAssign: hasRole('trip_planner', 'admin') ? handleOpenAssignModal : undefined,
        showAssign: () => hasRole('trip_planner', 'admin'),
      }),
    ],
    [hasRole]
  );

  const deliveryColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'sequence',
        header: '#',
        size: 60,
        cell: ({ row }) => (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px'
          }}>
            {hasRole('trip_planner', 'admin') && (
              <span style={{ fontSize: '18px', color: '#999' }}>⋮⋮</span>
            )}
            <span style={{ fontWeight: 500, color: '#666' }}>{row.index + 1}</span>
          </div>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
      },
      {
        accessorKey: 'delivery_address',
        header: 'Address',
      },
      createDateColumn('scheduled_date', 'Scheduled Date'),
      createNumberColumn('weight', 'Weight (kg)', { decimals: 2 }),
      createNumberColumn('volume', 'Volume (m³)', { decimals: 2 }),
      createBadgeColumn('status', 'Status'),
      createActionColumn({
        customActions: hasRole('trip_planner', 'admin') ? [
          {
            label: 'Remove',
            onClick: (row) => handleRemoveDeliveryFromTrip(row.id),
            className: 'btn-danger',
          }
        ] : [],
      }),
    ],
    [hasRole, tripDeliveries]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Trips</h1>
        {hasRole('trip_planner', 'admin') && (
          <button className="btn-primary" onClick={handleOpenModal}>
            <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
            New Trip
          </button>
        )}
      </div>

      <Table
        data={trips}
        columns={columns}
        loading={loading}
        emptyMessage="No trips found. Create trips to assign deliveries to vehicles."
        enableSorting={true}
        getRowId={(row) => row.id}
        onRowClick={handleTripClick}
        rowClassName={(row) => row.id === selectedTripForView?.id ? 'row--info' : undefined}
      />

      {selectedTripForView && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 className="page-title" style={{ marginBottom: '8px' }}>
                Deliveries for {selectedTripForView.name}
              </h2>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                Vehicle: {selectedTripForView.vehicle_name} ({selectedTripForView.license_plate})
              </p>
            </div>
            {hasRole('trip_planner', 'admin') && (
              <button 
                className="btn-secondary" 
                onClick={() => handleOpenAssignModal(selectedTripForView)}
              >
                <Edit2 size={16} style={{ marginRight: '6px', display: 'inline' }} />
                Modify Assignments
              </button>
            )}
          </div>
          
          <Table
            data={tripDeliveries}
            columns={deliveryColumns}
            loading={loadingDeliveries}
            emptyMessage="No deliveries assigned to this trip yet. Click 'Modify Assignments' to add deliveries."
            enableSorting={false}
            getRowId={(row) => row.id}
            draggable={hasRole('trip_planner', 'admin')}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            draggedIndex={draggedIndex}
          />
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Trip</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Trip Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Vehicle *</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                  required
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} - {v.license_plate}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Planned Start Time *</label>
                <input
                  type="datetime-local"
                  value={formData.planned_start_time}
                  onChange={(e) => setFormData({...formData, planned_start_time: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn-primary">Create Trip</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Deliveries to {selectedTrip.name}</h2>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Select deliveries to assign to this trip. Only pending deliveries are shown.
            </p>
            
            {availableDeliveries.length === 0 ? (
              <p>No pending deliveries available.</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {availableDeliveries.map(delivery => (
                  <div 
                    key={delivery.id} 
                    style={{ 
                      padding: '12px', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '6px', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedDeliveryIds.includes(delivery.id) ? '#e7f3ff' : 'white'
                    }}
                    onClick={() => handleToggleDelivery(delivery.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedDeliveryIds.includes(delivery.id)}
                        onChange={() => {}}
                        style={{ marginRight: '12px', width: 'auto' }}
                      />
                      <div>
                        <strong>{delivery.customer_name}</strong>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {delivery.delivery_address}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Weight: {delivery.weight}kg, Volume: {delivery.volume}m³
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleAssignDeliveries}
                disabled={selectedDeliveryIds.length === 0}
              >
                Assign {selectedDeliveryIds.length} Deliveries
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
