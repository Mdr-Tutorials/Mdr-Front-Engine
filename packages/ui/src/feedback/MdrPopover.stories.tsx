import type { Meta, StoryObj } from '@storybook/react';
import MdrPopover from './MdrPopover';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrPopover> = {
    title: 'Components/Popover',
    component: MdrPopover,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrPopover>;

export const Default: Story = {
    render: () => (
        <MdrPopover title="Details" content="Popover content goes here">
            <MdrButton text="Click" size="Small" />
        </MdrPopover>
    ),
};

export const Hover: Story = {
    render: () => (
        <MdrPopover title="Quick info" content="Hover content" trigger="Hover">
            <MdrButton text="Hover" size="Small" />
        </MdrPopover>
    ),
};
