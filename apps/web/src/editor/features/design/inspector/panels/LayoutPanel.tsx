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
import { IconButtonGroup } from '../components/IconButtonGroup';
import {
  FlexRowIcon,
  FlexColumnIcon,
  FlexRowReverseIcon,
  FlexColumnReverseIcon,
} from '../components/FlexDirectionIcons';
import {
  JustifyStartIcon,
  JustifyCenterIcon,
  JustifyEndIcon,
  JustifySpaceBetweenIcon,
  JustifySpaceAroundIcon,
  JustifySpaceEvenlyIcon,
  JustifyStartColumnIcon,
  JustifyCenterColumnIcon,
  JustifyEndColumnIcon,
  JustifySpaceBetweenColumnIcon,
  JustifySpaceAroundColumnIcon,
  JustifySpaceEvenlyColumnIcon,
} from '../components/JustifyContentIcons';
import {
  AlignStartIcon,
  AlignCenterIcon,
  AlignEndIcon,
  AlignStretchIcon,
  AlignBaselineIcon,
  AlignStartColumnIcon,
  AlignCenterColumnIcon,
  AlignEndColumnIcon,
  AlignStretchColumnIcon,
  AlignBaselineColumnIcon,
} from '../components/AlignItemsIcons';

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
              layout="vertical"
              label={t('inspector.panels.layout.fields.flexDirection', {
                defaultValue: 'Direction',
              })}
              control={
                <IconButtonGroup
                  value={flexDirection}
                  layout="grid-2x2"
                  options={[
                    { value: 'Row', icon: <FlexRowIcon />, label: 'Row' },
                    {
                      value: 'RowReverse',
                      icon: <FlexRowReverseIcon />,
                      label: 'Row Reverse',
                    },
                    {
                      value: 'Column',
                      icon: <FlexColumnIcon />,
                      label: 'Column',
                    },
                    {
                      value: 'ColumnReverse',
                      icon: <FlexColumnReverseIcon />,
                      label: 'Column Reverse',
                    },
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
              layout="vertical"
              label={t('inspector.panels.layout.fields.justifyContent', {
                defaultValue: 'Justify',
              })}
              control={
                <IconButtonGroup
                  value={justifyContent}
                  layout={
                    flexDirection === 'Row' || flexDirection === 'RowReverse'
                      ? 'horizontal'
                      : 'grid'
                  }
                  options={
                    flexDirection === 'Row' || flexDirection === 'RowReverse'
                      ? [
                          {
                            value: 'Start',
                            icon: <JustifyStartIcon />,
                            label: 'Start',
                          },
                          {
                            value: 'Center',
                            icon: <JustifyCenterIcon />,
                            label: 'Center',
                          },
                          {
                            value: 'End',
                            icon: <JustifyEndIcon />,
                            label: 'End',
                          },
                          {
                            value: 'SpaceBetween',
                            icon: <JustifySpaceBetweenIcon />,
                            label: 'Space Between',
                          },
                          {
                            value: 'SpaceAround',
                            icon: <JustifySpaceAroundIcon />,
                            label: 'Space Around',
                          },
                          {
                            value: 'SpaceEvenly',
                            icon: <JustifySpaceEvenlyIcon />,
                            label: 'Space Evenly',
                          },
                        ]
                      : [
                          {
                            value: 'Start',
                            icon: <JustifyStartColumnIcon />,
                            label: 'Start',
                          },
                          {
                            value: 'Center',
                            icon: <JustifyCenterColumnIcon />,
                            label: 'Center',
                          },
                          {
                            value: 'End',
                            icon: <JustifyEndColumnIcon />,
                            label: 'End',
                          },
                          {
                            value: 'SpaceBetween',
                            icon: <JustifySpaceBetweenColumnIcon />,
                            label: 'Space Between',
                          },
                          {
                            value: 'SpaceAround',
                            icon: <JustifySpaceAroundColumnIcon />,
                            label: 'Space Around',
                          },
                          {
                            value: 'SpaceEvenly',
                            icon: <JustifySpaceEvenlyColumnIcon />,
                            label: 'Space Evenly',
                          },
                        ]
                  }
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
              layout="vertical"
              label={t('inspector.panels.layout.fields.alignItems', {
                defaultValue: 'Align',
              })}
              control={
                <IconButtonGroup
                  value={alignItems}
                  layout={
                    flexDirection === 'Row' || flexDirection === 'RowReverse'
                      ? 'horizontal'
                      : 'grid'
                  }
                  options={
                    flexDirection === 'Row' || flexDirection === 'RowReverse'
                      ? [
                          {
                            value: 'Start',
                            icon: <AlignStartIcon />,
                            label: 'Start',
                          },
                          {
                            value: 'Center',
                            icon: <AlignCenterIcon />,
                            label: 'Center',
                          },
                          {
                            value: 'End',
                            icon: <AlignEndIcon />,
                            label: 'End',
                          },
                          {
                            value: 'Stretch',
                            icon: <AlignStretchIcon />,
                            label: 'Stretch',
                          },
                          {
                            value: 'Baseline',
                            icon: <AlignBaselineIcon />,
                            label: 'Baseline',
                          },
                        ]
                      : [
                          {
                            value: 'Start',
                            icon: <AlignStartColumnIcon />,
                            label: 'Start',
                          },
                          {
                            value: 'Center',
                            icon: <AlignCenterColumnIcon />,
                            label: 'Center',
                          },
                          {
                            value: 'End',
                            icon: <AlignEndColumnIcon />,
                            label: 'End',
                          },
                          {
                            value: 'Stretch',
                            icon: <AlignStretchColumnIcon />,
                            label: 'Stretch',
                          },
                          {
                            value: 'Baseline',
                            icon: <AlignBaselineColumnIcon />,
                            label: 'Baseline',
                          },
                        ]
                  }
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
