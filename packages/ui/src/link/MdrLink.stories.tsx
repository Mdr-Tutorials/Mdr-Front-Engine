import type { Meta, StoryObj } from '@storybook/react';
import MdrLink from './MdrLink';

const meta: Meta<typeof MdrLink> = {
  title: 'Components/Link',
  component: MdrLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    to: { control: 'text', description: '跳转链接' },
    text: { control: 'text', description: '链接文本' },
    disabled: { control: 'boolean', description: '是否禁用' },
  },
};

export default meta;
type Story = StoryObj<typeof MdrLink>;

export const Default: Story = {
  args: {
    to: '/example',
    text: 'Click me',
  },
};

export const Disabled: Story = {
  args: {
    to: '/example',
    text: 'Disabled Link',
    disabled: true,
  },
};

export const WithChildren: Story = {
  args: {
    to: '/example',
    children: <span style={{ color: '#3b82f6' }}>Custom styled link</span>,
  },
};

export const AllLinks: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <MdrLink to="/link1" text="Active Link" />
      <MdrLink to="/link2" text="Another Link" />
      <MdrLink to="/link3" text="Disabled Link" disabled />
    </div>
  ),
};
