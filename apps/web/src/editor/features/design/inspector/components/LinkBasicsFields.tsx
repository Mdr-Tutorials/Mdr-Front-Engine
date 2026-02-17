import { InspectorRow } from './InspectorRow';

type LinkBasicsFieldsProps = {
  destination: string;
  target: '_self' | '_blank';
  rel: string;
  title: string;
  onChangeDestination: (value: string) => void;
  onChangeTarget: (value: '_self' | '_blank') => void;
  onChangeRel: (value: string) => void;
  onChangeTitle: (value: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function LinkBasicsFields({
  destination,
  target,
  rel,
  title,
  onChangeDestination,
  onChangeTarget,
  onChangeRel,
  onChangeTitle,
  t,
}: LinkBasicsFieldsProps) {
  return (
    <>
      <div className="InspectorField flex flex-col gap-1.5">
        <InspectorRow
          label={t('inspector.fields.link.destination', {
            defaultValue: 'Destination',
          })}
          control={
            <input
              className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
              value={destination}
              onChange={(event) => onChangeDestination(event.target.value)}
              placeholder={t('inspector.fields.link.destinationPlaceholder', {
                defaultValue: '/path or https://example.com',
              })}
            />
          }
        />
      </div>
      <div className="InspectorField flex flex-col gap-1.5">
        <InspectorRow
          label={t('inspector.fields.link.target', {
            defaultValue: 'Target',
          })}
          control={
            <select
              className="h-7 min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
              value={target}
              onChange={(event) =>
                onChangeTarget(event.target.value as '_self' | '_blank')
              }
            >
              <option value="_self">_self</option>
              <option value="_blank">_blank</option>
            </select>
          }
        />
      </div>
      <div className="InspectorField flex flex-col gap-1.5">
        <InspectorRow
          label={t('inspector.fields.link.rel', {
            defaultValue: 'Rel',
          })}
          control={
            <input
              className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
              value={rel}
              onChange={(event) => onChangeRel(event.target.value)}
              placeholder={t('inspector.fields.link.relPlaceholder', {
                defaultValue: 'noopener noreferrer',
              })}
            />
          }
        />
      </div>
      <div className="InspectorField flex flex-col gap-1.5">
        <InspectorRow
          label={t('inspector.fields.link.title', {
            defaultValue: 'Title',
          })}
          control={
            <input
              className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
              value={title}
              onChange={(event) => onChangeTitle(event.target.value)}
              placeholder={t('inspector.fields.link.titlePlaceholder', {
                defaultValue: 'Open docs',
              })}
            />
          }
        />
      </div>
    </>
  );
}
