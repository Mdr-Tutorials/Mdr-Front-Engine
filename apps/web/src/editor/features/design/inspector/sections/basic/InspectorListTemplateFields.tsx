import type { NodeListRender } from '@/core/types/engine.types';
import { useInspectorSectionContext } from '../InspectorSectionContext';

export function InspectorListTemplateFields() {
  const { t, selectedNode, updateSelectedNode } = useInspectorSectionContext();
  if (!selectedNode) return null;

  const enabled = Boolean(selectedNode.list);
  const arrayField =
    typeof selectedNode.list?.arrayField === 'string'
      ? selectedNode.list.arrayField
      : '';

  return (
    <div className="grid gap-1.5 rounded-md border border-black/8 p-2 dark:border-white/14">
      <div className="text-[10px] font-semibold text-(--color-7)">
        {t('inspector.fields.listTemplate.title', {
          defaultValue: 'List Template',
        })}
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-(--color-8)">
        <input
          data-testid="inspector-list-template-enable"
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            updateSelectedNode((current: any) => {
              if (!checked) {
                const next = { ...current };
                delete next.list;
                return next;
              }
              const nextList: NodeListRender = {
                arrayField: '',
                itemAs: 'item',
                indexAs: 'index',
              };
              return { ...current, list: nextList };
            });
          }}
        />
        {t('inspector.fields.listTemplate.enable', {
          defaultValue: 'Promote node as list template',
        })}
      </label>
      {enabled ? (
        <label className="grid gap-1 text-xs text-(--color-8)">
          <span className="text-[10px] font-semibold text-(--color-7)">
            {t('inspector.fields.listTemplate.arrayField', {
              defaultValue: 'Array Field',
            })}
          </span>
          <input
            data-testid="inspector-list-array-field"
            className="h-7 min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
            value={arrayField}
            onChange={(event) => {
              const nextValue = event.target.value;
              updateSelectedNode((current: any) => {
                if (!current.list) return current;
                return {
                  ...current,
                  list: {
                    ...current.list,
                    arrayField: nextValue,
                  },
                };
              });
            }}
            placeholder={t(
              'inspector.fields.listTemplate.arrayFieldPlaceholder',
              {
                defaultValue: 'items',
              }
            )}
          />
        </label>
      ) : null}
    </div>
  );
}
