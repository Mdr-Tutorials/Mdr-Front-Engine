import type { Meta, StoryObj } from '@storybook/react';
import MdrText from './MdrText';

const meta: Meta<typeof MdrText> = {
  title: 'Components/Text',
  component: MdrText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['Tiny', 'Small', 'Medium', 'Large', 'Big'],
      description: '文本尺寸',
    },
    weight: {
      control: 'select',
      options: ['Light', 'Normal', 'Medium', 'SemiBold', 'Bold'],
      description: '字体粗细',
    },
    color: {
      control: 'select',
      options: [
        'Default',
        'Muted',
        'Primary',
        'Secondary',
        'Danger',
        'Warning',
        'Success',
      ],
      description: '文本颜色',
    },
    align: {
      control: 'select',
      options: ['Left', 'Center', 'Right'],
      description: '对齐方式',
    },
    truncate: {
      control: 'boolean',
      description: '是否截断文本',
    },
    as: {
      control: 'select',
      options: ['span', 'p', 'div', 'label'],
      description: '渲染的 HTML 元素',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MdrText>;

export const Default: Story = {
  args: {
    children: 'This is a default text',
    size: 'Medium',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <MdrText size="Tiny">Tiny Text (12px)</MdrText>
      <MdrText size="Small">Small Text (14px)</MdrText>
      <MdrText size="Medium">Medium Text (16px)</MdrText>
      <MdrText size="Large">Large Text (18px)</MdrText>
      <MdrText size="Big">Big Text (20px)</MdrText>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <MdrText weight="Light">Light weight text</MdrText>
      <MdrText weight="Normal">Normal weight text</MdrText>
      <MdrText weight="Medium">Medium weight text</MdrText>
      <MdrText weight="SemiBold">SemiBold weight text</MdrText>
      <MdrText weight="Bold">Bold weight text</MdrText>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <MdrText color="Default">Default color text</MdrText>
      <MdrText color="Muted">Muted color text</MdrText>
      <MdrText color="Primary">Primary color text</MdrText>
      <MdrText color="Secondary">Secondary color text</MdrText>
      <MdrText color="Danger">Danger color text</MdrText>
      <MdrText color="Warning">Warning color text</MdrText>
      <MdrText color="Success">Success color text</MdrText>
    </div>
  ),
};

export const Alignments: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '400px',
      }}
    >
      <MdrText align="Left">Left aligned text</MdrText>
      <MdrText align="Center">Center aligned text</MdrText>
      <MdrText align="Right">Right aligned text</MdrText>
    </div>
  ),
};

export const Truncated: Story = {
  render: () => (
    <div style={{ width: '200px' }}>
      <MdrText truncate>
        This is a very long text that should be truncated with an ellipsis when
        it exceeds the container width.
      </MdrText>
    </div>
  ),
};

export const AsElement: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <MdrText as="span">Rendered as span</MdrText>
      <MdrText as="p">Rendered as paragraph</MdrText>
      <MdrText as="div">Rendered as div</MdrText>
      <MdrText as="label">Rendered as label</MdrText>
    </div>
  ),
};

export const Combined: Story = {
  args: {
    children: 'This is a bold, large, primary colored text',
    size: 'Large',
    weight: 'Bold',
    color: 'Primary',
  },
};
