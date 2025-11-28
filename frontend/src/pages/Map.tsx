import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { getDeliveries, getVehicles, getTrips } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different marker types
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const Map = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeliveries, setShowDeliveries] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showTrips, setShowTrips] = useState(false);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const [deliveriesRes, vehiclesRes, tripsRes] = await Promise.all([
        getDeliveries(),
        getVehicles(),
        getTrips()
      ]);
      console.log('Deliveries data:', deliveriesRes.deliveries);
      console.log('Sample delivery location:', deliveriesRes.deliveries[0]?.delivery_location);
      setDeliveries(deliveriesRes.deliveries);
      setVehicles(vehiclesRes.vehicles);
      setTrips(tripsRes.trips);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse PostGIS POINT format: "POINT(lng lat)"
  const parseLocation = (locationStr: string): [number, number] | null => {
    if (!locationStr) {
      console.log('No location string provided');
      return null;
    }
    const match = locationStr.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (match) {
      const result: [number, number] = [parseFloat(match[2]), parseFloat(match[1])]; // [lat, lng]
      console.log('Parsed location:', locationStr, '→', result);
      return result;
    }
    console.log('Failed to parse location:', locationStr);
    return null;
  };

  if (loading) return <div>Loading map...</div>;

  // Default center (Paris)
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 className="page-title">Map View</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showDeliveries}
              onChange={(e) => setShowDeliveries(e.target.checked)}
              style={{ width: 'auto', margin: 0 }}
            />
            <span style={{ color: '#dc3545', fontWeight: 500 }}>Deliveries</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showVehicles}
              onChange={(e) => setShowVehicles(e.target.checked)}
              style={{ width: 'auto', margin: 0 }}
            />
            <span style={{ color: '#007bff', fontWeight: 500 }}>Vehicles</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showTrips}
              onChange={(e) => setShowTrips(e.target.checked)}
              style={{ width: 'auto', margin: 0 }}
            />
            <span style={{ color: '#28a745', fontWeight: 500 }}>Trip Routes</span>
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 0, height: 'calc(100vh - 200px)' }}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Delivery Markers */}
          {showDeliveries && deliveries.map((delivery) => {
            const location = parseLocation(delivery.delivery_location);
            if (!location) return null;
            return (
              <Marker key={`delivery-${delivery.id}`} position={location} icon={deliveryIcon}>
                <Popup>
                  <strong>{delivery.customer_name}</strong>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    <div>{delivery.delivery_address}</div>
                    <div style={{ marginTop: '4px', color: '#666' }}>
                      Weight: {delivery.weight}kg | Volume: {delivery.volume}m³
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      Status: <strong>{delivery.status}</strong>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Vehicle Markers */}
          {showVehicles && vehicles.map((vehicle) => {
            const location = parseLocation(vehicle.current_location);
            if (!location) return null;
            return (
              <Marker key={`vehicle-${vehicle.id}`} position={location} icon={vehicleIcon}>
                <Popup>
                  <strong>{vehicle.name}</strong>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    <div>{vehicle.license_plate}</div>
                    <div style={{ marginTop: '4px', color: '#666' }}>
                      Capacity: {vehicle.capacity_weight}kg | {vehicle.capacity_volume}m³
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      Status: <strong>{vehicle.status}</strong>
                    </div>
                    {vehicle.start_location && (
                      <div style={{ marginTop: '4px', color: '#666' }}>
                        Base: {vehicle.start_location}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Trip Routes - placeholder for now */}
          {showTrips && trips.length > 0 && (
            <div style={{ 
              position: 'absolute', 
              bottom: '20px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 1000,
              backgroundColor: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              fontSize: '12px'
            }}>
              Trip routes will be displayed once deliveries are assigned
            </div>
          )}
        </MapContainer>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '14px', color: '#666' }}>
        <div>
          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>●</span> {deliveries.length} Deliveries
        </div>
        <div>
          <span style={{ color: '#007bff', fontWeight: 'bold' }}>●</span> {vehicles.length} Vehicles
        </div>
        <div>
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>●</span> {trips.length} Trips
        </div>
      </div>
    </div>
  );
};

export default Map;
