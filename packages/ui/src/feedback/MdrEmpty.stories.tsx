import type { Meta, StoryObj } from '@storybook/react';
import MdrEmpty from './MdrEmpty';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrEmpty> = {
  title: 'Components/Empty',
  component: MdrEmpty,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrEmpty>;

export const Default: Story = {
  args: {
    title: 'No results',
    description: 'Try adjusting your filters.',
    action: <MdrButton text="Reset" size="Small" category="Secondary" />,
  },
};
