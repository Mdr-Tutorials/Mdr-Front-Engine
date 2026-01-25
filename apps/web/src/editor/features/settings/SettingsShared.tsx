import type React from 'react';
import { MdrPanel, MdrParagraph, MdrText } from '@mdr/ui';

type SettingsRowProps = {
    label: string;
    description?: string;
    control: React.ReactNode;
    meta?: React.ReactNode;
};

export const SettingsRow = ({ label, description, control, meta }: SettingsRowProps) => {
    const className = `SettingsRow ${meta ? 'WithOverride' : ''}`.trim();
    return (
        <div className={className}>
            <div className="SettingsRowInfo">
                <MdrText size="Small" weight="SemiBold" className="SettingsRowLabel">
                    {label}
                </MdrText>
                {description && (
                    <MdrParagraph size="Small" color="Muted" className="SettingsRowDescription">
                        {description}
                    </MdrParagraph>
                )}
            </div>
            <div className="SettingsRowControl">{control}</div>
            {meta && <div className="SettingsRowMeta">{meta}</div>}
        </div>
    );
};

type SettingsPanelProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
};

export const SettingsPanel = ({ title, description, children }: SettingsPanelProps) => (
    <MdrPanel title={title} variant="Bordered" padding="Large" className="SettingsPanel">
        {description && <p className="SettingsPanelDescription">{description}</p>}
        <div className="SettingsPanelBody">{children}</div>
    </MdrPanel>
);

export const formatValue = (value: unknown) => {
    if (Array.isArray(value)) return value.join(', ');
    if (value === undefined || value === null || value === '') return '--';
    return String(value);
};

export const withDisabled = (
    items: { label: string; value: string; disabled?: boolean }[],
    disabled: boolean,
) => items.map((item) => ({ ...item, disabled: disabled || item.disabled }));
