import type { Meta, StoryObj } from '@storybook/react';
import MdrRange from './MdrRange';

const meta: Meta<typeof MdrRange> = {
  title: 'Components/Range',
  component: MdrRange,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrRange>;

export const Default: Story = {
  args: {
    label: 'Price range',
    defaultValue: { min: 20, max: 80 },
  },
};

export const CustomRange: Story = {
  args: {
    label: 'Salary',
    min: 0,
    max: 100,
    step: 5,
    defaultValue: { min: 30, max: 70 },
  },
};
