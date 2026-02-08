import type { Meta, StoryObj } from '@storybook/react';
import MdrDrawer from './MdrDrawer';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrDrawer> = {
    title: 'Components/Drawer',
    component: MdrDrawer,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrDrawer>;

export const Default: Story = {
    args: {
        open: true,
        title: 'Settings',
        children: 'Drawer content goes here.',
        footer: <MdrButton text="Save" size="Small" category="Primary" />,
    },
};

export const Left: Story = {
    args: {
        open: true,
        title: 'Filters',
        placement: 'Left',
        children: 'Filter options',
    },
};
