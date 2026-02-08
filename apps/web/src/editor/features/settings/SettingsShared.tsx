import type React from 'react';
import { MdrPanel, MdrParagraph, MdrText } from '@mdr/ui';

type SettingsRowProps = {
    label: string;
    description?: string;
    control: React.ReactNode;
    meta?: React.ReactNode;
};

export const SettingsRow = ({
    label,
    description,
    control,
    meta,
}: SettingsRowProps) => {
    const className = meta
        ? 'grid grid-cols-[minmax(200px,1.2fr)_minmax(220px,1fr)_minmax(200px,0.8fr)] items-start gap-[12px] max-[1100px]:grid-cols-1'
        : 'grid grid-cols-[minmax(240px,1.2fr)_minmax(260px,1fr)] items-start gap-[12px] max-[1100px]:grid-cols-1';
    return (
        <div className={className}>
            <div className="grid gap-1">
                <MdrText
                    size="Small"
                    weight="SemiBold"
                    className="text-(--color-9)"
                >
                    {label}
                </MdrText>
                {description && (
                    <MdrParagraph
                        size="Small"
                        color="Muted"
                        className="m-0 leading-[1.4]"
                    >
                        {description}
                    </MdrParagraph>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2 [&_.MdrInput]:max-w-[320px] [&_.MdrTextarea]:max-w-[320px] [&_.MdrSelect]:max-w-[320px]">
                {control}
            </div>
            {meta && (
                <div className="ml-6 flex flex-col items-start gap-1.5 text-[11px] text-(--color-6) max-[1100px]:ml-0">
                    {meta}
                </div>
            )}
        </div>
    );
};

type SettingsPanelProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
};

export const SettingsPanel = ({
    title,
    description,
    children,
}: SettingsPanelProps) => (
    <MdrPanel
        title={title}
        variant="Bordered"
        padding="Large"
        className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-(--color-0) shadow-[0_14px_32px_rgba(0,0,0,0.08)] in-data-[theme='dark']:border-[rgba(255,255,255,0.08)] in-data-[theme='dark']:shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
    >
        {description && (
            <p className="mb-3 -translate-x-2 -translate-y-4 text-[12px] text-(--color-6)">
                {description}
            </p>
        )}
        <div className="grid gap-3.5">{children}</div>
    </MdrPanel>
);

export const formatValue = (value: unknown) => {
    if (Array.isArray(value)) return value.join(', ');
    if (value === undefined || value === null || value === '') return '--';
    return String(value);
};

export const withDisabled = (
    items: { label: string; value: string; disabled?: boolean }[],
    disabled: boolean
) => items.map((item) => ({ ...item, disabled: disabled || item.disabled }));
