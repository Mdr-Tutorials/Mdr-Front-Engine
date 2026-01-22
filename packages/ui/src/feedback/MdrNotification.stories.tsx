import type { Meta, StoryObj } from '@storybook/react';
import MdrNotification from './MdrNotification';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrNotification> = {
    title: 'Components/Notification',
    component: MdrNotification,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrNotification>;

export const Default: Story = {
    args: {
        title: 'New update',
        description: 'Version 2.4.0 is now available.',
        actions: <MdrButton text="Update" size="Small" category="Primary" />,
    },
};

export const Success: Story = {
    args: {
        title: 'Upload complete',
        description: 'Your files are ready.',
        type: 'Success',
    },
};
