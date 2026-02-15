import type { Meta, StoryObj } from '@storybook/react';
import MdrTable, { type MdrTableColumn } from './MdrTable';

interface RowData {
  name: string;
  role: string;
  status: string;
}

const columns: Array<MdrTableColumn<RowData>> = [
  { key: 'name', title: 'Name', dataIndex: 'name' },
  { key: 'role', title: 'Role', dataIndex: 'role' },
  { key: 'status', title: 'Status', dataIndex: 'status', align: 'Center' },
];

const data: RowData[] = [
  { name: 'Alice', role: 'Designer', status: 'Active' },
  { name: 'Ben', role: 'Developer', status: 'Away' },
  { name: 'Chloe', role: 'PM', status: 'Active' },
];

const meta: Meta<typeof MdrTable<RowData>> = {
  title: 'Components/Table',
  component: MdrTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrTable<RowData>>;

export const Default: Story = {
  args: {
    title: 'Team members',
    columns,
    data,
    striped: true,
    hoverable: true,
  },
};

export const Empty: Story = {
  args: {
    title: 'Empty table',
    columns,
    data: [],
    emptyText: 'No records yet',
  },
};
