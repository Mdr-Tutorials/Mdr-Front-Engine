import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { MdrInput, MdrSelect } from '@mdr/ui';
import type { ComponentNode } from '@/core/types/engine.types';
import { SpacingSidePreviewIcon } from '@/components/icons/SpacingSidePreviewIcon';
import {
  getLayoutPatternId,
  isLayoutPatternRootNode,
} from '@/editor/features/design/blueprint/layoutPatterns/dataAttributes';
import type {
  InspectorPanelDefinition,
  InspectorPanelRenderProps,
} from './types';
import { InspectorRow } from '@/editor/features/design/inspector/components/InspectorRow';
import { UnitInput } from '@/editor/features/design/inspector/components/UnitInput';
import { IconButtonGroup } from '@/editor/features/design/inspector/components/IconButtonGroup';
import {
  FlexRowIcon,
  FlexColumnIcon,
  FlexRowReverseIcon,
  FlexColumnReverseIcon,
} from '@/components/icons/FlexDirectionIcons';
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
} from '@/components/icons/JustifyContentIcons';
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
} from '@/components/icons/AlignItemsIcons';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

type SpacingKey = 'margin' | 'padding';
type LayoutValueKey =
  | 'width'
  | 'height'
  | 'backgroundColor'
  | 'border'
  | 'borderRadius';
type BoxSpacing = {
  top: string;
  right: string;
  bottom: string;
  left: string;
};

const LAYOUT_COMPONENT_TYPES = new Set([
  'MdrDiv',
  'MdrSection',
  'MdrCard',
  'MdrPanel',
  'div',
  'section',
]);

const isLayoutComponent = (node: ComponentNode) =>
  LAYOUT_COMPONENT_TYPES.has(node.type);

const getDisplay = (node: ComponentNode) => {
  const display = node.props?.display;
  return typeof display === 'string' ? display : undefined;
};

const readString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;
const readNumber = (value: unknown) =>
  typeof value === 'number' ? value : undefined;
const readCssValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return `${value}px`;
  return undefined;
};

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

const updateStyleValue = (
  node: ComponentNode,
  key: string,
  nextValue: string
): ComponentNode => {
  const nextStyle = isPlainObject(node.style) ? { ...node.style } : {};
  if (nextValue.trim()) {
    nextStyle[key] = nextValue;
  } else {
    delete nextStyle[key];
  }
  return {
    ...node,
    style: Object.keys(nextStyle).length ? nextStyle : undefined,
  };
};

const parseBoxSpacing = (value: string): BoxSpacing => {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { top: '', right: '', bottom: '', left: '' };
  }
  if (tokens.length === 1) {
    return {
      top: tokens[0],
      right: tokens[0],
      bottom: tokens[0],
      left: tokens[0],
    };
  }
  if (tokens.length === 2) {
    return {
      top: tokens[0],
      right: tokens[1],
      bottom: tokens[0],
      left: tokens[1],
    };
  }
  if (tokens.length === 3) {
    return {
      top: tokens[0],
      right: tokens[1],
      bottom: tokens[2],
      left: tokens[1],
    };
  }
  return {
    top: tokens[0],
    right: tokens[1],
    bottom: tokens[2],
    left: tokens[3],
  };
};

const toBoxSpacingShorthand = (spacing: BoxSpacing) => {
  const top = spacing.top.trim();
  const right = spacing.right.trim();
  const bottom = spacing.bottom.trim();
  const left = spacing.left.trim();
  const all = [top, right, bottom, left];
  if (all.every((item) => !item)) return '';
  if (all.some((item) => !item)) {
    return all.filter(Boolean).join(' ');
  }
  if (top === right && top === bottom && top === left) return top;
  if (top === bottom && right === left) return `${top} ${right}`;
  if (right === left) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
};

const getSpacingValue = (node: ComponentNode, key: SpacingKey) => {
  if (node.type === 'MdrDiv') {
    const propValue = readCssValue(node.props?.[key]);
    if (propValue !== undefined) return propValue;
  }
  return readCssValue(node.style?.[key]) ?? '';
};

const getLayoutValue = (node: ComponentNode, key: LayoutValueKey) => {
  if (node.type === 'MdrDiv') {
    const propValue = readCssValue(node.props?.[key]);
    if (propValue !== undefined) return propValue;
  }
  return readCssValue(node.style?.[key]) ?? '';
};

