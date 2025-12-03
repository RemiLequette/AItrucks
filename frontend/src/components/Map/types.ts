import { ReactNode } from 'react';
import { Icon } from 'leaflet';

export interface MapMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  icon?: Icon;
  popup?: ReactNode;
  data?: any; // Original data object
}

export interface MapRoute {
  id: string;
  positions: [number, number][];
  color?: string;
  weight?: number;
  opacity?: number;
  popup?: ReactNode;
  data?: any;
}

export interface MapProps {
  markers?: MapMarker[];
  routes?: MapRoute[];
  center?: [number, number];
  zoom?: number;
  height?: string | number;
  autoFit?: boolean;
  autoFitPadding?: [number, number];
  autoFitMaxZoom?: number;
  loading?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  onRouteClick?: (route: MapRoute) => void;
  className?: string;
}

export interface MapLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  count: number;
}
