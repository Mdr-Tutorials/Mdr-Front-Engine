import { ChevronDown, Plus } from 'lucide-react';
import { useInspectorSectionContext } from './InspectorSectionContext';
import { InspectorTriggerItem } from './triggers/InspectorTriggerItem';

export function InspectorTriggersSection() {
  const {
    t,
    expandedSections,
    toggleSection,
    addTrigger,
    hasLinkTriggerConflict,
    triggerEntries,
  } = useInspectorSectionContext();

  return (
    <section className="pt-1">
      <div className="flex w-full items-center justify-between gap-1 px-0 py-1">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
          onClick={() => toggleSection('triggers')}
        >
          <span className="text-[13px] font-semibold tracking-[0.01em] text-(--color-9)">
            {t('inspector.groups.triggers.title', {
              defaultValue: 'Triggers',
            })}
          </span>
          <ChevronDown
            size={14}
            className={`${expandedSections.triggers ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
          />
        </button>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
          data-testid="inspector-add-trigger"
          onClick={() => {
            addTrigger();
            if (!expandedSections.triggers) {
              toggleSection('triggers');
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
      </div>
      {expandedSections.triggers && (
        <div className="flex flex-col gap-2 pb-1 pt-1">
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
            triggerEntries.map((item: any) => (
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
      )}
    </section>
  );
}
