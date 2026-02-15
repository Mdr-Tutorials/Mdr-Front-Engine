import type { Meta, StoryObj } from '@storybook/react';
import MdrTimePicker from './MdrTimePicker';

const meta: Meta<typeof MdrTimePicker> = {
  title: 'Components/TimePicker',
  component: MdrTimePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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

type Story = StoryObj<typeof MdrTimePicker>;

export const Default: Story = {
  args: {
    label: 'Time',
    value: '09:30',
  },
};

export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '280px',
      }}
    >
      <MdrTimePicker label="Default" value="09:30" />
      <MdrTimePicker
        label="Error"
        value="09:30"
        state="Error"
        message="Invalid time"
      />
      <MdrTimePicker
        label="Warning"
        value="09:30"
        state="Warning"
        message="Outside range"
      />
      <MdrTimePicker
        label="Success"
        value="09:30"
        state="Success"
        message="Available"
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '280px',
      }}
    >
      <MdrTimePicker label="Small" size="Small" value="09:30" />
      <MdrTimePicker label="Medium" size="Medium" value="09:30" />
      <MdrTimePicker label="Large" size="Large" value="09:30" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    value: '09:30',
    disabled: true,
  },
};
