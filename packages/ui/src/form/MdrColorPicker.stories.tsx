import type { Meta, StoryObj } from '@storybook/react';
import MdrColorPicker from './MdrColorPicker';

const meta: Meta<typeof MdrColorPicker> = {
    title: 'Components/ColorPicker',
    component: MdrColorPicker,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrColorPicker>;

export const Default: Story = {
    args: {
        label: 'Theme color',
        value: '#2f6fed',
    },
};

export const WithoutTextInput: Story = {
    args: {
        label: 'Accent',
        showTextInput: false,
        value: '#ffb007',
    },
};
