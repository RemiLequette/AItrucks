import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { TableProps } from './types';
import './Table.css';

function Table<TData>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  enableSorting = true,
  enableRowSelection = false,
  getRowId,
  rowClassName,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedIndex,
}: TableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    enableSorting,
    enableRowSelection,
    getRowId,
  });

  if (loading) {
    return (
      <div className="card">
        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <p style={{ margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={
                    header.column.getCanSort() ? 'data-table__header--sortable' : ''
                  }
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanSort() && (
                      <span className="data-table__sort-indicator">
                        {header.column.getIsSorted() === 'asc' ? '▲' : 
                         header.column.getIsSorted() === 'desc' ? '▼' : '⇅'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const customClassName = rowClassName ? rowClassName(row.original) : undefined;
            const isDragged = draggable && draggedIndex === row.index;
            return (
              <tr
                key={row.id}
                className={customClassName}
                draggable={draggable}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onDragStart={draggable && onDragStart ? (e) => onDragStart(row.index, e) : undefined}
                onDragOver={draggable && onDragOver ? (e) => onDragOver(row.index, e) : undefined}
                onDrop={draggable && onDrop ? (e) => onDrop(row.index, e) : undefined}
                onDragEnd={draggable && onDragEnd ? onDragEnd : undefined}
                style={{
                  cursor: onRowClick ? 'pointer' : draggable ? 'move' : 'default',
                  opacity: isDragged ? 0.5 : 1,
                  backgroundColor: isDragged ? '#f8f9fa' : undefined,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
