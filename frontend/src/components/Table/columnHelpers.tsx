import { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';

/**
 * Creates a column definition for status badges
 */
export function createBadgeColumn<TData>(
  accessorKey: keyof TData,
  header: string
): ColumnDef<TData> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <StatusBadge status={value} />;
    },
  };
}

/**
 * Creates a column definition for formatted dates
 */
export function createDateColumn<TData>(
  accessorKey: keyof TData,
  header: string,
  options?: Intl.DateTimeFormatOptions
): ColumnDef<TData> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as string | Date;
      if (!value) return '-';
      const date = typeof value === 'string' ? new Date(value) : value;
      return date.toLocaleString(undefined, options);
    },
  };
}

/**
 * Creates a column definition for formatted numbers
 */
export function createNumberColumn<TData>(
  accessorKey: keyof TData,
  header: string,
  options?: {
    decimals?: number;
    suffix?: string;
    prefix?: string;
  }
): ColumnDef<TData> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as number;
      if (value === null || value === undefined) return '-';
      
      const formatted = options?.decimals !== undefined
        ? value.toFixed(options.decimals)
        : value.toString();
      
      return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`;
    },
  };
}

interface ActionColumnOptions<TData> {
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onAssign?: (row: TData) => void;
  customActions?: Array<{
    label: React.ReactNode;
    onClick: (row: TData) => void;
    className?: string;
    show?: (row: TData) => boolean;
  }>;
  showEdit?: (row: TData) => boolean;
  showDelete?: (row: TData) => boolean;
  showAssign?: (row: TData) => boolean;
}

/**
 * Creates a column definition for action buttons
 */
export function createActionColumn<TData>(
  options: ActionColumnOptions<TData>
): ColumnDef<TData> {
  return {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const { onEdit, onDelete, onAssign, customActions, showEdit, showDelete, showAssign } = options;
      
      const shouldShowEdit = showEdit ? showEdit(row.original) : !!onEdit;
      const shouldShowDelete = showDelete ? showDelete(row.original) : !!onDelete;
      const shouldShowAssign = showAssign ? showAssign(row.original) : !!onAssign;
      
      return (
        <ActionButtons>
          {shouldShowEdit && onEdit && (
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px' }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {shouldShowDelete && onDelete && (
            <button
              className="btn-danger"
              style={{ padding: '6px 12px' }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
          {shouldShowAssign && onAssign && (
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px' }}
              onClick={(e) => {
                e.stopPropagation();
                onAssign(row.original);
              }}
            >
              Assign
            </button>
          )}
          {customActions?.map((action, index) => {
            const shouldShow = action.show ? action.show(row.original) : true;
            if (!shouldShow) return null;
            
            return (
              <button
                key={index}
                className={action.className || 'btn-secondary'}
                style={{ padding: '6px 12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(row.original);
                }}
              >
                {action.label}
              </button>
            );
          })}
        </ActionButtons>
      );
    },
    enableSorting: false,
  };
}
