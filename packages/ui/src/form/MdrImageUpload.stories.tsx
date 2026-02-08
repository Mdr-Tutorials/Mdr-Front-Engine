import type { Meta, StoryObj } from '@storybook/react';
import MdrImageUpload from './MdrImageUpload';

const meta: Meta<typeof MdrImageUpload> = {
    title: 'Components/ImageUpload',
    component: MdrImageUpload,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrImageUpload>;

export const Default: Story = {
    args: {
        label: 'Upload images',
        description: 'PNG, JPG or GIF files.',
    },
};

export const Multiple: Story = {
    args: {
        label: 'Gallery images',
        multiple: true,
    },
};

export const Disabled: Story = {
    args: {
        label: 'Upload disabled',
        disabled: true,
    },
};
