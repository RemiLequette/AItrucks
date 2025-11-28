import { ColumnDef } from '@tanstack/react-table';

export interface TableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  enableSorting?: boolean;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  rowClassName?: (row: TData) => string | undefined;
}

export type StatusVariant = 'pending' | 'in-transit' | 'delivered' | 'cancelled' | 'available' | 'in-use' | 'maintenance' | 'planned' | 'completed';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

export interface ActionButtonsProps {
  children: React.ReactNode;
}

export interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}
