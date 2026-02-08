import type { Meta, StoryObj } from '@storybook/react';
import MdrTreeSelect, { type MdrTreeSelectOption } from './MdrTreeSelect';

const options: MdrTreeSelectOption[] = [
    {
        id: 'design',
        label: 'Design',
        children: [
            { id: 'wireframes', label: 'Wireframes' },
            { id: 'mockups', label: 'Mockups' },
        ],
    },
    {
        id: 'engineering',
        label: 'Engineering',
        children: [
            { id: 'frontend', label: 'Frontend' },
            { id: 'backend', label: 'Backend' },
        ],
    },
];

const meta: Meta<typeof MdrTreeSelect> = {
    title: 'Components/TreeSelect',
    component: MdrTreeSelect,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        options,
    },
};

export default meta;

type Story = StoryObj<typeof MdrTreeSelect>;

export const Default: Story = {
    args: {
        label: 'Category',
        placeholder: 'Select category',
    },
};

export const Prefilled: Story = {
    args: {
        label: 'Category',
        value: 'frontend',
    },
};
