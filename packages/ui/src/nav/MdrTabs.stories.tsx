import type { Meta, StoryObj } from '@storybook/react';
import MdrTabs from './MdrTabs';

const meta: Meta<typeof MdrTabs> = {
  title: 'Components/Tabs',
  component: MdrTabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrTabs>;

export const Default: Story = {
  args: {
    items: [
      { key: 'overview', label: 'Overview', content: 'Overview content' },
      { key: 'details', label: 'Details', content: 'Details content' },
      {
        key: 'settings',
        label: 'Settings',
        content: 'Settings content',
        disabled: true,
      },
    ],
  },
};
