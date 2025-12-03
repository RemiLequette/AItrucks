import React from 'react';
import { MapLayer } from './types';

interface MapLayersProps {
  layers: MapLayer[];
  onToggle: (layerId: string) => void;
}

const MapLayers: React.FC<MapLayersProps> = ({ layers, onToggle }) => {
  return (
    <div className="map-layers">
      {layers.map((layer) => (
        <label key={layer.id} className="map-layer-toggle">
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={() => onToggle(layer.id)}
          />
          <span className="map-layer-label" style={{ color: layer.color }}>
            {layer.name} ({layer.count})
          </span>
        </label>
      ))}
    </div>
  );
};

export default MapLayers;
