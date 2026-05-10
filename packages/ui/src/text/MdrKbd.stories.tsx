import type { Meta, StoryObj } from '@storybook/react';
import { Command, Search } from 'lucide-react';
import MdrKbd from './MdrKbd';

const meta: Meta<typeof MdrKbd> = {
  title: 'Components/Kbd',
  component: MdrKbd,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['Tiny', 'Small', 'Medium', 'Large'],
    },
    texture: {
      control: 'select',
      options: ['Flat', 'Soft', 'Raised', 'Inset'],
    },
    tone: {
      control: 'select',
      options: ['Default', 'Muted', 'Primary', 'Danger', 'Warning', 'Success'],
    },
    iconPosition: {
      control: 'select',
      options: ['Left', 'Right'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof MdrKbd>;

export const Default: Story = {
  args: {
    text: 'Ctrl',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <MdrKbd text="Esc" size="Tiny" />
      <MdrKbd text="Tab" size="Small" />
      <MdrKbd text="Shift" size="Medium" />
      <MdrKbd text="Enter" size="Large" />
    </div>
  ),
};

export const Textures: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <MdrKbd text="Flat" texture="Flat" />
      <MdrKbd text="Soft" texture="Soft" />
      <MdrKbd text="Raised" texture="Raised" />
      <MdrKbd text="Inset" texture="Inset" />
    </div>
  ),
};

export const BorderAndFill: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <MdrKbd text="Default" />
      <MdrKbd text="No border" bordered={false} />
      <MdrKbd text="No fill" filled={false} />
      <MdrKbd text="Bare" bordered={false} filled={false} texture="Flat" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <MdrKbd text="K" showIcon />
      <MdrKbd text="P" icon={<Command size={12} />} tone="Primary" />
      <MdrKbd
        text="Search"
        icon={<Search size={12} />}
        iconPosition="Right"
        texture="Raised"
      />
    </div>
  ),
};

export const ShortcutGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <MdrKbd text="Ctrl" />
      <span style={{ color: 'var(--text-muted)' }}>+</span>
      <MdrKbd text="Shift" />
      <span style={{ color: 'var(--text-muted)' }}>+</span>
      <MdrKbd text="P" tone="Primary" />
    </div>
  ),
};
