import type { Meta, StoryObj } from '@storybook/react';
import MdrRegionPicker, { type MdrRegionOption } from './MdrRegionPicker';

const regionOptions: MdrRegionOption[] = [
    {
        label: 'Zhejiang',
        value: 'zhejiang',
        children: [
            {
                label: 'Hangzhou',
                value: 'hangzhou',
                children: [
                    { label: 'Xihu', value: 'xihu' },
                    { label: 'Yuhang', value: 'yuhang' },
                ],
            },
            {
                label: 'Ningbo',
                value: 'ningbo',
                children: [
                    { label: 'Haishu', value: 'haishu' },
                    { label: 'Beilun', value: 'beilun' },
                ],
            },
        ],
    },
    {
        label: 'Jiangsu',
        value: 'jiangsu',
        children: [
            {
                label: 'Nanjing',
                value: 'nanjing',
                children: [
                    { label: 'Xuanwu', value: 'xuanwu' },
                    { label: 'Qinhuai', value: 'qinhuai' },
                ],
            },
        ],
    },
];

const meta: Meta<typeof MdrRegionPicker> = {
    title: 'Components/RegionPicker',
    component: MdrRegionPicker,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        options: regionOptions,
    },
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

type Story = StoryObj<typeof MdrRegionPicker>;

export const Default: Story = {
    args: {
        label: 'Region',
        description: 'Select province, city and district.',
    },
};

export const WithValue: Story = {
    args: {
        label: 'Region',
        value: { province: 'zhejiang', city: 'hangzhou', district: 'xihu' },
    },
};

export const States: Story = {
    render: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '520px',
            }}
        >
            <MdrRegionPicker label="Default" options={regionOptions} />
            <MdrRegionPicker
                label="Error"
                options={regionOptions}
                state="Error"
                message="Please choose region"
            />
            <MdrRegionPicker
                label="Warning"
                options={regionOptions}
                state="Warning"
                message="Not serviceable"
            />
            <MdrRegionPicker
                label="Success"
                options={regionOptions}
                state="Success"
                message="Available"
            />
        </div>
    ),
};
