import { useInspectorSectionContext } from '@/editor/features/design/inspector/sections/InspectorSectionContext';

type TriggerNavigateFieldsProps = {
  itemKey: string;
  toValue: string;
  isValidLinkValue: boolean;
  replaceValue: boolean;
  targetValue: string;
  stateValue: string;
};

export function TriggerNavigateFields({
  itemKey,
  toValue,
  isValidLinkValue,
  replaceValue,
  targetValue,
  stateValue,
}: TriggerNavigateFieldsProps) {
  const { t, updateTrigger } = useInspectorSectionContext();

  return (
    <>
      <div className="grid gap-1">
        <span className="text-[10px] font-semibold text-(--color-7)">
          {t('inspector.groups.triggers.toLabel', {
            defaultValue: 'Destination',
          })}
        </span>
        <input
          className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
          value={toValue}
          title={t('inspector.groups.triggers.toHelp', {
            defaultValue:
              'Use https:// for external links, or /path for in-app preview routes.',
          })}
          onChange={(event) => {
            updateTrigger(itemKey, (currentEvent: any) => ({
              ...currentEvent,
              action: 'navigate',
              params: {
                ...(currentEvent.params ?? {}),
                to: event.target.value,
              },
            }));
          }}
          placeholder={t('inspector.groups.triggers.toPlaceholder', {
            defaultValue: 'https://example.com',
          })}
        />
        {!isValidLinkValue && (
          <span className="text-[10px] text-[rgba(220,74,74,0.9)]">
            {t('inspector.groups.triggers.httpsOnly', {
              defaultValue:
                'Use https:// for external links or /path for internal links.',
            })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <label
          className="inline-flex items-center gap-1 text-[11px] text-(--color-7)"
          title={t('inspector.groups.triggers.replaceHelp', {
            defaultValue:
              'When enabled, this navigation replaces the current history entry.',
          })}
        >
          <input
            type="checkbox"
            checked={replaceValue}
            onChange={(event) => {
              updateTrigger(itemKey, (currentEvent: any) => ({
                ...currentEvent,
                action: 'navigate',
                params: {
                  ...(currentEvent.params ?? {}),
                  replace: event.target.checked,
                },
              }));
            }}
          />
          {t('inspector.groups.triggers.replace', {
            defaultValue: 'Replace',
          })}
        </label>
        <select
          className="h-7 min-w-0 w-24 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
          value={targetValue}
          title={t('inspector.groups.triggers.targetHelp', {
            defaultValue: 'Browser tab target used by navigation actions.',
          })}
          onChange={(event) => {
            updateTrigger(itemKey, (currentEvent: any) => ({
              ...currentEvent,
              action: 'navigate',
              params: {
                ...(currentEvent.params ?? {}),
                target: event.target.value,
              },
            }));
          }}
        >
          <option value="_self">
            {t('inspector.groups.triggers.targets.self', {
              defaultValue: '_self',
            })}
          </option>
          <option value="_blank">
            {t('inspector.groups.triggers.targets.blank', {
              defaultValue: '_blank',
            })}
          </option>
        </select>
        <input
          className="h-7 min-w-0 flex-1 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
          value={stateValue}
          title={t('inspector.groups.triggers.stateHelp', {
            defaultValue:
              'Optional navigation state. Plain text or JSON string.',
          })}
          onChange={(event) => {
            updateTrigger(itemKey, (currentEvent: any) => ({
              ...currentEvent,
              action: 'navigate',
              params: {
                ...(currentEvent.params ?? {}),
                state: event.target.value,
              },
            }));
          }}
          placeholder={t('inspector.groups.triggers.statePlaceholder', {
            defaultValue: 'state (optional JSON)',
          })}
        />
      </div>
    </>
  );
}
