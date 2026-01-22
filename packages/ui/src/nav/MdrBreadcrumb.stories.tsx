import type { Meta, StoryObj } from '@storybook/react';
import MdrBreadcrumb from './MdrBreadcrumb';

const meta: Meta<typeof MdrBreadcrumb> = {
    title: 'Components/Breadcrumb',
    component: MdrBreadcrumb,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrBreadcrumb>;

export const Default: Story = {
    args: {
        items: [
            { label: 'Home', href: '#' },
            { label: 'Library', href: '#' },
            { label: 'Data' },
        ],
    },
};
