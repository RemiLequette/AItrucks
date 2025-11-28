import React from 'react';
import { EmptyStateProps } from './types';

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon, action }) => {
  return (
    <div style={{ 
      padding: '60px 20px', 
      textAlign: 'center',
      color: '#6c757d'
    }}>
      {icon && (
        <div style={{ marginBottom: '16px', opacity: 0.5 }}>
          {icon}
        </div>
      )}
      <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>{message}</p>
      {action && (
        <button className="btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
