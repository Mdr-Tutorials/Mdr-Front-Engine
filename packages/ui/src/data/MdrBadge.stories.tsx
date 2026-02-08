import type { Meta, StoryObj } from '@storybook/react';
import MdrBadge from './MdrBadge';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrBadge> = {
    title: 'Components/Badge',
    component: MdrBadge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrBadge>;

export const Default: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <MdrBadge count={3}>
                <MdrButton text="Inbox" />
            </MdrBadge>
            <MdrBadge count={120} max={99}>
                <MdrButton text="Alerts" />
            </MdrBadge>
            <MdrBadge dot>
                <MdrButton text="Live" />
            </MdrBadge>
        </div>
    ),
};
