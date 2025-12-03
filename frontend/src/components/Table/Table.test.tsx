import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Table from './Table';
import { ColumnDef } from '@tanstack/react-table';

interface TestData {
  id: string;
  name: string;
  age: number;
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', age: 30 },
  { id: '2', name: 'Jane Smith', age: 25 },
];

const mockColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
];

describe('Table Component', () => {
  it('should render table with data', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        getRowId={(row) => row.id}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        getRowId={(row) => row.id}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <Table
        data={[]}
        columns={mockColumns}
        loading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    const emptyMessage = 'No records found';
    render(
      <Table
        data={[]}
        columns={mockColumns}
        emptyMessage={emptyMessage}
      />
    );

    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  });

  it('should handle row click', async () => {
    const handleRowClick = vi.fn();
    const { user } = render(
      <Table
        data={mockData}
        columns={mockColumns}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
      />
    );

    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      await user.click(firstRow);
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('should apply custom row className', () => {
    const rowClassName = (row: TestData) => row.age > 25 ? 'older' : 'younger';
    
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        getRowId={(row) => row.id}
        rowClassName={rowClassName}
      />
    );

    const johnRow = screen.getByText('John Doe').closest('tr');
    const janeRow = screen.getByText('Jane Smith').closest('tr');

    expect(johnRow).toHaveClass('older');
    expect(janeRow).toHaveClass('younger');
  });
});
