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
          <div className="InspectorLabel">{label}</div>
          {description ? (
            <div className="InspectorDescription">{description}</div>
          ) : null}
        </div>
        <div className="w-full">{control}</div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2.5">
      <div className="min-w-30 pt-0.5">
        <div className="InspectorLabel">{label}</div>
        {description ? (
          <div className="InspectorDescription">{description}</div>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-end">{control}</div>
      </div>
    </div>
  );
}
