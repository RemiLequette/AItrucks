import { describe, it, expect } from 'vitest';
import { createBadgeColumn, createDateColumn, createNumberColumn } from '../columnHelpers';

describe('Column Helpers', () => {
  describe('createBadgeColumn', () => {
    it('should create a badge column with correct header', () => {
      const column = createBadgeColumn('status', 'Status');
      
      expect(column.accessorKey).toBe('status');
      expect(column.header).toBe('Status');
      expect(column.cell).toBeDefined();
    });
  });

  describe('createDateColumn', () => {
    it('should create a date column with correct configuration', () => {
      const column = createDateColumn('created_at', 'Created');
      
      expect(column.accessorKey).toBe('created_at');
      expect(column.header).toBe('Created');
      expect(column.cell).toBeDefined();
    });
  });

  describe('createNumberColumn', () => {
    it('should create a number column with default options', () => {
      const column = createNumberColumn('amount', 'Amount');
      
      expect(column.accessorKey).toBe('amount');
      expect(column.header).toBe('Amount');
      expect(column.cell).toBeDefined();
    });

    it('should create a number column with custom decimals', () => {
      const column = createNumberColumn('price', 'Price', { decimals: 2 });
      
      expect(column.accessorKey).toBe('price');
      expect(column.cell).toBeDefined();
    });
  });
});
