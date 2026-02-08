import type { Meta, StoryObj } from '@storybook/react';
import MdrRegexInput from './MdrRegexInput';

const meta: Meta<typeof MdrRegexInput> = {
    title: 'Components/RegexInput',
    component: MdrRegexInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        label: 'Email',
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['Small', 'Medium', 'Large'],
        },
        state: {
            control: 'select',
            options: ['Default', 'Error', 'Warning', 'Success'],
        },
    },
};

export default meta;

type Story = StoryObj<typeof MdrRegexInput>;

export const Default: Story = {
    args: {
        placeholder: 'name@example.com',
    },
};

export const Prefilled: Story = {
    args: {
        value: 'hello@mdr.com',
    },
};

export const CustomMessages: Story = {
    args: {
        invalidMessage: 'Please enter a valid email',
        validMessage: 'Email looks correct',
    },
};
