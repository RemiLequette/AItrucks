import React, { useEffect, useState } from 'react';
import { getDeliveries, createDelivery, deleteDelivery } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit } from 'lucide-react';

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For now, use a dummy location (Paris coordinates)
      const deliveryData = {
        ...formData,
        weight: parseFloat(formData.weight),
        volume: parseFloat(formData.volume),
        delivery_location: 'POINT(2.3522 48.8566)'
      };
      await createDelivery(deliveryData);
      setShowModal(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Deliveries</h1>
        {hasRole('delivery_creator', 'admin') && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
            New Delivery
          </button>
        )}
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
                <th>Scheduled Date</th>
                <th>Weight (kg)</th>
                <th>Volume (m³)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{delivery.customer_name}</td>
                  <td>{delivery.delivery_address}</td>
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Delivery</h2>
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
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn-primary">Create Delivery</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deliveries;