const updateLayoutValue = (
  node: ComponentNode,
  key: LayoutValueKey,
  nextValue: string
): ComponentNode => {
  const hasValue = nextValue.trim().length > 0;
  if (node.type === 'MdrDiv') {
    const nextProps = isPlainObject(node.props) ? { ...node.props } : {};
    const nextStyle = isPlainObject(node.style) ? { ...node.style } : {};
    if (hasValue) {
      nextProps[key] = nextValue;
    } else {
      delete nextProps[key];
    }
    delete nextStyle[key];
    return {
      ...node,
      props: Object.keys(nextProps).length ? nextProps : undefined,
      style: Object.keys(nextStyle).length ? nextStyle : undefined,
    };
  }
  const nextStyle = isPlainObject(node.style) ? { ...node.style } : {};
  if (hasValue) {
    nextStyle[key] = nextValue;
  } else {
    delete nextStyle[key];
  }
  return {
    ...node,
    style: Object.keys(nextStyle).length ? nextStyle : undefined,
  };
};

const updateSpacingValue = (
  node: ComponentNode,
  key: SpacingKey,
  nextValue: string
): ComponentNode => {
  const hasValue = nextValue.trim().length > 0;
  if (node.type === 'MdrDiv') {
    const nextProps = isPlainObject(node.props) ? { ...node.props } : {};
    const nextStyle = isPlainObject(node.style) ? { ...node.style } : {};
    if (hasValue) {
      nextProps[key] = nextValue;
    } else {
      delete nextProps[key];
    }
    delete nextStyle[key];
    return {
      ...node,
      props: Object.keys(nextProps).length ? nextProps : undefined,
      style: Object.keys(nextStyle).length ? nextStyle : undefined,
    };
  }

  const nextStyle = isPlainObject(node.style) ? { ...node.style } : {};
  if (hasValue) {
    nextStyle[key] = nextValue;
  } else {
    delete nextStyle[key];
  }
  return {
    ...node,
    style: Object.keys(nextStyle).length ? nextStyle : undefined,
  };
};

