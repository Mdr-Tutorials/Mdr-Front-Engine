import type { Meta, StoryObj } from '@storybook/react';
import MdrMessage from './MdrMessage';

const meta: Meta<typeof MdrMessage> = {
    title: 'Components/Message',
    component: MdrMessage,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrMessage>;

export const Default: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MdrMessage text="Info message" type="Info" />
            <MdrMessage text="Success message" type="Success" />
            <MdrMessage text="Warning message" type="Warning" />
            <MdrMessage text="Error message" type="Danger" />
        </div>
    ),
};
