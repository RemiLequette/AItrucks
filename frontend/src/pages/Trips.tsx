import React, { useEffect, useState } from 'react';
import { getTrips, createTrip, getVehicles, getTrip, getDeliveries, assignDeliveriesToTrip } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2 } from 'lucide-react';

const Trips = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
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
      alert('Deliveries assigned successfully');
    } catch (error) {
      console.error('Error assigning deliveries:', error);
      alert('Failed to assign deliveries');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      planned: 'pending',
      in_progress: 'in-transit',
      completed: 'delivered',
      cancelled: 'cancelled',
    };
    return <span className={`badge badge-${statusMap[status]}`}>{status}</span>;
  };

  if (loading) return <div>Loading...</div>;

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

      <div className="card">
        {trips.length === 0 ? (
          <p>No trips found. Create trips to assign deliveries to vehicles.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trip Name</th>
                <th>Vehicle</th>
                <th>Deliveries</th>
                <th>Start Time</th>
                <th>Status</th>
                <th>Weight (kg)</th>
                <th>Volume (m³)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.name}</td>
                  <td>{trip.vehicle_name} ({trip.license_plate})</td>
                  <td>{trip.delivery_count}</td>
                  <td>{new Date(trip.planned_start_time).toLocaleString()}</td>
                  <td>{getStatusBadge(trip.status)}</td>
                  <td>{trip.total_weight || '-'}</td>
                  <td>{trip.total_volume || '-'}</td>
                  <td>
                    {hasRole('trip_planner', 'admin') && (
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px' }}
                        onClick={() => handleOpenAssignModal(trip)}
                      >
                        <Edit2 size={16} style={{ marginRight: '4px', display: 'inline' }} />
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
