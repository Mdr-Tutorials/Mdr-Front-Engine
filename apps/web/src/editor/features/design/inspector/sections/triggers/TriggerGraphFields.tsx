import { useInspectorSectionContext } from '../InspectorSectionContext';

type TriggerGraphFieldsProps = {
  itemKey: string;
  graphMode: 'new' | 'existing';
  graphName: string;
  selectedGraphId: string;
};

export function TriggerGraphFields({
  itemKey,
  graphMode,
  graphName,
  selectedGraphId,
}: TriggerGraphFieldsProps) {
  const { t, updateTrigger, graphOptions } = useInspectorSectionContext();

  return (
    <div className="grid gap-1 rounded-md border border-black/8 p-2 dark:border-white/14">
      <div className="inline-flex gap-1">
        <button
          type="button"
          className={`h-6 rounded-md border px-2 text-[11px] ${graphMode === 'new' ? 'border-black/18 text-(--color-9)' : 'border-transparent text-(--color-6)'}`}
          title={t('inspector.groups.triggers.graph.newHelp', {
            defaultValue: 'Create and execute a new node graph.',
          })}
          onClick={() => {
            updateTrigger(itemKey, (currentEvent: any) => ({
              ...currentEvent,
              params: {
                ...(currentEvent.params ?? {}),
                graphMode: 'new',
              },
            }));
          }}
        >
          {t('inspector.groups.triggers.graph.new', {
            defaultValue: 'New Graph',
          })}
        </button>
        <button
          type="button"
          className={`h-6 rounded-md border px-2 text-[11px] ${graphMode === 'existing' ? 'border-black/18 text-(--color-9)' : 'border-transparent text-(--color-6)'}`}
          title={t('inspector.groups.triggers.graph.selectHelp', {
            defaultValue: 'Run one of the existing node graphs.',
          })}
          onClick={() => {
            updateTrigger(itemKey, (currentEvent: any) => ({
              ...currentEvent,
              params: {
                ...(currentEvent.params ?? {}),
                graphMode: 'existing',
              },
            }));
          }}
        >
          {t('inspector.groups.triggers.graph.select', {
            defaultValue: 'Select Graph',
          })}
        </button>
      </div>
      {graphMode === 'new' ? (
        <input
          className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
          value={graphName}
          title={t('inspector.groups.triggers.graph.nameHelp', {
            defaultValue: 'Name for the new node graph to be created.',
          })}
          onChange={(event) => {
            updateTrigger(itemKey, (currentEvent: any) => ({
              ...currentEvent,
              params: {
                ...(currentEvent.params ?? {}),
                graphName: event.target.value,
              },
            }));
          }}
          placeholder={t('inspector.groups.triggers.graph.namePlaceholder', {
            defaultValue: 'New graph name',
          })}
        />
      ) : (
        <select
          className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
          value={selectedGraphId}
          title={t('inspector.groups.triggers.graph.selectHelp', {
            defaultValue: 'Run one of the existing node graphs.',
          })}
          onChange={(event) => {
            updateTrigger(itemKey, (currentEvent: any) => ({
              ...currentEvent,
              params: {
                ...(currentEvent.params ?? {}),
                graphId: event.target.value,
              },
            }));
          }}
        >
          {graphOptions.length ? (
            graphOptions.map((option: any) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))
          ) : (
            <option value="">
              {t('inspector.groups.triggers.graph.empty', {
                defaultValue: 'No graph available',
              })}
            </option>
          )}
        </select>
      )}
    </div>
  );
}
