import React, { useEffect, useState } from 'react';
import { getVehicles, createVehicle } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    capacity_weight: '',
    capacity_volume: '',
    start_location: ''
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await getVehicles();
      setVehicles(response.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicleData = {
        ...formData,
        capacity_weight: parseFloat(formData.capacity_weight),
        capacity_volume: parseFloat(formData.capacity_volume)
      };
      await createVehicle(vehicleData);
      setShowModal(false);
      setFormData({
        name: '',
        license_plate: '',
        capacity_weight: '',
        capacity_volume: '',
        start_location: ''
      });
      fetchVehicles();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Failed to create vehicle');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      available: 'delivered',
      in_use: 'in-transit',
      maintenance: 'cancelled',
      inactive: 'pending',
    };
    return <span className={`badge badge-${statusMap[status]}`}>{status}</span>;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Vehicles</h1>
        {hasRole('admin') && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
            New Vehicle
          </button>
        )}
      </div>

      <div className="card">
        {vehicles.length === 0 ? (
          <p>No vehicles found. Add vehicles to manage your fleet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>License Plate</th>
                <th>Start Location</th>
                <th>Capacity Weight (kg)</th>
                <th>Capacity Volume (m³)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.name}</td>
                  <td>{vehicle.license_plate}</td>
                  <td>{vehicle.start_location || '-'}</td>
                  <td>{vehicle.capacity_weight}</td>
                  <td>{vehicle.capacity_volume}</td>
                  <td>{getStatusBadge(vehicle.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Vehicle</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Vehicle Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>License Plate *</label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Location (Address) *</label>
                <input
                  type="text"
                  value={formData.start_location}
                  onChange={(e) => setFormData({...formData, start_location: e.target.value})}
                  placeholder="e.g., 123 Main St, Paris, France"
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacity Weight (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacity_weight}
                  onChange={(e) => setFormData({...formData, capacity_weight: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacity Volume (m³) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacity_volume}
                  onChange={(e) => setFormData({...formData, capacity_volume: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn-primary">Create Vehicle</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
