import type { Meta, StoryObj } from '@storybook/react';
import MdrDateRangePicker from './MdrDateRangePicker';

const meta: Meta<typeof MdrDateRangePicker> = {
  title: 'Components/DateRangePicker',
  component: MdrDateRangePicker,
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

type Story = StoryObj<typeof MdrDateRangePicker>;

export const Default: Story = {
  args: {
    label: 'Date range',
    startValue: '2026-01-22',
    endValue: '2026-01-28',
  },
};

export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '360px',
      }}
    >
      <MdrDateRangePicker
        label="Default"
        startValue="2026-01-22"
        endValue="2026-01-28"
      />
      <MdrDateRangePicker
        label="Error"
        startValue="2026-01-22"
        endValue="2026-01-28"
        state="Error"
        message="Range not available"
      />
      <MdrDateRangePicker
        label="Warning"
        startValue="2026-01-22"
        endValue="2026-01-28"
        state="Warning"
        message="Limited slots"
      />
      <MdrDateRangePicker
        label="Success"
        startValue="2026-01-22"
        endValue="2026-01-28"
        state="Success"
        message="Confirmed"
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
        width: '360px',
      }}
    >
      <MdrDateRangePicker
        label="Small"
        size="Small"
        startValue="2026-01-22"
        endValue="2026-01-28"
      />
      <MdrDateRangePicker
        label="Medium"
        size="Medium"
        startValue="2026-01-22"
        endValue="2026-01-28"
      />
      <MdrDateRangePicker
        label="Large"
        size="Large"
        startValue="2026-01-22"
        endValue="2026-01-28"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    startValue: '2026-01-22',
    endValue: '2026-01-28',
    disabled: true,
  },
};
