import React from 'react';
import { MapLayer } from './types';

interface MapStatsProps {
  layers: MapLayer[];
}

const MapStats: React.FC<MapStatsProps> = ({ layers }) => {
  return (
    <div className="map-stats">
      {layers.map((layer) => (
        <div key={layer.id} className="map-stat-item">
          <span className="map-stat-dot" style={{ color: layer.color }}>●</span>
          <span>{layer.count} {layer.name}</span>
        </div>
      ))}
    </div>
  );
};

export default MapStats;
