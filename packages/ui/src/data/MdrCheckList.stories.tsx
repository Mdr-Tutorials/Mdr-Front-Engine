import type { Meta, StoryObj } from '@storybook/react';
import MdrCheckList from './MdrCheckList';

const meta: Meta<typeof MdrCheckList> = {
  title: 'Components/CheckList',
  component: MdrCheckList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrCheckList>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Email notifications', value: 'email' },
      { label: 'Push notifications', value: 'push' },
      { label: 'SMS alerts', value: 'sms', disabled: true },
    ],
  },
};

export const Preselected: Story = {
  args: {
    items: [
      { label: 'Marketing updates', value: 'marketing' },
      { label: 'Product tips', value: 'tips' },
    ],
    defaultValue: ['marketing'],
  },
};
