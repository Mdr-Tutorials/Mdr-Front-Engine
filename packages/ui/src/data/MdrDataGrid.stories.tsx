import type { Meta, StoryObj } from '@storybook/react';
import MdrDataGrid, { type MdrDataGridColumn } from './MdrDataGrid';

interface GridRow {
    product: string;
    price: string;
    stock: number;
}

const columns: Array<MdrDataGridColumn<GridRow>> = [
    { key: 'product', title: 'Product', dataIndex: 'product' },
    { key: 'price', title: 'Price', dataIndex: 'price', align: 'Right' },
    { key: 'stock', title: 'Stock', dataIndex: 'stock', align: 'Center' },
];

const data: GridRow[] = [
    { product: 'Notebook', price: '$9.99', stock: 24 },
    { product: 'Marker', price: '$2.50', stock: 80 },
    { product: 'Backpack', price: '$49.00', stock: 12 },
];

const meta: Meta<typeof MdrDataGrid<GridRow>> = {
    title: 'Components/DataGrid',
    component: MdrDataGrid,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrDataGrid<GridRow>>;

export const Default: Story = {
    args: {
        columns,
        data,
        striped: true,
        hoverable: true,
        bordered: true,
    },
};

export const Empty: Story = {
    args: {
        columns,
        data: [],
    },
};
