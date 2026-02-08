import type { Meta, StoryObj } from '@storybook/react';
import MdrSpinner from './MdrSpinner';

const meta: Meta<typeof MdrSpinner> = {
    title: 'Components/Spinner',
    component: MdrSpinner,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['Small', 'Medium', 'Large'],
        },
    },
};

export default meta;

type Story = StoryObj<typeof MdrSpinner>;

export const Default: Story = {
    args: {
        label: 'Loading',
    },
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <MdrSpinner size="Small" />
            <MdrSpinner size="Medium" />
            <MdrSpinner size="Large" />
        </div>
    ),
};
