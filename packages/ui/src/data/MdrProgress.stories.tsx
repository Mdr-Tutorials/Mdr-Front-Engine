import type { Meta, StoryObj } from '@storybook/react';
import MdrProgress from './MdrProgress';

const meta: Meta<typeof MdrProgress> = {
    title: 'Components/Progress',
    component: MdrProgress,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrProgress>;

export const Default: Story = {
    args: {
        label: 'Upload',
        value: 65,
    },
};

export const Statuses: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '360px' }}>
            <MdrProgress label="Default" value={40} />
            <MdrProgress label="Success" value={100} status="Success" />
            <MdrProgress label="Warning" value={70} status="Warning" />
            <MdrProgress label="Danger" value={30} status="Danger" />
        </div>
    ),
};
