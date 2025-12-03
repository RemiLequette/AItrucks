import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDeliveries, getVehicles, getTrips } from '../services/api';
import { Map, MapLayers, MapStats, MapMarker, MapLayer, createDeliveryMarker, createVehicleMarker } from '../components/Map';
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'deliveries', name: t('map.deliveries'), color: '#dc3545', visible: true, count: 0 },
    { id: 'vehicles', name: t('map.vehicles'), color: '#007bff', visible: true, count: 0 },
    { id: 'trips', name: t('map.tripRoutes'), color: '#28a745', visible: false, count: 0 },
  ]);

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
      
      setDeliveries(deliveriesRes.deliveries);
      setVehicles(vehiclesRes.vehicles);
      setTrips(tripsRes.trips);
      
      // Update counts
      setLayers(prev => prev.map(layer => {
        if (layer.id === 'deliveries') return { ...layer, count: deliveriesRes.deliveries.length };
        if (layer.id === 'vehicles') return { ...layer, count: vehiclesRes.vehicles.length };
        if (layer.id === 'trips') return { ...layer, count: tripsRes.trips.length };
        return layer;
      }));
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLayerToggle = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  // Get visible layers
  const showDeliveries = layers.find(l => l.id === 'deliveries')?.visible ?? true;
  const showVehicles = layers.find(l => l.id === 'vehicles')?.visible ?? true;
  const showTrips = layers.find(l => l.id === 'trips')?.visible ?? false;

  // Build markers from data
  const markers: MapMarker[] = [
    ...(showDeliveries ? deliveries.map(createDeliveryMarker).filter(Boolean) as MapMarker[] : []),
    ...(showVehicles ? vehicles.map(createVehicleMarker).filter(Boolean) as MapMarker[] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 className="page-title">{t('map.title')}</h1>
        <MapLayers layers={layers} onToggle={handleLayerToggle} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Map 
          markers={markers}
          loading={loading}
          height="calc(100vh - 200px)"
          autoFit={true}
        />
      </div>

      <MapStats layers={layers} />
    </div>
  );
};

export default MapPage;