type SpacingControlProps = {
  keyName: SpacingKey;
  value: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (nextValue: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

type ExpandedSpacingState = {
  margin: boolean;
  padding: boolean;
};

type ExpandedGroupsState = {
  spacing: boolean;
  size: boolean;
  appearance: boolean;
  flex: boolean;
  grid: boolean;
};

const DEFAULT_EXPANDED_SPACING_STATE: ExpandedSpacingState = {
  margin: false,
  padding: false,
};

const DEFAULT_EXPANDED_GROUPS_STATE: ExpandedGroupsState = {
  spacing: false,
  size: false,
  appearance: false,
  flex: false,
  grid: false,
};

let persistedExpandedSpacingState: ExpandedSpacingState = {
  ...DEFAULT_EXPANDED_SPACING_STATE,
};

let persistedExpandedGroupsState: ExpandedGroupsState = {
  ...DEFAULT_EXPANDED_GROUPS_STATE,
};

export const resetLayoutPanelExpansionPersistence = () => {
  persistedExpandedSpacingState = { ...DEFAULT_EXPANDED_SPACING_STATE };
  persistedExpandedGroupsState = { ...DEFAULT_EXPANDED_GROUPS_STATE };
};

function SpacingControl({
  keyName,
  value,
  expanded,
  onToggleExpand,
  onChange,
  t,
}: SpacingControlProps) {
  const sides = useMemo(() => parseBoxSpacing(value), [value]);
  return (
    <div className="InspectorField flex flex-col gap-1.5">
      <InspectorRow
        label={t(`inspector.panels.layout.fields.${keyName}`, {
          defaultValue: keyName === 'margin' ? 'Margin' : 'Padding',
        })}
        control={
          <div className="flex items-center gap-1.5">
            <input
              className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="0"
              data-testid={`inspector-${keyName}-shorthand`}
            />
            <button
              type="button"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-black/10 bg-transparent text-(--color-7) hover:text-(--color-9) dark:border-white/16"
              onClick={onToggleExpand}
              data-testid={`inspector-${keyName}-toggle`}
              aria-label={t(
                expanded
                  ? 'inspector.panels.layout.fields.collapse'
                  : 'inspector.panels.layout.fields.expand',
                {
                  defaultValue: expanded ? 'Collapse' : 'Expand',
                }
              )}
              title={t(
                expanded
                  ? 'inspector.panels.layout.fields.collapse'
                  : 'inspector.panels.layout.fields.expand',
                {
                  defaultValue: expanded ? 'Collapse' : 'Expand',
                }
              )}
            >
              <ChevronDown
                size={14}
                className={expanded ? 'rotate-180' : 'rotate-0'}
              />
            </button>
          </div>
        }
      />
      {expanded ? (
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              ['top', sides.top],
              ['right', sides.right],
              ['bottom', sides.bottom],
              ['left', sides.left],
            ] as const
          ).map(([side, sideValue]) => (
            <label
              key={side}
              className="flex items-start gap-2.5 py-1 text-(--color-7)"
            >
              <SpacingSidePreviewIcon side={side} spacingKey={keyName} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[10px] font-semibold leading-none">
                  {t(`inspector.panels.layout.fields.sides.${side}`, {
                    defaultValue: side.charAt(0).toUpperCase() + side.slice(1),
                  })}
                </span>
                <div data-testid={`inspector-${keyName}-${side}`}>
                  <UnitInput
                    value={sideValue ? sideValue : undefined}
                    quantity="length-percentage"
                    placeholder="0"
                    onChange={(nextSideValue) => {
                      const nextValue = readCssValue(nextSideValue) ?? '';
                      onChange(
                        toBoxSpacingShorthand({
                          ...sides,
                          [side]: nextValue,
                        })
                      );
                    }}
                  />
                </div>
              </div>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LayoutPanelView({ node, updateNode }: InspectorPanelRenderProps) {
  const { t } = useTranslation('blueprint');
  const isPatternRoot = isLayoutPatternRootNode(node);
  const patternId = getLayoutPatternId(node);
  const isPatternStructureControlled = isPatternRoot && Boolean(patternId);
  const display = getDisplay(node);
  const gapValue = node.props?.gap;
  const widthValue = getLayoutValue(node, 'width');
  const heightValue = getLayoutValue(node, 'height');
  const backgroundColorValue = getLayoutValue(node, 'backgroundColor');
  const borderValue = getLayoutValue(node, 'border');
  const borderRadiusValue = getLayoutValue(node, 'borderRadius');
  const hasBorder = borderValue.trim().length > 0;
  const marginValue = getSpacingValue(node, 'margin');
  const paddingValue = getSpacingValue(node, 'padding');

  const flexDirection = readString(node.props?.flexDirection) ?? 'Row';
  const justifyContent = readString(node.props?.justifyContent) ?? 'Start';
  const alignItems = readString(node.props?.alignItems) ?? 'Start';

  const gridTemplateColumns = node.style?.gridTemplateColumns;
  const gridTemplateRows = readString(node.style?.gridTemplateRows) ?? '';
  const gridAutoFlow = readString(node.style?.gridAutoFlow) ?? 'row';
  const gridJustifyItems = readString(node.style?.justifyItems) ?? 'stretch';
  const gridAlignItems = readString(node.style?.alignItems) ?? 'stretch';
  const gridJustifyContent = readString(node.style?.justifyContent) ?? 'start';
  const gridAlignContent = readString(node.style?.alignContent) ?? 'start';
  const gridColumnCount = readGridColumnCount(gridTemplateColumns);
  const gridColumnsDraft = gridColumnCount ? String(gridColumnCount) : '';

  const [expandedSpacing, setExpandedSpacing] = useState<ExpandedSpacingState>(
    () => ({ ...persistedExpandedSpacingState })
  );

  const [expandedGroups, setExpandedGroups] = useState<ExpandedGroupsState>(
    () => ({ ...persistedExpandedGroupsState })
  );

  const toggleGroup = (key: keyof typeof expandedGroups) => {
    setExpandedGroups((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };
      persistedExpandedGroupsState = { ...next };
      return next;
    });
  };

  const toggleSpacingExpand = (key: keyof ExpandedSpacingState) => {
    setExpandedSpacing((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };
      persistedExpandedSpacingState = { ...next };
      return next;
    });
  };

  const renderGroup = (
    key: keyof typeof expandedGroups,
    title: string,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedGroups[key];
    return (
      <div className="InspectorField flex flex-col gap-1">
        <button
          type="button"
          className="flex min-h-5.5 w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
          onClick={() => toggleGroup(key)}
        >
          <span className="InspectorLabel text-[11px] font-semibold text-(--color-8)">
            {title}
          </span>
          <ChevronDown
            size={14}
            className={`${isExpanded ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
          />
        </button>
        {isExpanded ? (
          <div className="mt-1 flex flex-col gap-1.5">{content}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="InspectorSection flex flex-col gap-2">
      {isPatternStructureControlled ? (
        <div className="rounded-md border border-black/8 px-2 py-1 text-[10px] text-(--color-6) dark:border-white/14">
          {t('inspector.panels.layout.patternControlled', {
            defaultValue: 'Layout structure is controlled by pattern params.',
          })}
        </div>
      ) : (
        <>
          <InspectorRow
            label={t('inspector.panels.layout.fields.display', {
              defaultValue: 'Display',
            })}
            control={
              <MdrSelect
                size="Small"
                value={display ?? 'Block'}
                options={[
                  {
                    label: t('inspector.panels.layout.options.display.block', {
                      defaultValue: 'Block',
                    }),
                    value: 'Block',
                  },
                  {
                    label: t('inspector.panels.layout.options.display.flex', {
                      defaultValue: 'Flex',
                    }),
                    value: 'Flex',
                  },
                  {
                    label: t('inspector.panels.layout.options.display.grid', {
                      defaultValue: 'Grid',
                    }),
                    value: 'Grid',
                  },
                  {
                    label: t('inspector.panels.layout.options.display.inline', {
                      defaultValue: 'Inline',
                    }),
                    value: 'Inline',
                  },
                  {
                    label: t(
                      'inspector.panels.layout.options.display.inlineBlock',
                      {
                        defaultValue: 'InlineBlock',
                      }
                    ),
                    value: 'InlineBlock',
                  },
                ]}
                onChange={(value) =>
                  updateNode((current) =>
                    withProps(current, {
                      display: value,
                    })
                  )
                }
              />
            }
          />
          {display === 'Flex' || display === 'Grid' ? (
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
                        const { gap, ...rest } = isPlainObject(current.props)
                          ? current.props
                          : {};
                        return { ...current, props: rest };
                      }
                      return withProps(current, {
                        gap: next,
                      });
                    });
                  }}
                  placeholder="8"
                />
              }
            />
          ) : null}
        </>
      )}
      {renderGroup(
        'spacing',
        t('inspector.panels.layout.groups.spacing', {
          defaultValue: 'Spacing',
        }),
        <>
          <SpacingControl
            keyName="margin"
            value={marginValue}
            expanded={expandedSpacing.margin}
            onToggleExpand={() => toggleSpacingExpand('margin')}
            onChange={(nextValue) =>
              updateNode((current) =>
                updateSpacingValue(current, 'margin', nextValue)
              )
            }
            t={t}
          />
          <SpacingControl
            keyName="padding"
            value={paddingValue}
            expanded={expandedSpacing.padding}
            onToggleExpand={() => toggleSpacingExpand('padding')}
            onChange={(nextValue) =>
              updateNode((current) =>
                updateSpacingValue(current, 'padding', nextValue)
              )
            }
            t={t}
          />
        </>
      )}
      {renderGroup(
        'size',
        t('inspector.panels.layout.groups.size', { defaultValue: 'Size' }),
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-(--color-7)">
              {t('inspector.panels.layout.fields.width', {
                defaultValue: 'Width',
              })}
            </span>
            <UnitInput
              value={widthValue || undefined}
              quantity="length-percentage"
              placeholder={t('inspector.panels.layout.placeholders.auto', {
                defaultValue: 'auto',
              })}
              onChange={(value) =>
                updateNode((current) =>
                  updateLayoutValue(current, 'width', readCssValue(value) ?? '')
                )
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-(--color-7)">
              {t('inspector.panels.layout.fields.height', {
                defaultValue: 'Height',
              })}
            </span>
            <UnitInput
              value={heightValue || undefined}
              quantity="length-percentage"
              placeholder={t('inspector.panels.layout.placeholders.auto', {
                defaultValue: 'auto',
              })}
              onChange={(value) =>
                updateNode((current) =>
                  updateLayoutValue(
                    current,
                    'height',
                    readCssValue(value) ?? ''
                  )
                )
              }
            />
          </div>
        </div>
      )}
      {renderGroup(
        'appearance',
        t('inspector.panels.layout.groups.appearance', {
          defaultValue: 'Appearance',
        }),
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
                    updateLayoutValue(
                      current,
                      'border',
                      event.target.value ?? ''
                    )
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
      )}

      {display === 'Flex' &&
        !isPatternStructureControlled &&
        renderGroup(
          'flex',
          t('inspector.panels.layout.groups.flex', { defaultValue: 'Flex' }),
          <>
            <div className="InspectorField flex flex-col gap-1.5">
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
                            defaultValue: 'Column Reverse',
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
                              label: t(
                                'inspector.panels.layout.options.justify.start',
                                {
                                  defaultValue: 'Start',
                                }
                              ),
                            },
                            {
                              value: 'Center',
                              icon: <JustifyCenterIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.center',
                                {
                                  defaultValue: 'Center',
                                }
                              ),
                            },
                            {
                              value: 'End',
                              icon: <JustifyEndIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.end',
                                {
                                  defaultValue: 'End',
                                }
                              ),
                            },
                            {
                              value: 'SpaceBetween',
                              icon: <JustifySpaceBetweenIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.spaceBetween',
                                {
                                  defaultValue: 'Space Between',
                                }
                              ),
                            },
                            {
                              value: 'SpaceAround',
                              icon: <JustifySpaceAroundIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.spaceAround',
                                {
                                  defaultValue: 'Space Around',
                                }
                              ),
                            },
                            {
                              value: 'SpaceEvenly',
                              icon: <JustifySpaceEvenlyIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.spaceEvenly',
                                {
                                  defaultValue: 'Space Evenly',
                                }
                              ),
                            },
                          ]
                        : [
                            {
                              value: 'Start',
                              icon: <JustifyStartColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.start',
                                {
                                  defaultValue: 'Start',
                                }
                              ),
                            },
                            {
                              value: 'Center',
                              icon: <JustifyCenterColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.center',
                                {
                                  defaultValue: 'Center',
                                }
                              ),
                            },
                            {
                              value: 'End',
                              icon: <JustifyEndColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.end',
                                {
                                  defaultValue: 'End',
                                }
                              ),
                            },
                            {
                              value: 'SpaceBetween',
                              icon: <JustifySpaceBetweenColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.spaceBetween',
                                {
                                  defaultValue: 'Space Between',
                                }
                              ),
                            },
                            {
                              value: 'SpaceAround',
                              icon: <JustifySpaceAroundColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.spaceAround',
                                {
                                  defaultValue: 'Space Around',
                                }
                              ),
                            },
                            {
                              value: 'SpaceEvenly',
                              icon: <JustifySpaceEvenlyColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.justify.spaceEvenly',
                                {
                                  defaultValue: 'Space Evenly',
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
                              label: t(
                                'inspector.panels.layout.options.align.start',
                                {
                                  defaultValue: 'Start',
                                }
                              ),
                            },
                            {
                              value: 'Center',
                              icon: <AlignCenterIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.center',
                                {
                                  defaultValue: 'Center',
                                }
                              ),
                            },
                            {
                              value: 'End',
                              icon: <AlignEndIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.end',
                                {
                                  defaultValue: 'End',
                                }
                              ),
                            },
                            {
                              value: 'Stretch',
                              icon: <AlignStretchIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.stretch',
                                {
                                  defaultValue: 'Stretch',
                                }
                              ),
                            },
                            {
                              value: 'Baseline',
                              icon: <AlignBaselineIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.baseline',
                                {
                                  defaultValue: 'Baseline',
                                }
                              ),
                            },
                          ]
                        : [
                            {
                              value: 'Start',
                              icon: <AlignStartColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.start',
                                {
                                  defaultValue: 'Start',
                                }
                              ),
                            },
                            {
                              value: 'Center',
                              icon: <AlignCenterColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.center',
                                {
                                  defaultValue: 'Center',
                                }
                              ),
                            },
                            {
                              value: 'End',
                              icon: <AlignEndColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.end',
                                {
                                  defaultValue: 'End',
                                }
                              ),
                            },
                            {
                              value: 'Stretch',
                              icon: <AlignStretchColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.stretch',
                                {
                                  defaultValue: 'Stretch',
                                }
                              ),
                            },
                            {
                              value: 'Baseline',
                              icon: <AlignBaselineColumnIcon />,
                              label: t(
                                'inspector.panels.layout.options.align.baseline',
                                {
                                  defaultValue: 'Baseline',
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

      {display === 'Grid' &&
        !isPatternStructureControlled &&
        renderGroup(
          'grid',
          t('inspector.panels.layout.groups.grid', { defaultValue: 'Grid' }),
          <>
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
                        if (!Number.isFinite(next) || next <= 0) {
                          const { gridTemplateColumns, ...rest } =
                            isPlainObject(current.style) ? current.style : {};
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
            <div className="InspectorField flex flex-col gap-1.5">
              <InspectorRow
                label={t('inspector.panels.layout.fields.gridRows', {
                  defaultValue: 'Rows',
                })}
                control={
                  <input
                    className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
                    value={gridTemplateRows}
                    placeholder={t(
                      'inspector.panels.layout.placeholders.gridRows',
                      {
                        defaultValue: 'repeat(2, minmax(0, 1fr))',
                      }
                    )}
                    onChange={(event) =>
                      updateNode((current) =>
                        updateStyleValue(
                          current,
                          'gridTemplateRows',
                          event.target.value ?? ''
                        )
                      )
                    }
                  />
                }
              />
            </div>
            <div className="InspectorField flex flex-col gap-1.5">
              <InspectorRow
                layout="vertical"
                label={t('inspector.panels.layout.fields.gridAutoFlow', {
                  defaultValue: 'Auto Flow',
                })}
                control={
                  <IconButtonGroup
                    value={gridAutoFlow}
                    options={[
                      {
                        label: t(
                          'inspector.panels.layout.options.gridAutoFlow.row',
                          {
                            defaultValue: 'Row',
                          }
                        ),
                        value: 'row',
                        icon: <span className="text-[10px]">R</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.gridAutoFlow.column',
                          {
                            defaultValue: 'Column',
                          }
                        ),
                        value: 'column',
                        icon: <span className="text-[10px]">C</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.gridAutoFlow.rowDense',
                          {
                            defaultValue: 'Row Dense',
                          }
                        ),
                        value: 'row dense',
                        icon: <span className="text-[10px]">RD</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.gridAutoFlow.columnDense',
                          {
                            defaultValue: 'Col Dense',
                          }
                        ),
                        value: 'column dense',
                        icon: <span className="text-[10px]">CD</span>,
                      },
                    ]}
                    layout="grid"
                    onChange={(value) =>
                      updateNode((current) =>
                        updateStyleValue(current, 'gridAutoFlow', value)
                      )
                    }
                  />
                }
              />
            </div>
            <div className="InspectorField flex flex-col gap-1.5">
              <InspectorRow
                layout="vertical"
                label={t('inspector.panels.layout.fields.justifyItems', {
                  defaultValue: 'Justify Items',
                })}
                control={
                  <IconButtonGroup
                    value={gridJustifyItems}
                    options={[
                      {
                        label: t(
                          'inspector.panels.layout.options.align.start',
                          {
                            defaultValue: 'Start',
                          }
                        ),
                        value: 'start',
                        icon: <span className="text-[10px]">S</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.align.center',
                          {
                            defaultValue: 'Center',
                          }
                        ),
                        value: 'center',
                        icon: <span className="text-[10px]">C</span>,
                      },
                      {
                        label: t('inspector.panels.layout.options.align.end', {
                          defaultValue: 'End',
                        }),
                        value: 'end',
                        icon: <span className="text-[10px]">E</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.align.stretch',
                          {
                            defaultValue: 'Stretch',
                          }
                        ),
                        value: 'stretch',
                        icon: <span className="text-[10px]">ST</span>,
                      },
                    ]}
                    layout="grid"
                    onChange={(value) =>
                      updateNode((current) =>
                        updateStyleValue(current, 'justifyItems', value)
                      )
                    }
                  />
                }
              />
            </div>
            <div className="InspectorField flex flex-col gap-1.5">
              <InspectorRow
                layout="vertical"
                label={t('inspector.panels.layout.fields.alignItems', {
                  defaultValue: 'Align Items',
                })}
                control={
                  <IconButtonGroup
                    value={gridAlignItems}
                    options={[
                      {
                        label: t(
                          'inspector.panels.layout.options.align.start',
                          {
                            defaultValue: 'Start',
                          }
                        ),
                        value: 'start',
                        icon: <span className="text-[10px]">S</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.align.center',
                          {
                            defaultValue: 'Center',
                          }
                        ),
                        value: 'center',
                        icon: <span className="text-[10px]">C</span>,
                      },
                      {
                        label: t('inspector.panels.layout.options.align.end', {
                          defaultValue: 'End',
                        }),
                        value: 'end',
                        icon: <span className="text-[10px]">E</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.align.stretch',
                          {
                            defaultValue: 'Stretch',
                          }
                        ),
                        value: 'stretch',
                        icon: <span className="text-[10px]">ST</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.align.baseline',
                          {
                            defaultValue: 'Baseline',
                          }
                        ),
                        value: 'baseline',
                        icon: <span className="text-[10px]">B</span>,
                      },
                    ]}
                    layout="grid"
                    onChange={(value) =>
                      updateNode((current) =>
                        updateStyleValue(current, 'alignItems', value)
                      )
                    }
                  />
                }
              />
            </div>
            <div className="InspectorField flex flex-col gap-1.5">
              <InspectorRow
                layout="vertical"
                label={t('inspector.panels.layout.fields.justifyContent', {
                  defaultValue: 'Justify Content',
                })}
                control={
                  <IconButtonGroup
                    value={gridJustifyContent}
                    options={[
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.start',
                          {
                            defaultValue: 'Start',
                          }
                        ),
                        value: 'start',
                        icon: <span className="text-[10px]">S</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.center',
                          {
                            defaultValue: 'Center',
                          }
                        ),
                        value: 'center',
                        icon: <span className="text-[10px]">C</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.end',
                          {
                            defaultValue: 'End',
                          }
                        ),
                        value: 'end',
                        icon: <span className="text-[10px]">E</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.spaceBetween',
                          {
                            defaultValue: 'Between',
                          }
                        ),
                        value: 'space-between',
                        icon: <span className="text-[10px]">SB</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.spaceAround',
                          {
                            defaultValue: 'Around',
                          }
                        ),
                        value: 'space-around',
                        icon: <span className="text-[10px]">SA</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.spaceEvenly',
                          {
                            defaultValue: 'Evenly',
                          }
                        ),
                        value: 'space-evenly',
                        icon: <span className="text-[10px]">SE</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.align.stretch',
                          {
                            defaultValue: 'Stretch',
                          }
                        ),
                        value: 'stretch',
                        icon: <span className="text-[10px]">ST</span>,
                      },
                    ]}
                    layout="grid"
                    onChange={(value) =>
                      updateNode((current) =>
                        updateStyleValue(current, 'justifyContent', value)
                      )
                    }
                  />
                }
              />
            </div>
            <div className="InspectorField flex flex-col gap-1.5">
              <InspectorRow
                layout="vertical"
                label={t('inspector.panels.layout.fields.alignContent', {
                  defaultValue: 'Align Content',
                })}
                control={
                  <IconButtonGroup
                    value={gridAlignContent}
                    options={[
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.start',
                          {
                            defaultValue: 'Start',
                          }
                        ),
                        value: 'start',
                        icon: <span className="text-[10px]">S</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.center',
                          {
                            defaultValue: 'Center',
                          }
                        ),
                        value: 'center',
                        icon: <span className="text-[10px]">C</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.end',
                          {
                            defaultValue: 'End',
                          }
                        ),
                        value: 'end',
                        icon: <span className="text-[10px]">E</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.spaceBetween',
                          {
                            defaultValue: 'Between',
                          }
                        ),
                        value: 'space-between',
                        icon: <span className="text-[10px]">SB</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.spaceAround',
                          {
                            defaultValue: 'Around',
                          }
                        ),
                        value: 'space-around',
                        icon: <span className="text-[10px]">SA</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.justify.spaceEvenly',
                          {
                            defaultValue: 'Evenly',
                          }
                        ),
                        value: 'space-evenly',
                        icon: <span className="text-[10px]">SE</span>,
                      },
                      {
                        label: t(
                          'inspector.panels.layout.options.align.stretch',
                          {
                            defaultValue: 'Stretch',
                          }
                        ),
                        value: 'stretch',
                        icon: <span className="text-[10px]">ST</span>,
                      },
                    ]}
                    layout="grid"
                    onChange={(value) =>
                      updateNode((current) =>
                        updateStyleValue(current, 'alignContent', value)
                      )
                    }
                  />
                }
              />
            </div>
          </>
        )}
    </div>
  );
}

export const layoutPanel: InspectorPanelDefinition = {
  key: 'layout',
  title: 'Layout',
  description: 'Flex / Grid layout details',
  match: (node) => isLayoutComponent(node),
  render: (props) => <LayoutPanelView {...props} />,
};
