import React from 'react';
import { StatusBadgeProps } from './types';

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  // Map status to variant if not explicitly provided
  const getVariant = (): string => {
    if (variant) return variant;
    
    const statusLower = status.toLowerCase();
    if (['pending', 'planned'].includes(statusLower)) return 'pending';
    if (['in-transit', 'in_transit', 'in-use', 'in_use'].includes(statusLower)) return 'in-transit';
    if (['delivered', 'completed', 'available'].includes(statusLower)) return 'delivered';
    if (['cancelled', 'maintenance'].includes(statusLower)) return 'cancelled';
    
    return 'pending';
  };

  return <span className={`badge badge-${getVariant()}`}>{status}</span>;
};

export default StatusBadge;
