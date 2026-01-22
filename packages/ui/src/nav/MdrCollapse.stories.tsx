import type { Meta, StoryObj } from '@storybook/react';
import MdrCollapse from './MdrCollapse';

const meta: Meta<typeof MdrCollapse> = {
    title: 'Components/Collapse',
    component: MdrCollapse,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrCollapse>;

export const Default: Story = {
    args: {
        items: [
            { key: 'one', title: 'Panel 1', content: 'Content for panel 1' },
            { key: 'two', title: 'Panel 2', content: 'Content for panel 2' },
            { key: 'three', title: 'Panel 3', content: 'Content for panel 3', disabled: true },
        ],
        defaultActiveKeys: ['one'],
    },
};

export const Accordion: Story = {
    args: {
        items: [
            { key: 'a', title: 'First', content: 'First content' },
            { key: 'b', title: 'Second', content: 'Second content' },
        ],
        accordion: true,
    },
};
