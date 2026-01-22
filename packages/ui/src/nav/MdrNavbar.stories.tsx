import type { Meta, StoryObj } from '@storybook/react';
import MdrNavbar from './MdrNavbar';
import MdrButton from '../button/MdrButton';

const meta: Meta<typeof MdrNavbar> = {
    title: 'Components/Navbar',
    component: MdrNavbar,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrNavbar>;

export const Default: Story = {
    args: {
        brand: 'Mdr UI',
        items: [
            { label: 'Home', href: '#', active: true },
            { label: 'Docs', href: '#' },
            { label: 'Pricing', href: '#' },
        ],
        actions: <MdrButton text="Sign in" size="Small" category="Secondary" />,
    },
};

export const Transparent: Story = {
    args: {
        brand: 'Mdr UI',
        items: [
            { label: 'Work', href: '#', active: true },
            { label: 'About', href: '#' },
        ],
        variant: 'Transparent',
    },
};
