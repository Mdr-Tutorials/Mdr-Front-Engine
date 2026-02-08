import type React from 'react';

type InspectorRowProps = {
    label: React.ReactNode;
    description?: React.ReactNode;
    control: React.ReactNode;
    layout?: 'horizontal' | 'vertical';
};

export function InspectorRow({
    label,
    description,
    control,
    layout = 'horizontal',
}: InspectorRowProps) {
    if (layout === 'vertical') {
        return (
            <div className="flex flex-col gap-2">
                <div>
                    <div className="InspectorLabel text-[11px] font-semibold text-(--color-8)">
                        {label}
                    </div>
                    {description ? (
                        <div className="InspectorDescription text-[10px] text-(--color-6)">
                            {description}
                        </div>
                    ) : null}
                </div>
                <div className="w-full">{control}</div>
            </div>
        );
    }

    const alignClass = description ? 'items-start' : 'items-center';

    return (
        <div className={`flex ${alignClass} justify-between gap-2.5`}>
            <div className="min-w-30">
                <div className="InspectorLabel text-[11px] font-semibold text-(--color-8)">
                    {label}
                </div>
                {description ? (
                    <div className="InspectorDescription text-[10px] text-(--color-6)">
                        {description}
                    </div>
                ) : null}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex justify-end">{control}</div>
            </div>
        </div>
    );
}
