import React from 'react';
import { ActionButtonsProps } from './types';

const ActionButtons: React.FC<ActionButtonsProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {children}
    </div>
  );
};

export default ActionButtons;
