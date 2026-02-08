import type { Meta, StoryObj } from '@storybook/react';
import MdrSkeleton from './MdrSkeleton';

const meta: Meta<typeof MdrSkeleton> = {
    title: 'Components/Skeleton',
    component: MdrSkeleton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrSkeleton>;

export const Default: Story = {
    render: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '320px',
            }}
        >
            <MdrSkeleton variant="Text" lines={3} />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <MdrSkeleton variant="Circle" />
                <MdrSkeleton variant="Rect" width={200} height={48} />
            </div>
        </div>
    ),
};
