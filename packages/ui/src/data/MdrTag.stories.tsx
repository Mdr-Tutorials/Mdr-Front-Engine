import type { Meta, StoryObj } from '@storybook/react';
import MdrTag from './MdrTag';

const meta: Meta<typeof MdrTag> = {
    title: 'Components/Tag',
    component: MdrTag,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        color: {
            control: 'select',
            options: ['Default', 'Primary', 'Secondary', 'Success', 'Warning', 'Danger'],
        },
        variant: {
            control: 'select',
            options: ['Solid', 'Outline', 'Soft'],
        },
        size: {
            control: 'select',
            options: ['Small', 'Medium', 'Large'],
        },
    },
};

export default meta;

type Story = StoryObj<typeof MdrTag>;

export const Default: Story = {
    args: {
        text: 'Tag',
        variant: 'Soft',
    },
};

export const Colors: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px' }}>
            <MdrTag text="Default" />
            <MdrTag text="Primary" color="Primary" />
            <MdrTag text="Secondary" color="Secondary" />
            <MdrTag text="Success" color="Success" />
            <MdrTag text="Warning" color="Warning" />
            <MdrTag text="Danger" color="Danger" />
        </div>
    ),
};

export const Closable: Story = {
    args: {
        text: 'Closable',
        closable: true,
    },
};
