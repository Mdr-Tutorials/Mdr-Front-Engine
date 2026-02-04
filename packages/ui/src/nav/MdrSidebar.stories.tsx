import type { Meta, StoryObj } from '@storybook/react';
import MdrSidebar from './MdrSidebar';

const meta: Meta<typeof MdrSidebar> = {
  title: 'Components/Sidebar',
  component: MdrSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrSidebar>;

export const Default: Story = {
  args: {
    title: 'Workspace',
    items: [
      { label: 'Overview', active: true },
      { label: 'Projects' },
      { label: 'Team' },
    ],
  },
};

export const Collapsed: Story = {
  args: {
    title: 'Menu',
    collapsed: true,
    items: [
      { label: 'Overview', active: true },
      { label: 'Projects' },
      { label: 'Team' },
    ],
  },
};
