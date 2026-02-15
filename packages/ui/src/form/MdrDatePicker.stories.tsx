import type { Meta, StoryObj } from '@storybook/react';
import MdrDatePicker from './MdrDatePicker';

const meta: Meta<typeof MdrDatePicker> = {
  title: 'Components/DatePicker',
  component: MdrDatePicker,
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

type Story = StoryObj<typeof MdrDatePicker>;

export const Default: Story = {
  args: {
    label: 'Date',
    value: '2026-01-22',
  },
};

export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '320px',
      }}
    >
      <MdrDatePicker label="Default" value="2026-01-22" />
      <MdrDatePicker
        label="Error"
        value="2026-01-22"
        state="Error"
        message="Invalid date"
      />
      <MdrDatePicker
        label="Warning"
        value="2026-01-22"
        state="Warning"
        message="Check availability"
      />
      <MdrDatePicker
        label="Success"
        value="2026-01-22"
        state="Success"
        message="Looks good"
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
        width: '320px',
      }}
    >
      <MdrDatePicker label="Small" size="Small" value="2026-01-22" />
      <MdrDatePicker label="Medium" size="Medium" value="2026-01-22" />
      <MdrDatePicker label="Large" size="Large" value="2026-01-22" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    value: '2026-01-22',
    disabled: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Start date',
    description: 'Select a start date for the campaign.',
    value: '2026-01-22',
  },
};
