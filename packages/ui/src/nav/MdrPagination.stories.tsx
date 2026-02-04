import type { Meta, StoryObj } from '@storybook/react';
import MdrPagination from './MdrPagination';

const meta: Meta<typeof MdrPagination> = {
  title: 'Components/Pagination',
  component: MdrPagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrPagination>;

export const Default: Story = {
  args: {
    page: 2,
    total: 120,
    pageSize: 10,
  },
};

export const FewPages: Story = {
  args: {
    page: 1,
    total: 30,
    pageSize: 10,
  },
};
