import type { Meta, StoryObj } from '@storybook/react';
import MdrButton from './MdrButton';

const meta: Meta<typeof MdrButton> = {
    title: 'Components/Button',
    component: MdrButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['Big', 'Medium', 'Small', 'Tiny'],
            description: '按钮尺寸',
        },
        category: {
            control: 'select',
            options: ['Primary', 'Secondary', 'Danger', 'SubDanger', 'Warning', 'SubWarning', 'Ghost'],
            description: '按钮类型',
        },
        disabled: {
            control: 'boolean',
            description: '是否禁用',
        },
        iconPosition: {
            control: 'select',
            options: ['Left', 'Right'],
            description: '图标位置',
        },
        onlyIcon: {
            control: 'boolean',
            description: '仅显示图标',
        },
        onClick: { action: 'clicked' },
    },
};

export default meta;
type Story = StoryObj<typeof MdrButton>;

export const Primary: Story = {
    args: {
        text: 'Primary Button',
        category: 'Primary',
        size: 'Medium',
    },
};

export const Secondary: Story = {
    args: {
        text: 'Secondary Button',
        category: 'Secondary',
        size: 'Medium',
    },
};

export const Danger: Story = {
    args: {
        text: 'Danger Button',
        category: 'Danger',
        size: 'Medium',
    },
};

export const Warning: Story = {
    args: {
        text: 'Warning Button',
        category: 'Warning',
        size: 'Medium',
    },
};

export const Ghost: Story = {
    args: {
        text: 'Ghost Button',
        category: 'Ghost',
        size: 'Medium',
    },
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <MdrButton text="Big" size="Big" />
            <MdrButton text="Medium" size="Medium" />
            <MdrButton text="Small" size="Small" />
            <MdrButton text="Tiny" size="Tiny" />
        </div>
    ),
};

export const WithIcon: Story = {
    args: {
        text: 'With Icon',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
            </svg>
        ),
        iconPosition: 'Left',
    },
};

export const IconRight: Story = {
    args: {
        text: 'With Icon',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
            </svg>
        ),
        iconPosition: 'Right',
    },
};

export const OnlyIcon: Story = {
    args: {
        onlyIcon: true,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
            </svg>
        ),
    },
};

export const Disabled: Story = {
    args: {
        text: 'Disabled Button',
        disabled: true,
    },
};

export const AllCategories: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
                <MdrButton text="Primary" category="Primary" />
                <MdrButton text="Secondary" category="Secondary" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <MdrButton text="Danger" category="Danger" />
                <MdrButton text="SubDanger" category="SubDanger" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <MdrButton text="Warning" category="Warning" />
                <MdrButton text="SubWarning" category="SubWarning" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <MdrButton text="Ghost" category="Ghost" />
            </div>
        </div>
    ),
};
