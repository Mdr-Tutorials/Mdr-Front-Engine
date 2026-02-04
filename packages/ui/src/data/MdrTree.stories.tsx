import type { Meta, StoryObj } from '@storybook/react';
import MdrTree, { type MdrTreeNode } from './MdrTree';

const data: MdrTreeNode[] = [
  {
    id: 'root',
    label: 'Workspace',
    children: [
      {
        id: 'design',
        label: 'Design',
        children: [
          { id: 'wireframes', label: 'Wireframes' },
          { id: 'mockups', label: 'Mockups' },
        ],
      },
      {
        id: 'docs',
        label: 'Docs',
        children: [
          { id: 'guides', label: 'Guides' },
          { id: 'specs', label: 'Specs' },
        ],
      },
    ],
  },
];

const meta: Meta<typeof MdrTree> = {
  title: 'Components/Tree',
  component: MdrTree,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrTree>;

export const Default: Story = {
  args: {
    data,
    defaultExpandedKeys: ['root', 'design'],
    selectedKey: 'wireframes',
  },
};
