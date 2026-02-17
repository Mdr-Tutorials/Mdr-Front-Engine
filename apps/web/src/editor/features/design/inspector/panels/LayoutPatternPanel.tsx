import { useMemo } from 'react';
import { MdrInput, MdrSelect } from '@mdr/ui';
import { getLayoutPatternDefinition } from '@/editor/features/design/blueprint/layoutPatterns/registry';
import {
  getLayoutPatternId,
  getLayoutPatternParams,
  isLayoutPatternRootNode,
  mergeLayoutPatternParams,
} from '@/editor/features/design/blueprint/layoutPatterns/dataAttributes';
import type { LayoutPatternParamSchema } from '@/editor/features/design/blueprint/layoutPatterns/layoutPattern.types';
import type { ComponentNode } from '@/core/types/engine.types';
import type {
  InspectorPanelDefinition,
  InspectorPanelRenderProps,
} from './types';
import { InspectorRow } from '../components/InspectorRow';
import { PresetInput } from '../components/PresetInput';
import { UnitInput } from '../components/UnitInput';

const resolveParams = (
  schema: LayoutPatternParamSchema,
  raw: Record<string, string>
) =>
  Object.entries(schema).reduce<Record<string, unknown>>(
    (accumulator, [key, definition]) => {
      const value = raw[key];
      if (value === undefined) {
        accumulator[key] = definition.defaultValue;
        return accumulator;
      }
      if (definition.kind === 'number') {
        const next = Number(value);
        accumulator[key] = Number.isFinite(next)
          ? next
          : definition.defaultValue;
        return accumulator;
      }
      if (definition.kind === 'boolean') {
        accumulator[key] = value === 'true';
        return accumulator;
      }
      accumulator[key] = value;
      return accumulator;
    },
    {}
  );

const withPatternParams = (
  root: ComponentNode,
  params: Record<string, unknown>
) => {
  const nextProps =
    root.props && typeof root.props === 'object' ? { ...root.props } : {};
  nextProps.dataAttributes = mergeLayoutPatternParams(
    nextProps.dataAttributes,
    params
  );
  return {
    ...root,
    props: nextProps,
  };
};

function LayoutPatternPanelView({
  node,
  updateNode,
}: InspectorPanelRenderProps) {
  const patternId = getLayoutPatternId(node);
  const pattern = patternId ? getLayoutPatternDefinition(patternId) : undefined;
  const currentParams = useMemo(() => {
    if (!pattern) return {};
    return resolveParams(pattern.schema, getLayoutPatternParams(node));
  }, [node, pattern]);

  if (!pattern || !patternId) return null;
  const splitCategory =
    patternId === 'split' && typeof currentParams.category === 'string'
      ? currentParams.category
      : null;

  const updatePatternParam = (key: string, value: unknown) => {
    updateNode((current) => {
      const definition = getLayoutPatternDefinition(patternId);
      if (!definition) return current;
      const currentResolved = resolveParams(
        definition.schema,
        getLayoutPatternParams(current)
      );
      const nextParams = {
        ...currentResolved,
        [key]: value,
      };
      const nextRoot = definition.update(current, {
        patternId,
        currentParams: currentResolved,
        patch: { [key]: value },
        nextParams,
      });
      return withPatternParams(nextRoot, nextParams);
    });
  };

  return (
    <div className="InspectorSection flex flex-col gap-2">
      {patternId === 'split' && splitCategory === '2-columns' ? (
        <div className="rounded-md border border-black/8 px-2 py-1 text-[10px] text-(--color-6) dark:border-white/14">
          Third column is hidden in 2 columns mode (not deleted).
        </div>
      ) : null}
      {Object.entries(pattern.schema).map(([key, definition]) => {
        const value = currentParams[key];
        if (definition.kind === 'enum') {
          const enumOptions =
            patternId === 'split' && key === 'ratio'
              ? definition.options.filter((option) =>
                  splitCategory === '3-columns'
                    ? option.value.split('-').length === 3
                    : option.value.split('-').length === 2
                )
              : definition.options;
          const enumValue = typeof value === 'string' ? value : '';

          if (patternId === 'split' && key === 'ratio') {
            return (
              <InspectorRow
                key={key}
                label={definition.label}
                control={
                  <PresetInput
                    value={enumValue}
                    options={enumOptions}
                    placeholder={
                      splitCategory === '3-columns' ? '1-1-1' : '1-1'
                    }
                    onChange={(next) => updatePatternParam(key, next)}
                  />
                }
              />
            );
          }
          return (
            <InspectorRow
              key={key}
              label={definition.label}
              control={
                <MdrSelect
                  size="Small"
                  value={
                    enumValue && enumOptions.some((option) => option.value === enumValue)
                      ? enumValue
                      : definition.defaultValue
                  }
                  options={enumOptions.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  onChange={(next) => updatePatternParam(key, next)}
                />
              }
            />
          );
        }
        if (definition.kind === 'number') {
          return (
            <InspectorRow
              key={key}
              label={definition.label}
              control={
                <MdrInput
                  size="Small"
                  value={String(value ?? definition.defaultValue)}
                  onChange={(next) => {
                    const parsed = Number(next);
                    if (!Number.isFinite(parsed)) return;
                    updatePatternParam(key, parsed);
                  }}
                />
              }
            />
          );
        }
        if (definition.kind === 'length') {
          return (
            <InspectorRow
              key={key}
              label={definition.label}
              control={
                <UnitInput
                  value={value as string | number | undefined}
                  quantity="length-percentage"
                  onChange={(next) =>
                    updatePatternParam(key, next ?? definition.defaultValue)
                  }
                />
              }
            />
          );
        }
        return (
          <InspectorRow
            key={key}
            label={definition.label}
            control={
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={
                  typeof value === 'boolean'
                    ? value
                    : Boolean(definition.defaultValue)
                }
                onChange={(event) =>
                  updatePatternParam(key, Boolean(event.target.checked))
                }
              />
            }
          />
        );
      })}
    </div>
  );
}

export const layoutPatternPanel: InspectorPanelDefinition = {
  key: 'layout-pattern',
  title: 'Pattern',
  description: 'Layout pattern parameters',
  match: (node) => isLayoutPatternRootNode(node),
  render: (props) => <LayoutPatternPanelView {...props} />,
};
