import type { Meta, StoryObj } from '@storybook/react';
import MdrDiv from './MdrDiv';

const meta: Meta<typeof MdrDiv> = {
  title: 'Components/Div',
  component: MdrDiv,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    display: {
      control: 'select',
      options: ['Block', 'Inline', 'InlineBlock', 'Flex', 'Grid'],
      description: '显示类型',
    },
    flexDirection: {
      control: 'select',
      options: ['Row', 'Column', 'RowReverse', 'ColumnReverse'],
      description: 'Flex 方向',
    },
    justifyContent: {
      control: 'select',
      options: [
        'Start',
        'Center',
        'End',
        'SpaceBetween',
        'SpaceAround',
        'SpaceEvenly',
      ],
      description: 'Flex 主轴对齐',
    },
    alignItems: {
      control: 'select',
      options: ['Start', 'Center', 'End', 'Stretch', 'Baseline'],
      description: 'Flex 交叉轴对齐',
    },
    overflow: {
      control: 'select',
      options: ['Visible', 'Hidden', 'Auto', 'Scroll'],
      description: '溢出处理',
    },
    textAlign: {
      control: 'select',
      options: ['Left', 'Center', 'Right', 'Justify'],
      description: '文本对齐',
    },
    gap: {
      control: 'text',
      description: '间距',
    },
    padding: {
      control: 'text',
      description: '内边距',
    },
    margin: {
      control: 'text',
      description: '外边距',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MdrDiv>;

export const Default: Story = {
  args: {
    children: 'Default div block',
    display: 'Block',
  },
};

export const FlexContainer: Story = {
  render: () => (
    <MdrDiv
      display="Flex"
      gap="12px"
      padding="16px"
      backgroundColor="#f5f5f5"
      borderRadius="8px"
    >
      <MdrDiv padding="12px" backgroundColor="#e0e0e0" borderRadius="4px">
        Item 1
      </MdrDiv>
      <MdrDiv padding="12px" backgroundColor="#e0e0e0" borderRadius="4px">
        Item 2
      </MdrDiv>
      <MdrDiv padding="12px" backgroundColor="#e0e0e0" borderRadius="4px">
        Item 3
      </MdrDiv>
    </MdrDiv>
  ),
};

export const FlexColumn: Story = {
  render: () => (
    <MdrDiv
      display="Flex"
      flexDirection="Column"
      gap="12px"
      padding="16px"
      backgroundColor="#f5f5f5"
      borderRadius="8px"
      width="200px"
    >
      <MdrDiv padding="12px" backgroundColor="#e0e0e0" borderRadius="4px">
        Item 1
      </MdrDiv>
      <MdrDiv padding="12px" backgroundColor="#e0e0e0" borderRadius="4px">
        Item 2
      </MdrDiv>
      <MdrDiv padding="12px" backgroundColor="#e0e0e0" borderRadius="4px">
        Item 3
      </MdrDiv>
    </MdrDiv>
  ),
};

export const JustifyContent: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MdrDiv
        display="Flex"
        justifyContent="Start"
        gap="8px"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        <MdrDiv padding="8px" backgroundColor="#e0e0e0" borderRadius="4px">
          Start
        </MdrDiv>
      </MdrDiv>
      <MdrDiv
        display="Flex"
        justifyContent="Center"
        gap="8px"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        <MdrDiv padding="8px" backgroundColor="#e0e0e0" borderRadius="4px">
          Center
        </MdrDiv>
      </MdrDiv>
      <MdrDiv
        display="Flex"
        justifyContent="End"
        gap="8px"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        <MdrDiv padding="8px" backgroundColor="#e0e0e0" borderRadius="4px">
          End
        </MdrDiv>
      </MdrDiv>
      <MdrDiv
        display="Flex"
        justifyContent="SpaceBetween"
        gap="8px"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        <MdrDiv padding="8px" backgroundColor="#e0e0e0" borderRadius="4px">
          SpaceBetween
        </MdrDiv>
      </MdrDiv>
    </div>
  ),
};

export const AlignItems: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MdrDiv
        display="Flex"
        alignItems="Start"
        gap="8px"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
        height="80px"
      >
        <MdrDiv padding="8px" backgroundColor="#e0e0e0" borderRadius="4px">
          Start
        </MdrDiv>
        <MdrDiv padding="16px" backgroundColor="#e0e0e0" borderRadius="4px">
          Tall
        </MdrDiv>
      </MdrDiv>
      <MdrDiv
        display="Flex"
        alignItems="Center"
        gap="8px"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
        height="80px"
      >
        <MdrDiv padding="8px" backgroundColor="#e0e0e0" borderRadius="4px">
          Center
        </MdrDiv>
        <MdrDiv padding="16px" backgroundColor="#e0e0e0" borderRadius="4px">
          Tall
        </MdrDiv>
      </MdrDiv>
      <MdrDiv
        display="Flex"
        alignItems="End"
        gap="8px"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
        height="80px"
      >
        <MdrDiv padding="8px" backgroundColor="#e0e0e0" borderRadius="4px">
          End
        </MdrDiv>
        <MdrDiv padding="16px" backgroundColor="#e0e0e0" borderRadius="4px">
          Tall
        </MdrDiv>
      </MdrDiv>
    </div>
  ),
};

export const Overflow: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MdrDiv
        width="200px"
        overflow="Visible"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        <MdrDiv
          width="300px"
          padding="8px"
          backgroundColor="#e0e0e0"
          borderRadius="4px"
        >
          Visible overflow
        </MdrDiv>
      </MdrDiv>
      <MdrDiv
        width="200px"
        overflow="Hidden"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        <MdrDiv
          width="300px"
          padding="8px"
          backgroundColor="#e0e0e0"
          borderRadius="4px"
        >
          Hidden overflow
        </MdrDiv>
      </MdrDiv>
      <MdrDiv
        width="200px"
        overflow="Auto"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        <MdrDiv
          width="300px"
          padding="8px"
          backgroundColor="#e0e0e0"
          borderRadius="4px"
        >
          Auto overflow
        </MdrDiv>
      </MdrDiv>
    </div>
  ),
};

export const TextAlignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MdrDiv
        textAlign="Left"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        Left aligned text
      </MdrDiv>
      <MdrDiv
        textAlign="Center"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        Center aligned text
      </MdrDiv>
      <MdrDiv
        textAlign="Right"
        padding="12px"
        backgroundColor="#f5f5f5"
        borderRadius="4px"
      >
        Right aligned text
      </MdrDiv>
    </div>
  ),
};

export const CustomStyle: Story = {
  args: {
    children: 'Custom styled div',
    display: 'Block',
    padding: '24px',
    margin: '16px',
    backgroundColor: '#4a90e2',
    borderRadius: '8px',
    textAlign: 'Center',
  },
};
