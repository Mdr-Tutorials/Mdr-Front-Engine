import type { Meta, StoryObj } from '@storybook/react';
import MdrSlider from './MdrSlider';

const meta: Meta<typeof MdrSlider> = {
  title: 'Components/Slider',
  component: MdrSlider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['Small', 'Medium', 'Large'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof MdrSlider>;

export const Default: Story = {
  args: {
    label: 'Volume',
    defaultValue: 40,
  },
};

export const Range: Story = {
  args: {
    label: 'Opacity',
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 0.6,
  },
};
