import type { Meta, StoryObj } from '@storybook/react';
import MdrVerificationCode from './MdrVerificationCode';

const meta: Meta<typeof MdrVerificationCode> = {
  title: 'Components/VerificationCode',
  component: MdrVerificationCode,
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

type Story = StoryObj<typeof MdrVerificationCode>;

export const Default: Story = {
  args: {
    label: 'Verification code',
    length: 6,
  },
};

export const WithSeparator: Story = {
  args: {
    label: 'Code',
    length: 4,
    separator: '-',
  },
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MdrVerificationCode label="Default" length={6} />
      <MdrVerificationCode
        label="Error"
        length={6}
        state="Error"
        message="Invalid code"
      />
      <MdrVerificationCode
        label="Warning"
        length={6}
        state="Warning"
        message="Expiring soon"
      />
      <MdrVerificationCode
        label="Success"
        length={6}
        state="Success"
        message="Verified"
      />
    </div>
  ),
};
