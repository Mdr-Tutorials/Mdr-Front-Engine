import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdrInput, MdrSelect } from '@mdr/ui';
import type { ComponentNode } from '@/core/types/engine.types';
import type {
  InspectorPanelDefinition,
  InspectorPanelRenderProps,
} from './types';
import { InspectorRow } from '../components/InspectorRow';
import { UnitInput } from '../components/UnitInput';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getDisplay = (node: ComponentNode) => {
  const display = node.props?.display;
  return typeof display === 'string' ? display : undefined;
};

const readString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;
const readNumber = (value: unknown) =>
  typeof value === 'number' ? value : undefined;

const readGridColumnCount = (value: unknown) => {
  const template = readString(value);
  if (!template) return undefined;
  const match = template.match(/repeat\((\d+),\s*minmax\(0,\s*1fr\)\)/);
  if (!match) return undefined;
  const count = Number(match[1]);
  return Number.isFinite(count) ? count : undefined;
};

const withProps = (
  node: ComponentNode,
  patch: Record<string, unknown>
): ComponentNode => ({
  ...node,
  props: { ...(isPlainObject(node.props) ? node.props : {}), ...patch },
});

const withStyle = (
  node: ComponentNode,
  patch: Record<string, unknown>
): ComponentNode => ({
  ...node,
  style: { ...(isPlainObject(node.style) ? node.style : {}), ...patch },
});

function LayoutPanelView({ node, updateNode }: InspectorPanelRenderProps) {
  const { t } = useTranslation('blueprint');
  const display = getDisplay(node);
  const gapValue = node.props?.gap;

  const flexDirection = readString(node.props?.flexDirection) ?? 'Row';
  const justifyContent = readString(node.props?.justifyContent) ?? 'Start';
  const alignItems = readString(node.props?.alignItems) ?? 'Start';

  const gridTemplateColumns = node.style?.gridTemplateColumns;
  const gridColumnCount = readGridColumnCount(gridTemplateColumns);
  const gridColumnsDraft = gridColumnCount ? String(gridColumnCount) : '';

  return (
    <div className="InspectorSection">
      <div className="InspectorField">
        <div className="InspectorFieldHeader">
          <span className="InspectorLabel">
            {t('inspector.panels.layout.title', { defaultValue: 'Layout' })}
          </span>
          <span className="InspectorDescription">
            {t('inspector.panels.layout.description', {
              defaultValue: 'Configure Flex/Grid layout behavior.',
            })}
          </span>
        </div>
      </div>

      <div className="InspectorField">
        <InspectorRow
          label={t('inspector.panels.layout.fields.display', {
            defaultValue: 'Display',
          })}
          control={
            <MdrSelect
              size="Small"
              value={display ?? ''}
              options={[
                { label: 'Flex', value: 'Flex' },
                { label: 'Grid', value: 'Grid' },
              ]}
              onChange={(value) => {
                updateNode((current) => withProps(current, { display: value }));
              }}
            />
          }
        />
      </div>

      <div className="InspectorField">
        <InspectorRow
          label={t('inspector.panels.layout.fields.gap', {
            defaultValue: 'Gap',
          })}
          description={t('inspector.panels.layout.fields.gapHint', {
            defaultValue: 'Number (px) or CSS size.',
          })}
          control={
            <UnitInput
              value={readNumber(gapValue) ?? readString(gapValue)}
              quantity="length-percentage"
              onChange={(next) => {
                updateNode((current) => {
                  if (next === undefined) {
                    const { gap, ...rest } = isPlainObject(current.props)
                      ? current.props
                      : {};
                    return { ...current, props: rest };
                  }
                  return withProps(current, { gap: next });
                });
              }}
              placeholder="8"
            />
          }
        />
      </div>

      {display === 'Flex' && (
        <>
          <div className="InspectorField">
            <InspectorRow
              label={t('inspector.panels.layout.fields.flexDirection', {
                defaultValue: 'Direction',
              })}
              control={
                <MdrSelect
                  size="Small"
                  value={flexDirection}
                  options={[
                    { label: 'Row', value: 'Row' },
                    { label: 'Column', value: 'Column' },
                    { label: 'RowReverse', value: 'RowReverse' },
                    { label: 'ColumnReverse', value: 'ColumnReverse' },
                  ]}
                  onChange={(value) =>
                    updateNode((current) =>
                      withProps(current, { flexDirection: value })
                    )
                  }
                />
              }
            />
          </div>

          <div className="InspectorField">
            <InspectorRow
              label={t('inspector.panels.layout.fields.justifyContent', {
                defaultValue: 'Justify',
              })}
              control={
                <MdrSelect
                  size="Small"
                  value={justifyContent}
                  options={[
                    { label: 'Start', value: 'Start' },
                    { label: 'Center', value: 'Center' },
                    { label: 'End', value: 'End' },
                    { label: 'SpaceBetween', value: 'SpaceBetween' },
                    { label: 'SpaceAround', value: 'SpaceAround' },
                    { label: 'SpaceEvenly', value: 'SpaceEvenly' },
                  ]}
                  onChange={(value) =>
                    updateNode((current) =>
                      withProps(current, { justifyContent: value })
                    )
                  }
                />
              }
            />
          </div>

          <div className="InspectorField">
            <InspectorRow
              label={t('inspector.panels.layout.fields.alignItems', {
                defaultValue: 'Align',
              })}
              control={
                <MdrSelect
                  size="Small"
                  value={alignItems}
                  options={[
                    { label: 'Start', value: 'Start' },
                    { label: 'Center', value: 'Center' },
                    { label: 'End', value: 'End' },
                    { label: 'Stretch', value: 'Stretch' },
                    { label: 'Baseline', value: 'Baseline' },
                  ]}
                  onChange={(value) =>
                    updateNode((current) =>
                      withProps(current, { alignItems: value })
                    )
                  }
                />
              }
            />
          </div>
        </>
      )}

      {display === 'Grid' && (
        <div className="InspectorField">
          <InspectorRow
            label={t('inspector.panels.layout.fields.gridColumns', {
              defaultValue: 'Columns',
            })}
            description={t('inspector.panels.layout.fields.gridColumnsHint', {
              defaultValue: 'Sets gridTemplateColumns.',
            })}
            control={
              <MdrInput
                size="Small"
                value={gridColumnsDraft}
                onChange={(value) => {
                  updateNode((current) => {
                    const next = Number(value);
                    if (!Number.isFinite(next) || next <= 0) {
                      const { gridTemplateColumns, ...rest } = isPlainObject(
                        current.style
                      )
                        ? current.style
                        : {};
                      return { ...current, style: rest };
                    }
                    return withStyle(current, {
                      gridTemplateColumns: `repeat(${Math.floor(next)}, minmax(0, 1fr))`,
                    });
                  });
                }}
              />
            }
          />
        </div>
      )}
    </div>
  );
}

export const layoutPanel: InspectorPanelDefinition = {
  key: 'layout',
  title: 'Layout',
  description: 'Flex / Grid layout details',
  match: (node) => {
    const display = getDisplay(node);
    return display === 'Flex' || display === 'Grid';
  },
  render: (props) => <LayoutPanelView {...props} />,
};
