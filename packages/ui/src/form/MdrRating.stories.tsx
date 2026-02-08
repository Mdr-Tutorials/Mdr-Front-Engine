import type { Meta, StoryObj } from '@storybook/react';
import MdrRating from './MdrRating';

const meta: Meta<typeof MdrRating> = {
    title: 'Components/Rating',
    component: MdrRating,
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

type Story = StoryObj<typeof MdrRating>;

export const Default: Story = {
    args: {
        label: 'Rating',
        defaultValue: 3,
    },
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MdrRating label="Small" size="Small" defaultValue={2} />
            <MdrRating label="Medium" size="Medium" defaultValue={4} />
            <MdrRating label="Large" size="Large" defaultValue={5} />
        </div>
    ),
};

export const ReadOnly: Story = {
    args: {
        label: 'Read only',
        value: 4,
        readOnly: true,
    },
};
