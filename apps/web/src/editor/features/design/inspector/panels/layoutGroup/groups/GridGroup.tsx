import type { LayoutGroupDefinition, LayoutGroupRenderProps } from '../types';
import {
  isPlainObject,
  readString,
  readGridColumnCount,
  withStyle,
  updateStyleValue,
} from '../layoutPanelHelpers';
import { MdrInput } from '@mdr/ui';
import { InspectorRow } from '@/editor/features/design/inspector/components/InspectorRow';
import { IconButtonGroup } from '@/editor/features/design/inspector/components/IconButtonGroup';

const GridGroupContent = ({ node, updateNode, t }: LayoutGroupRenderProps) => {
  const gridTemplateColumns = node.style?.gridTemplateColumns;
  const gridTemplateRows = readString(node.style?.gridTemplateRows) ?? '';
  const gridAutoFlow = readString(node.style?.gridAutoFlow) ?? 'row';
  const gridJustifyItems = readString(node.style?.justifyItems) ?? 'stretch';
  const gridAlignItems = readString(node.style?.alignItems) ?? 'stretch';
  const gridJustifyContent = readString(node.style?.justifyContent) ?? 'start';
  const gridAlignContent = readString(node.style?.alignContent) ?? 'start';
  const gridColumnCount = readGridColumnCount(gridTemplateColumns);
  const gridColumnsDraft = gridColumnCount ? String(gridColumnCount) : '';

  return (
    <>
      <div className="InspectorField flex flex-col gap-1.5">
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
      <div className="InspectorField flex flex-col gap-1.5">
        <InspectorRow
          label={t('inspector.panels.layout.fields.gridRows', {
            defaultValue: 'Rows',
          })}
          control={
            <input
              className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
              value={gridTemplateRows}
              placeholder={t('inspector.panels.layout.placeholders.gridRows', {
                defaultValue: 'repeat(2, minmax(0, 1fr))',
              })}
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
                  label: t('inspector.panels.layout.options.gridAutoFlow.row', {
                    defaultValue: 'Row',
                  }),
                  value: 'row',
                  icon: <span className="text-[10px]">R</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.gridAutoFlow.column',
                    { defaultValue: 'Column' }
                  ),
                  value: 'column',
                  icon: <span className="text-[10px]">C</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.gridAutoFlow.rowDense',
                    { defaultValue: 'Row Dense' }
                  ),
                  value: 'row dense',
                  icon: <span className="text-[10px]">RD</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.gridAutoFlow.columnDense',
                    { defaultValue: 'Col Dense' }
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
                  label: t('inspector.panels.layout.options.align.start', {
                    defaultValue: 'Start',
                  }),
                  value: 'start',
                  icon: <span className="text-[10px]">S</span>,
                },
                {
                  label: t('inspector.panels.layout.options.align.center', {
                    defaultValue: 'Center',
                  }),
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
                  label: t('inspector.panels.layout.options.align.stretch', {
                    defaultValue: 'Stretch',
                  }),
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
                  label: t('inspector.panels.layout.options.align.start', {
                    defaultValue: 'Start',
                  }),
                  value: 'start',
                  icon: <span className="text-[10px]">S</span>,
                },
                {
                  label: t('inspector.panels.layout.options.align.center', {
                    defaultValue: 'Center',
                  }),
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
                  label: t('inspector.panels.layout.options.align.stretch', {
                    defaultValue: 'Stretch',
                  }),
                  value: 'stretch',
                  icon: <span className="text-[10px]">ST</span>,
                },
                {
                  label: t('inspector.panels.layout.options.align.baseline', {
                    defaultValue: 'Baseline',
                  }),
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
                  label: t('inspector.panels.layout.options.justify.start', {
                    defaultValue: 'Start',
                  }),
                  value: 'start',
                  icon: <span className="text-[10px]">S</span>,
                },
                {
                  label: t('inspector.panels.layout.options.justify.center', {
                    defaultValue: 'Center',
                  }),
                  value: 'center',
                  icon: <span className="text-[10px]">C</span>,
                },
                {
                  label: t('inspector.panels.layout.options.justify.end', {
                    defaultValue: 'End',
                  }),
                  value: 'end',
                  icon: <span className="text-[10px]">E</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.justify.spaceBetween',
                    { defaultValue: 'Between' }
                  ),
                  value: 'space-between',
                  icon: <span className="text-[10px]">SB</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.justify.spaceAround',
                    { defaultValue: 'Around' }
                  ),
                  value: 'space-around',
                  icon: <span className="text-[10px]">SA</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.justify.spaceEvenly',
                    { defaultValue: 'Evenly' }
                  ),
                  value: 'space-evenly',
                  icon: <span className="text-[10px]">SE</span>,
                },
                {
                  label: t('inspector.panels.layout.options.align.stretch', {
                    defaultValue: 'Stretch',
                  }),
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
                  label: t('inspector.panels.layout.options.justify.start', {
                    defaultValue: 'Start',
                  }),
                  value: 'start',
                  icon: <span className="text-[10px]">S</span>,
                },
                {
                  label: t('inspector.panels.layout.options.justify.center', {
                    defaultValue: 'Center',
                  }),
                  value: 'center',
                  icon: <span className="text-[10px]">C</span>,
                },
                {
                  label: t('inspector.panels.layout.options.justify.end', {
                    defaultValue: 'End',
                  }),
                  value: 'end',
                  icon: <span className="text-[10px]">E</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.justify.spaceBetween',
                    { defaultValue: 'Between' }
                  ),
                  value: 'space-between',
                  icon: <span className="text-[10px]">SB</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.justify.spaceAround',
                    { defaultValue: 'Around' }
                  ),
                  value: 'space-around',
                  icon: <span className="text-[10px]">SA</span>,
                },
                {
                  label: t(
                    'inspector.panels.layout.options.justify.spaceEvenly',
                    { defaultValue: 'Evenly' }
                  ),
                  value: 'space-evenly',
                  icon: <span className="text-[10px]">SE</span>,
                },
                {
                  label: t('inspector.panels.layout.options.align.stretch', {
                    defaultValue: 'Stretch',
                  }),
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
  );
};

export const gridGroup: LayoutGroupDefinition = {
  key: 'grid',
  title: 'Grid',
  order: 50,
  match: (_node, display, isPatternStructureControlled) =>
    display === 'Grid' && !isPatternStructureControlled,
  render: GridGroupContent,
};
