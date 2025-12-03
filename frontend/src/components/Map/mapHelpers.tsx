import L from 'leaflet';
import { MapMarker } from './types';

// Custom icon creator
export const createCustomIcon = (color: string): L.Icon => {
  const colorMap: Record<string, string> = {
    red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    green: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    orange: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    yellow: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    violet: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    grey: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    black: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  };

  return new L.Icon({
    iconUrl: colorMap[color] || colorMap.red,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Predefined icons
export const deliveryIcon = createCustomIcon('red');
export const vehicleIcon = createCustomIcon('blue');
export const tripIcon = createCustomIcon('green');

// Parse PostGIS POINT format: "POINT(lng lat)"
export const parseLocation = (locationStr: string): [number, number] | null => {
  if (!locationStr) return null;
  
  const match = locationStr.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (match) {
    return [parseFloat(match[2]), parseFloat(match[1])]; // [lat, lng]
  }
  
  return null;
};

// Create marker from delivery data
export const createDeliveryMarker = (delivery: any): MapMarker | null => {
  const location = parseLocation(delivery.delivery_location);
  if (!location) return null;

  return {
    id: `delivery-${delivery.id}`,
    position: location,
    icon: deliveryIcon,
    data: delivery,
    popup: (
      <div>
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
      </div>
    )
  };
};

// Create marker from vehicle data
export const createVehicleMarker = (vehicle: any): MapMarker | null => {
  const location = parseLocation(vehicle.current_location);
  if (!location) return null;

  return {
    id: `vehicle-${vehicle.id}`,
    position: location,
    icon: vehicleIcon,
    data: vehicle,
    popup: (
      <div>
        <strong>{vehicle.name}</strong>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          <div>{vehicle.license_plate}</div>
          <div style={{ marginTop: '4px', color: '#666' }}>
            Capacity: {vehicle.capacity_weight}kg | {vehicle.capacity_volume}m³
          </div>
          <div style={{ marginTop: '4px' }}>
            Status: <strong>{vehicle.status}</strong>
          </div>
        </div>
      </div>
    )
  };
};
