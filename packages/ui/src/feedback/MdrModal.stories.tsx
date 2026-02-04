import type { Meta, StoryObj } from '@storybook/react';
import MdrModal from './MdrModal';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrModal> = {
  title: 'Components/Modal',
  component: MdrModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrModal>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Confirm action',
    children: 'Are you sure you want to continue?',
    footer: (
      <>
        <MdrButton text="Cancel" size="Small" category="Secondary" />
        <MdrButton text="Confirm" size="Small" category="Primary" />
      </>
    ),
  },
};
