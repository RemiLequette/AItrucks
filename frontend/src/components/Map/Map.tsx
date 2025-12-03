import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapProps } from './types';
import './Map.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to fit map bounds to markers
const FitBounds = ({ 
  positions, 
  padding = [50, 50], 
  maxZoom = 15 
}: { 
  positions: [number, number][]; 
  padding?: [number, number]; 
  maxZoom?: number;
}) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding, maxZoom });
    }
  }, [positions, map, padding, maxZoom]);

  return null;
};

const Map: React.FC<MapProps> = ({
  markers = [],
  routes = [],
  center = [48.8566, 2.3522], // Default: Paris
  zoom = 12,
  height = 'calc(100vh - 200px)',
  autoFit = true,
  autoFitPadding = [50, 50],
  autoFitMaxZoom = 15,
  loading = false,
  onMarkerClick,
  onRouteClick,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`map-container ${className}`} style={{ height }}>
        <div className="map-loading">
          <div>Loading map...</div>
        </div>
      </div>
    );
  }

  // Collect all positions for auto-fit
  const allPositions: [number, number][] = [
    ...markers.map(m => m.position),
    ...routes.flatMap(r => r.positions)
  ];

  return (
    <div className={`map-container ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit map to show all markers and routes */}
        {autoFit && allPositions.length > 0 && (
          <FitBounds 
            positions={allPositions} 
            padding={autoFitPadding}
            maxZoom={autoFitMaxZoom}
          />
        )}

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={marker.icon}
            eventHandlers={{
              click: () => onMarkerClick?.(marker),
            }}
          >
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}

        {/* Routes */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.positions}
            pathOptions={{
              color: route.color || '#28a745',
              weight: route.weight || 3,
              opacity: route.opacity || 0.7,
            }}
            eventHandlers={{
              click: () => onRouteClick?.(route),
            }}
          >
            {route.popup && <Popup>{route.popup}</Popup>}
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;
