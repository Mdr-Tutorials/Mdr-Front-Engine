import type { Meta, StoryObj } from '@storybook/react';
import MdrAnchorNavigation from './MdrAnchorNavigation';

const meta: Meta<typeof MdrAnchorNavigation> = {
    title: 'Components/AnchorNavigation',
    component: MdrAnchorNavigation,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrAnchorNavigation>;

export const Default: Story = {
    args: {
        items: [
            { id: 'intro', label: 'Introduction' },
            { id: 'usage', label: 'Usage' },
            { id: 'api', label: 'API' },
        ],
        activeId: 'usage',
    },
};

export const Horizontal: Story = {
    args: {
        items: [
            { id: 'one', label: 'Section 1' },
            { id: 'two', label: 'Section 2' },
        ],
        orientation: 'Horizontal',
        activeId: 'one',
    },
};
