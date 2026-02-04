import type { Meta, StoryObj } from '@storybook/react';
import MdrPasswordStrength from './MdrPasswordStrength';

const meta: Meta<typeof MdrPasswordStrength> = {
  title: 'Components/PasswordStrength',
  component: MdrPasswordStrength,
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

type Story = StoryObj<typeof MdrPasswordStrength>;

export const Default: Story = {
  args: {
    label: 'Password',
    description: 'Use at least 8 characters.',
  },
};

export const Prefilled: Story = {
  args: {
    label: 'Password',
    defaultValue: 'P@ssword123',
  },
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '320px',
      }}
    >
      <MdrPasswordStrength label="Small" size="Small" />
      <MdrPasswordStrength label="Medium" size="Medium" />
      <MdrPasswordStrength label="Large" size="Large" />
    </div>
  ),
};
