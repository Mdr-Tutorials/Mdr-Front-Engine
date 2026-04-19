import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { MdrSelect } from '@mdr/ui';
import {
  isPlainObject,
  isLayoutComponent,
  getDisplay,
  readNumber,
  readString,
  withProps,
} from './layoutGroup/layoutPanelHelpers';
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
import { resolveLayoutGroups } from './layoutGroup/layoutGroupRegistry';
import {
  getLayoutGroupExpansionState,
  setLayoutGroupExpansionState,
  resetLayoutGroupExpansionPersistence,
} from './layoutGroup/layoutGroupExpansion';
import {
  LayoutGroupContext,
  type LayoutGroupContextValue,
} from './layoutGroup/LayoutGroupContext';
import type { LayoutGroupRenderProps } from './layoutGroup/types';

import './layoutGroup/registerBuiltinLayoutGroups';

function LayoutPanelView({ node, updateNode }: InspectorPanelRenderProps) {
  const { t } = useTranslation('blueprint');
  const isPatternRoot = isLayoutPatternRootNode(node);
  const patternId = getLayoutPatternId(node);
  const isPatternStructureControlled = isPatternRoot && Boolean(patternId);
  const display = getDisplay(node);
  const gapValue = node.props?.gap;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => getLayoutGroupExpansionState()
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups((current) => {
      const next = { ...current, [key]: !current[key] };
      setLayoutGroupExpansionState(next);
      return next;
    });
  };

  const groups = resolveLayoutGroups(
    node,
    display,
    isPatternStructureControlled
  );

  const contextValue: LayoutGroupContextValue = {
    node,
    updateNode,
    display,
    isPatternStructureControlled,
    t: t as LayoutGroupContextValue['t'],
  };

  return (
    <LayoutGroupContext.Provider value={contextValue}>
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
                      label: t(
                        'inspector.panels.layout.options.display.block',
                        { defaultValue: 'Block' }
                      ),
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
                      label: t(
                        'inspector.panels.layout.options.display.inline',
                        { defaultValue: 'Inline' }
                      ),
                      value: 'Inline',
                    },
                    {
                      label: t(
                        'inspector.panels.layout.options.display.inlineBlock',
                        { defaultValue: 'InlineBlock' }
                      ),
                      value: 'InlineBlock',
                    },
                  ]}
                  onChange={(value) =>
                    updateNode((current) =>
                      withProps(current, { display: value })
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
                        return withProps(current, { gap: next });
                      });
                    }}
                    placeholder="8"
                  />
                }
              />
            ) : null}
          </>
        )}

        {groups.map((group) => {
          const isExpanded = expandedGroups[group.key] ?? false;
          const groupTitle = t(`inspector.panels.layout.groups.${group.key}`, {
            defaultValue: group.title,
          });
          return (
            <div key={group.key} className="InspectorField flex flex-col gap-1">
              <button
                type="button"
                className="flex min-h-5.5 w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
                onClick={() => toggleGroup(group.key)}
              >
                <span className="InspectorLabel text-[11px] font-semibold text-(--color-8)">
                  {groupTitle}
                </span>
                <ChevronDown
                  size={14}
                  className={`${isExpanded ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
                />
              </button>
              {isExpanded ? (
                <div className="mt-1 flex flex-col gap-1.5">
                  {group.render(contextValue as LayoutGroupRenderProps)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </LayoutGroupContext.Provider>
  );
}

export const resetLayoutPanelExpansionPersistence = () => {
  resetLayoutGroupExpansionPersistence();
};

export const layoutPanel: InspectorPanelDefinition = {
  key: 'layout',
  title: 'Layout',
  description: 'Flex / Grid layout details',
  match: (node) => isLayoutComponent(node) && !isLayoutPatternRootNode(node),
  render: (props) => <LayoutPanelView {...props} />,
};
