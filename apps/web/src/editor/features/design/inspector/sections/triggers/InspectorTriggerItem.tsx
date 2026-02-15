import { Trash2 } from 'lucide-react';
import {
  BUILT_IN_ACTION_OPTIONS,
  DOM_EVENT_TRIGGERS,
  createDefaultActionParams,
  getNavigateLinkKind,
  normalizeBuiltInAction,
  type BuiltInActionName,
} from '@/mir/actions/registry';
import { useInspectorSectionContext } from '../InspectorSectionContext';
import { TriggerNavigateFields } from './TriggerNavigateFields';
import { TriggerGraphFields } from './TriggerGraphFields';

type TriggerItem = {
  key: string;
  trigger: string;
  action?: string;
  params: Record<string, unknown>;
};

export function InspectorTriggerItem({ item }: { item: TriggerItem }) {
  const { t, graphOptions, updateTrigger, removeTrigger } =
    useInspectorSectionContext();
  const toValue = typeof item.params.to === 'string' ? item.params.to : '';
  const targetValue = item.params.target === '_self' ? '_self' : '_blank';
  const actionValue = normalizeBuiltInAction(
    typeof item.action === 'string' ? item.action : undefined
  );
  const replaceValue = Boolean(item.params.replace);
  const isValidLinkValue = !toValue || Boolean(getNavigateLinkKind(toValue));
  const graphMode = item.params.graphMode === 'existing' ? 'existing' : 'new';
  const graphName =
    typeof item.params.graphName === 'string' ? item.params.graphName : '';
  const selectedGraphId =
    typeof item.params.graphId === 'string'
      ? item.params.graphId
      : (graphOptions[0]?.id ?? '');
  const stateValue =
    typeof item.params.state === 'string'
      ? item.params.state
      : item.params.state === undefined
        ? ''
        : JSON.stringify(item.params.state);

  return (
    <div className="grid gap-1.5" data-testid={`inspector-trigger-${item.key}`}>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
        <div className="grid gap-1">
          <span className="text-[10px] font-semibold text-(--color-7)">
            {t('inspector.groups.triggers.eventLabel', {
              defaultValue: 'Trigger Event',
            })}
          </span>
          <select
            className="h-7 min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
            value={item.trigger}
            title={t('inspector.groups.triggers.eventHelp', {
              defaultValue: 'Choose which DOM event will trigger this action.',
            })}
            onChange={(event) => {
              updateTrigger(item.key, (currentEvent: any) => ({
                ...currentEvent,
                trigger: event.target.value,
              }));
            }}
          >
            {DOM_EVENT_TRIGGERS.map((trigger) => (
              <option key={trigger} value={trigger}>
                {trigger}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <span className="text-[10px] font-semibold text-(--color-7)">
            {t('inspector.groups.triggers.actionLabel', {
              defaultValue: 'Action',
            })}
          </span>
          <select
            className="h-7 min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
            value={actionValue}
            title={t('inspector.groups.triggers.actionHelp', {
              defaultValue: 'Choose what should run when the event is fired.',
            })}
            onChange={(event) => {
              updateTrigger(item.key, (currentEvent: any) => ({
                ...currentEvent,
                action: event.target.value,
                params: createDefaultActionParams(
                  normalizeBuiltInAction(
                    event.target.value as BuiltInActionName
                  )
                ),
              }));
            }}
          >
            {BUILT_IN_ACTION_OPTIONS.map((actionOption) => (
              <option key={actionOption.value} value={actionOption.value}>
                {t(actionOption.labelKey, {
                  defaultValue: actionOption.label,
                })}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="mt-[18px] inline-flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-[rgba(220,74,74,0.95)]"
          data-testid={`inspector-delete-trigger-${item.key}`}
          onClick={() => removeTrigger(item.key)}
          aria-label={t('inspector.groups.triggers.delete', {
            defaultValue: 'Delete trigger',
          })}
          title={t('inspector.groups.triggers.delete', {
            defaultValue: 'Delete trigger',
          })}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {actionValue === 'navigate' ? (
        <TriggerNavigateFields
          itemKey={item.key}
          toValue={toValue}
          isValidLinkValue={isValidLinkValue}
          replaceValue={replaceValue}
          targetValue={targetValue}
          stateValue={stateValue}
        />
      ) : (
        <TriggerGraphFields
          itemKey={item.key}
          graphMode={graphMode}
          graphName={graphName}
          selectedGraphId={selectedGraphId}
        />
      )}
    </div>
  );
}
