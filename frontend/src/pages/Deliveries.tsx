import React, { useEffect, useState } from 'react';
import { getDeliveries, createDelivery, updateDelivery, deleteDelivery } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
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

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    latitude: '',
    longitude: '',
    scheduled_date: '',
    weight: '',
    volume: '',
    notes: ''
  });
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await getDeliveries();
      setDeliveries(response.deliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery?')) return;
    
    try {
      await deleteDelivery(id);
      setDeliveries(deliveries.filter(d => d.id !== id));
    } catch (error) {
      alert('Failed to delete delivery');
    }
  };

  const handleEdit = (delivery: any) => {
    // Parse location from POINT format
    const match = delivery.delivery_location?.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
    const longitude = match ? match[1] : '';
    const latitude = match ? match[2] : '';

    setEditingDelivery(delivery);
    setFormData({
      customer_name: delivery.customer_name,
      customer_phone: delivery.customer_phone || '',
      delivery_address: delivery.delivery_address,
      latitude,
      longitude,
      scheduled_date: delivery.scheduled_date?.substring(0, 16) || '',
      weight: delivery.weight.toString(),
      volume: delivery.volume.toString(),
      notes: delivery.notes || ''
    });
    setShowModal(true);
  };

  const handleGeocode = async () => {
    if (!formData.delivery_address) {
      alert('Please enter a delivery address first');
      return;
    }

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.delivery_address)}&limit=1`,
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deliveryData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        delivery_address: formData.delivery_address,
        scheduled_date: formData.scheduled_date,
        weight: parseFloat(formData.weight),
        volume: parseFloat(formData.volume),
        notes: formData.notes,
        delivery_location: `POINT(${formData.longitude} ${formData.latitude})`
      };
      
      if (editingDelivery) {
        await updateDelivery(editingDelivery.id, deliveryData);
      } else {
        await createDelivery(deliveryData);
      }
      
      setShowModal(false);
      setEditingDelivery(null);
      setFormData({
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        latitude: '',
        longitude: '',
        scheduled_date: '',
        weight: '',
        volume: '',
        notes: ''
      });
      fetchDeliveries();
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert('Failed to create delivery');
    }
  };

  const getStatusBadge = (status: string) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
  };

  const handleExport = () => {
    // Prepare data for export
    const exportData = deliveries.map(delivery => {
      const match = delivery.delivery_location?.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
      return {
        'Customer Name': delivery.customer_name,
        'Phone': delivery.customer_phone || '',
        'Address': delivery.delivery_address,
        'Latitude': match ? match[2] : '',
        'Longitude': match ? match[1] : '',
        'Scheduled Date': delivery.scheduled_date ? new Date(delivery.scheduled_date).toLocaleString() : '',
        'Weight (kg)': delivery.weight,
        'Volume (m³)': delivery.volume,
        'Status': delivery.status,
        'Notes': delivery.notes || ''
      };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deliveries');

    // Generate filename with current date
    const filename = `deliveries_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData as any[]) {
          try {
            const latitude = row['Latitude'];
            const longitude = row['Longitude'];
            
            // Build delivery data object
            const deliveryData: any = {
              customer_name: row['Customer Name'],
              customer_phone: row['Phone'] || '',
              delivery_address: row['Address'],
              scheduled_date: row['Scheduled Date'] ? new Date(row['Scheduled Date']).toISOString() : new Date().toISOString(),
              weight: parseFloat(row['Weight (kg)']),
              volume: parseFloat(row['Volume (m³)']),
              notes: row['Notes'] || ''
            };
            
            // Only add location if both latitude and longitude are provided
            if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
              deliveryData.delivery_location = `POINT(${longitude} ${latitude})`;
            }
            
            await createDelivery(deliveryData);
            successCount++;
          } catch (error) {
            console.error('Error importing row:', row, error);
            errorCount++;
          }
        }

        alert(`Import complete!\n✓ ${successCount} deliveries imported\n${errorCount > 0 ? `✗ ${errorCount} errors` : ''}`);
        fetchDeliveries();
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Failed to read Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input so same file can be imported again
    e.target.value = '';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Deliveries</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleExport} disabled={deliveries.length === 0}>
            <Download size={18} style={{ marginRight: '8px', display: 'inline' }} />
            Export to Excel
          </button>
          {(hasRole('delivery_creator') || hasRole('admin')) && (
            <>
              <label className="btn-secondary" style={{ marginBottom: 0, cursor: 'pointer' }}>
                <Upload size={18} style={{ marginRight: '8px', display: 'inline' }} />
                Import from Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
              <button className="btn-primary" onClick={() => { setEditingDelivery(null); setShowModal(true); }}>
                <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
                New Delivery
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        {deliveries.length === 0 ? (
          <p>No deliveries found. Create your first delivery to get started.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Address</th>
                <th>Location</th>
                <th>Scheduled Date</th>
                <th>Weight (kg)</th>
                <th>Volume (m³)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => {
                const hasLocation = delivery.delivery_location && delivery.delivery_location.includes('POINT');
                return (
                <tr key={delivery.id} style={!hasLocation ? { backgroundColor: '#fff3cd' } : {}}>
                  <td>{delivery.customer_name}</td>
                  <td>{delivery.delivery_address}</td>
                  <td>
                    {hasLocation ? (
                      <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Valid</span>
                    ) : (
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>⚠ Missing</span>
                    )}
                  </td>
                  <td>{new Date(delivery.scheduled_date).toLocaleString()}</td>
                  <td>{delivery.weight}</td>
                  <td>{delivery.volume}</td>
                  <td>{getStatusBadge(delivery.status)}</td>
                  <td>
                    {hasRole('delivery_creator', 'admin') && (
                      <>
                        <button 
                          className="btn-secondary" 
                          style={{ marginRight: '8px', padding: '6px 12px' }}
                          onClick={() => handleEdit(delivery)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-danger" 
                          style={{ padding: '6px 12px' }}
                          onClick={() => handleDelete(delivery.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingDelivery(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingDelivery ? 'Edit Delivery' : 'Create New Delivery'}</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
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
                <label>Scheduled Date *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Weight (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Volume (m³) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.volume}
                  onChange={(e) => setFormData({...formData, volume: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
                        <Popup>{formData.delivery_address}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn-primary">
                  {editingDelivery ? 'Update Delivery' : 'Create Delivery'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditingDelivery(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deliveries;
