import type { Meta, StoryObj } from '@storybook/react';
import MdrRichTextEditor from './MdrRichTextEditor';

const meta: Meta<typeof MdrRichTextEditor> = {
    title: 'Components/RichTextEditor',
    component: MdrRichTextEditor,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrRichTextEditor>;

export const Default: Story = {
    args: {
        label: 'Article',
        description: 'Use the toolbar to format your content.',
    },
};

export const Prefilled: Story = {
    args: {
        label: 'Notes',
        defaultValue: '<p><strong>Rich</strong> text content</p>',
    },
};

export const ReadOnly: Story = {
    args: {
        label: 'Read only',
        defaultValue: '<p>This content is locked.</p>',
        readOnly: true,
        showToolbar: false,
    },
};
