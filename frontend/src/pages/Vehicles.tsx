import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getVehicles, createVehicle, updateVehicle } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Table, createBadgeColumn, createNumberColumn, createActionColumn } from '../components/Table';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Vehicles = () => {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    capacity_weight: '',
    capacity_volume: '',
    start_location: '',
    latitude: '',
    longitude: ''
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

  const handleGeocode = async () => {
    if (!formData.start_location) {
      alert('Please enter a start location first');
      return;
    }

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.start_location)}&limit=1`,
        {
          headers: {
            'User-Agent': 'AITrucks Delivery App'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: data[0].lat,
          longitude: data[0].lon
        });
        alert('Coordinates found successfully!');
      } else {
        alert('Could not find coordinates for this address. Please enter them manually.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to geocode address. Please enter coordinates manually.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleEdit = (vehicle: any) => {
    // Parse location from POINT format
    const match = vehicle.current_location?.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
    const longitude = match ? match[1] : '';
    const latitude = match ? match[2] : '';

    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      license_plate: vehicle.license_plate,
      capacity_weight: vehicle.capacity_weight.toString(),
      capacity_volume: vehicle.capacity_volume.toString(),
      start_location: vehicle.start_location || '',
      latitude,
      longitude
    });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicleData = {
        name: formData.name,
        license_plate: formData.license_plate,
        capacity_weight: parseFloat(formData.capacity_weight),
        capacity_volume: parseFloat(formData.capacity_volume),
        start_location: formData.start_location,
        current_location: `POINT(${formData.longitude} ${formData.latitude})`
      };
      
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
      
      setShowModal(false);
      setEditingVehicle(null);
      setFormData({
        name: '',
        license_plate: '',
        capacity_weight: '',
        capacity_volume: '',
        start_location: '',
        latitude: '',
        longitude: ''
      });
      fetchVehicles();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Failed to create vehicle');
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'license_plate',
        header: 'License Plate',
      },
      {
        accessorKey: 'start_location',
        header: 'Start Location',
        cell: ({ getValue }) => (getValue() as string) || '-',
      },
      createNumberColumn('capacity_weight', 'Capacity Weight (kg)', { decimals: 2 }),
      createNumberColumn('capacity_volume', 'Capacity Volume (m³)', { decimals: 2 }),
      createBadgeColumn('status', 'Status'),
      createActionColumn({
        onEdit: hasRole('admin') ? handleEdit : undefined,
        showEdit: () => hasRole('admin'),
      }),
    ],
    [hasRole, vehicles]
  );

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
        <h1 className="page-title">{t('vehicles.title')}</h1>
        {hasRole('admin') && (
          <button className="btn-primary" onClick={() => { setEditingVehicle(null); setShowModal(true); }}>
            <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
            New Vehicle
          </button>
        )}
      </div>

      <Table
        data={vehicles}
        columns={columns}
        loading={loading}
        emptyMessage={t('empty.vehicles')}
        enableSorting={true}
        getRowId={(row) => row.id}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingVehicle(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingVehicle ? 'Edit Vehicle' : 'Create New Vehicle'}</h2>
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
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleGeocode}
                  disabled={geocoding}
                  style={{ marginTop: '8px', width: '100%' }}
                >
                  {geocoding ? 'Finding coordinates...' : '📍 Get Coordinates from Address'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    placeholder="e.g., 48.8566"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    placeholder="e.g., 2.3522"
                    required
                  />
                </div>
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

              {/* Preview Map */}
              {formData.latitude && formData.longitude && (
                <div className="form-group">
                  <label>Location Preview</label>
                  <div style={{ height: '200px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #dee2e6' }}>
                    <MapContainer
                      center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      key={`${formData.latitude}-${formData.longitude}`}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}>
                        <Popup>{formData.start_location}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn-primary">
                  {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditingVehicle(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
