import type { Meta, StoryObj } from '@storybook/react';
import MdrStatistic from './MdrStatistic';

const meta: Meta<typeof MdrStatistic> = {
    title: 'Components/Statistic',
    component: MdrStatistic,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MdrStatistic>;

export const Default: Story = {
    args: {
        title: 'Monthly revenue',
        value: 28450,
        prefix: '$',
        trend: 'Up',
    },
};

export const Down: Story = {
    args: {
        title: 'Bounce rate',
        value: 42.8,
        suffix: '%',
        trend: 'Down',
        precision: 1,
    },
};
