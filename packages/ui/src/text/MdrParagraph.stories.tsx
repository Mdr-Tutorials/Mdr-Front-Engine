import type { Meta, StoryObj } from '@storybook/react';
import MdrParagraph from './MdrParagraph';

const meta: Meta<typeof MdrParagraph> = {
    title: 'Components/Paragraph',
    component: MdrParagraph,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['Small', 'Medium', 'Large'],
            description: '段落尺寸',
        },
        weight: {
            control: 'select',
            options: ['Light', 'Normal', 'Medium', 'SemiBold'],
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
        as: {
            control: 'select',
            options: ['p', 'div', 'span'],
            description: '渲染的 HTML 元素',
        },
    },
};

export default meta;
type Story = StoryObj<typeof MdrParagraph>;

export const Default: Story = {
    args: {
        children:
            'This is a default paragraph with medium size and normal weight.',
        size: 'Medium',
    },
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MdrParagraph size="Small">
                Small paragraph text (14px) - This is a small paragraph with
                compact text size.
            </MdrParagraph>
            <MdrParagraph size="Medium">
                Medium paragraph text (16px) - This is a medium paragraph with
                standard text size.
            </MdrParagraph>
            <MdrParagraph size="Large">
                Large paragraph text (18px) - This is a large paragraph with
                bigger text size.
            </MdrParagraph>
        </div>
    ),
};

export const Weights: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MdrParagraph weight="Light">
                Light weight paragraph - This paragraph has a light font weight
                for a subtle appearance.
            </MdrParagraph>
            <MdrParagraph weight="Normal">
                Normal weight paragraph - This paragraph has a normal font
                weight for standard readability.
            </MdrParagraph>
            <MdrParagraph weight="Medium">
                Medium weight paragraph - This paragraph has a medium font
                weight for slightly more emphasis.
            </MdrParagraph>
            <MdrParagraph weight="SemiBold">
                SemiBold weight paragraph - This paragraph has a semi-bold font
                weight for stronger emphasis.
            </MdrParagraph>
        </div>
    ),
};

export const Colors: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MdrParagraph color="Default">
                Default color paragraph - This is the default text color for
                paragraphs.
            </MdrParagraph>
            <MdrParagraph color="Muted">
                Muted color paragraph - This paragraph has a muted color for
                less emphasis.
            </MdrParagraph>
            <MdrParagraph color="Primary">
                Primary color paragraph - This paragraph uses the primary color
                for emphasis.
            </MdrParagraph>
            <MdrParagraph color="Secondary">
                Secondary color paragraph - This paragraph uses the secondary
                color.
            </MdrParagraph>
            <MdrParagraph color="Danger">
                Danger color paragraph - This paragraph uses the danger color
                for warnings.
            </MdrParagraph>
            <MdrParagraph color="Warning">
                Warning color paragraph - This paragraph uses the warning color
                for alerts.
            </MdrParagraph>
            <MdrParagraph color="Success">
                Success color paragraph - This paragraph uses the success color
                for positive messages.
            </MdrParagraph>
        </div>
    ),
};

export const Alignments: Story = {
    render: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '400px',
            }}
        >
            <MdrParagraph align="Left">
                Left aligned paragraph - This paragraph is aligned to the left
                side of the container.
            </MdrParagraph>
            <MdrParagraph align="Center">
                Center aligned paragraph - This paragraph is centered in the
                container.
            </MdrParagraph>
            <MdrParagraph align="Right">
                Right aligned paragraph - This paragraph is aligned to the right
                side of the container.
            </MdrParagraph>
        </div>
    ),
};

export const LongText: Story = {
    args: {
        children:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        size: 'Medium',
    },
};

export const Combined: Story = {
    args: {
        children:
            'This is a large, semi-bold, primary colored paragraph with center alignment.',
        size: 'Large',
        weight: 'SemiBold',
        color: 'Primary',
        align: 'Center',
    },
};
