import type { LayoutGroupDefinition, LayoutGroupRenderProps } from '../types';
import {
  getLayoutValue,
  updateLayoutValue,
  readCssValue,
} from '../layoutPanelHelpers';
import { InspectorRow } from '@/editor/features/design/inspector/components/InspectorRow';
import { UnitInput } from '@/editor/features/design/inspector/components/UnitInput';

const AppearanceGroupContent = ({
  node,
  updateNode,
  t,
}: LayoutGroupRenderProps) => {
  const backgroundColorValue = getLayoutValue(node, 'backgroundColor');
  const borderValue = getLayoutValue(node, 'border');
  const borderRadiusValue = getLayoutValue(node, 'borderRadius');
  const hasBorder = borderValue.trim().length > 0;

  return (
    <>
      <InspectorRow
        label={t('inspector.panels.layout.fields.backgroundColor', {
          defaultValue: 'Background',
        })}
        control={
          <input
            className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
            value={backgroundColorValue}
            placeholder={t(
              'inspector.panels.layout.placeholders.backgroundColor',
              {
                defaultValue: 'var(--color-2)',
              }
            )}
            onChange={(event) =>
              updateNode((current) =>
                updateLayoutValue(
                  current,
                  'backgroundColor',
                  event.target.value ?? ''
                )
              )
            }
          />
        }
      />
      <InspectorRow
        label={t('inspector.panels.layout.fields.border', {
          defaultValue: 'Border',
        })}
        control={
          <input
            className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
            value={borderValue}
            placeholder="1px solid var(--color-3)"
            onChange={(event) =>
              updateNode((current) =>
                updateLayoutValue(current, 'border', event.target.value ?? '')
              )
            }
          />
        }
      />
      {hasBorder ? (
        <InspectorRow
          label={t('inspector.panels.layout.fields.borderRadius', {
            defaultValue: 'Radius',
          })}
          control={
            <UnitInput
              value={borderRadiusValue || undefined}
              quantity="length-percentage"
              placeholder="0"
              onChange={(value) =>
                updateNode((current) =>
                  updateLayoutValue(
                    current,
                    'borderRadius',
                    readCssValue(value) ?? ''
                  )
                )
              }
            />
          }
        />
      ) : null}
    </>
  );
};

export const appearanceGroup: LayoutGroupDefinition = {
  key: 'appearance',
  title: 'Appearance',
  order: 30,
  render: AppearanceGroupContent,
};
