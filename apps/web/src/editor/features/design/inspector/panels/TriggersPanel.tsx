import { Plus } from 'lucide-react';
import { useInspectorContext } from '@/editor/features/design/inspector/InspectorContext';
import { InspectorTriggerItem } from '@/editor/features/design/inspector/fields/triggers/InspectorTriggerItem';
import type { InspectorPanelDefinition } from './types';

function AddTriggerAction() {
  const { t, addTrigger, expandedPanels, togglePanel } = useInspectorContext();
  const isExpanded = expandedPanels.triggers ?? true;

  return (
    <button
      type="button"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
      data-testid="inspector-add-trigger"
      onClick={() => {
        addTrigger();
        if (!isExpanded) {
          togglePanel('triggers');
        }
      }}
      aria-label={t('inspector.groups.triggers.add', {
        defaultValue: 'Add trigger',
      })}
      title={t('inspector.groups.triggers.add', {
        defaultValue: 'Add trigger',
      })}
    >
      <Plus size={14} />
    </button>
  );
}

function TriggersPanelView() {
  const { t, hasLinkTriggerConflict, triggerEntries } = useInspectorContext();

  return (
    <div className="flex flex-col gap-2 pt-1 pb-1">
      {hasLinkTriggerConflict ? (
        <div
          className="rounded-md border border-[rgba(220,74,74,0.35)] bg-[rgba(220,74,74,0.08)] px-2 py-1.5 text-[10px] text-[rgba(190,60,60,0.95)]"
          role="alert"
        >
          {t('inspector.groups.triggers.linkConflict', {
            defaultValue:
              'This component has a destination and an onClick trigger. Click may run both.',
          })}
        </div>
      ) : null}
      {triggerEntries.length ? (
        triggerEntries.map((item) => (
          <InspectorTriggerItem key={item.key} item={item} />
        ))
      ) : (
        <div className="InspectorDescription text-[10px] text-(--color-6)">
          {t('inspector.groups.triggers.empty', {
            defaultValue:
              'No triggers configured yet. Event bindings will appear here.',
          })}
        </div>
      )}
    </div>
  );
}

export const triggersPanel: InspectorPanelDefinition = {
  key: 'triggers',
  title: 'Triggers',
  tab: 'code',
  match: () => true,
  headerActions: <AddTriggerAction />,
  render: () => <TriggersPanelView />,
};
