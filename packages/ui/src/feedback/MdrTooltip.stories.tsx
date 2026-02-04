import type { Meta, StoryObj } from '@storybook/react';
import MdrTooltip from './MdrTooltip';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrTooltip> = {
  title: 'Components/Tooltip',
  component: MdrTooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrTooltip>;

export const Default: Story = {
  render: () => (
    <MdrTooltip content="Helpful tip" placement="Top">
      <MdrButton text="Hover me" size="Small" />
    </MdrTooltip>
  ),
};
