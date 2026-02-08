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
        <div className="InspectorSection flex flex-col gap-2">
            <div className="InspectorField flex flex-col gap-1.5">
                <InspectorRow
                    label={t('inspector.panels.layout.fields.gap', {
                        defaultValue: 'Gap',
                    })}
                    control={
                        <UnitInput
                            value={readNumber(gapValue) ?? readString(gapValue)}
                            quantity="length-percentage"
                            onChange={(next) => {
                                updateNode((current) => {
                                    if (next === undefined) {
                                        const { gap, ...rest } = isPlainObject(
                                            current.props
                                        )
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
                    <div className="InspectorField flex flex-col gap-1.5">
                        <InspectorRow
                            layout="vertical"
                            label={t(
                                'inspector.panels.layout.fields.flexDirection',
                                {
                                    defaultValue: 'Direction',
                                }
                            )}
                            control={
                                <IconButtonGroup
                                    value={flexDirection}
                                    layout="grid-2x2"
                                    options={[
                                        {
                                            value: 'Row',
                                            icon: <FlexRowIcon />,
                                            label: t(
                                                'inspector.panels.layout.options.direction.row',
                                                {
                                                    defaultValue: 'Row',
                                                }
                                            ),
                                        },
                                        {
                                            value: 'RowReverse',
                                            icon: <FlexRowReverseIcon />,
                                            label: t(
                                                'inspector.panels.layout.options.direction.rowReverse',
                                                {
                                                    defaultValue: 'Row Reverse',
                                                }
                                            ),
                                        },
                                        {
                                            value: 'Column',
                                            icon: <FlexColumnIcon />,
                                            label: t(
                                                'inspector.panels.layout.options.direction.column',
                                                {
                                                    defaultValue: 'Column',
                                                }
                                            ),
                                        },
                                        {
                                            value: 'ColumnReverse',
                                            icon: <FlexColumnReverseIcon />,
                                            label: t(
                                                'inspector.panels.layout.options.direction.columnReverse',
                                                {
                                                    defaultValue:
                                                        'Column Reverse',
                                                }
                                            ),
                                        },
                                    ]}
                                    onChange={(value) =>
                                        updateNode((current) =>
                                            withProps(current, {
                                                flexDirection: value,
                                            })
                                        )
                                    }
                                />
                            }
                        />
                    </div>

                    <div className="InspectorField flex flex-col gap-1.5">
                        <InspectorRow
                            layout="vertical"
                            label={t(
                                'inspector.panels.layout.fields.justifyContent',
                                {
                                    defaultValue: 'Justify',
                                }
                            )}
                            control={
                                <IconButtonGroup
                                    value={justifyContent}
                                    layout={
                                        flexDirection === 'Row' ||
                                        flexDirection === 'RowReverse'
                                            ? 'horizontal'
                                            : 'grid'
                                    }
                                    options={
                                        flexDirection === 'Row' ||
                                        flexDirection === 'RowReverse'
                                            ? [
                                                  {
                                                      value: 'Start',
                                                      icon: (
                                                          <JustifyStartIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.start',
                                                          {
                                                              defaultValue:
                                                                  'Start',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Center',
                                                      icon: (
                                                          <JustifyCenterIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.center',
                                                          {
                                                              defaultValue:
                                                                  'Center',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'End',
                                                      icon: <JustifyEndIcon />,
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.end',
                                                          {
                                                              defaultValue:
                                                                  'End',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'SpaceBetween',
                                                      icon: (
                                                          <JustifySpaceBetweenIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.spaceBetween',
                                                          {
                                                              defaultValue:
                                                                  'Space Between',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'SpaceAround',
                                                      icon: (
                                                          <JustifySpaceAroundIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.spaceAround',
                                                          {
                                                              defaultValue:
                                                                  'Space Around',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'SpaceEvenly',
                                                      icon: (
                                                          <JustifySpaceEvenlyIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.spaceEvenly',
                                                          {
                                                              defaultValue:
                                                                  'Space Evenly',
                                                          }
                                                      ),
                                                  },
                                              ]
                                            : [
                                                  {
                                                      value: 'Start',
                                                      icon: (
                                                          <JustifyStartColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.start',
                                                          {
                                                              defaultValue:
                                                                  'Start',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Center',
                                                      icon: (
                                                          <JustifyCenterColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.center',
                                                          {
                                                              defaultValue:
                                                                  'Center',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'End',
                                                      icon: (
                                                          <JustifyEndColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.end',
                                                          {
                                                              defaultValue:
                                                                  'End',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'SpaceBetween',
                                                      icon: (
                                                          <JustifySpaceBetweenColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.spaceBetween',
                                                          {
                                                              defaultValue:
                                                                  'Space Between',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'SpaceAround',
                                                      icon: (
                                                          <JustifySpaceAroundColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.spaceAround',
                                                          {
                                                              defaultValue:
                                                                  'Space Around',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'SpaceEvenly',
                                                      icon: (
                                                          <JustifySpaceEvenlyColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.justify.spaceEvenly',
                                                          {
                                                              defaultValue:
                                                                  'Space Evenly',
                                                          }
                                                      ),
                                                  },
                                              ]
                                    }
                                    onChange={(value) =>
                                        updateNode((current) =>
                                            withProps(current, {
                                                justifyContent: value,
                                            })
                                        )
                                    }
                                />
                            }
                        />
                    </div>

                    <div className="InspectorField flex flex-col gap-1.5">
                        <InspectorRow
                            layout="vertical"
                            label={t(
                                'inspector.panels.layout.fields.alignItems',
                                {
                                    defaultValue: 'Align',
                                }
                            )}
                            control={
                                <IconButtonGroup
                                    value={alignItems}
                                    layout={
                                        flexDirection === 'Row' ||
                                        flexDirection === 'RowReverse'
                                            ? 'horizontal'
                                            : 'grid'
                                    }
                                    options={
                                        flexDirection === 'Row' ||
                                        flexDirection === 'RowReverse'
                                            ? [
                                                  {
                                                      value: 'Start',
                                                      icon: <AlignStartIcon />,
                                                      label: t(
                                                          'inspector.panels.layout.options.align.start',
                                                          {
                                                              defaultValue:
                                                                  'Start',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Center',
                                                      icon: <AlignCenterIcon />,
                                                      label: t(
                                                          'inspector.panels.layout.options.align.center',
                                                          {
                                                              defaultValue:
                                                                  'Center',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'End',
                                                      icon: <AlignEndIcon />,
                                                      label: t(
                                                          'inspector.panels.layout.options.align.end',
                                                          {
                                                              defaultValue:
                                                                  'End',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Stretch',
                                                      icon: (
                                                          <AlignStretchIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.align.stretch',
                                                          {
                                                              defaultValue:
                                                                  'Stretch',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Baseline',
                                                      icon: (
                                                          <AlignBaselineIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.align.baseline',
                                                          {
                                                              defaultValue:
                                                                  'Baseline',
                                                          }
                                                      ),
                                                  },
                                              ]
                                            : [
                                                  {
                                                      value: 'Start',
                                                      icon: (
                                                          <AlignStartColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.align.start',
                                                          {
                                                              defaultValue:
                                                                  'Start',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Center',
                                                      icon: (
                                                          <AlignCenterColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.align.center',
                                                          {
                                                              defaultValue:
                                                                  'Center',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'End',
                                                      icon: (
                                                          <AlignEndColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.align.end',
                                                          {
                                                              defaultValue:
                                                                  'End',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Stretch',
                                                      icon: (
                                                          <AlignStretchColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.align.stretch',
                                                          {
                                                              defaultValue:
                                                                  'Stretch',
                                                          }
                                                      ),
                                                  },
                                                  {
                                                      value: 'Baseline',
                                                      icon: (
                                                          <AlignBaselineColumnIcon />
                                                      ),
                                                      label: t(
                                                          'inspector.panels.layout.options.align.baseline',
                                                          {
                                                              defaultValue:
                                                                  'Baseline',
                                                          }
                                                      ),
                                                  },
                                              ]
                                    }
                                    onChange={(value) =>
                                        updateNode((current) =>
                                            withProps(current, {
                                                alignItems: value,
                                            })
                                        )
                                    }
                                />
                            }
                        />
                    </div>
                </>
            )}

            {display === 'Grid' && (
                <div className="InspectorField flex flex-col gap-1.5">
                    <InspectorRow
                        label={t('inspector.panels.layout.fields.gridColumns', {
                            defaultValue: 'Columns',
                        })}
                        description={t(
                            'inspector.panels.layout.fields.gridColumnsHint',
                            {
                                defaultValue: 'Sets gridTemplateColumns.',
                            }
                        )}
                        control={
                            <MdrInput
                                size="Small"
                                value={gridColumnsDraft}
                                onChange={(value) => {
                                    updateNode((current) => {
                                        const next = Number(value);
                                        if (
                                            !Number.isFinite(next) ||
                                            next <= 0
                                        ) {
                                            const {
                                                gridTemplateColumns,
                                                ...rest
                                            } = isPlainObject(current.style)
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
