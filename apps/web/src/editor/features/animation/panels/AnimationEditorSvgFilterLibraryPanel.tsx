import { Plus } from 'lucide-react';
import type { SvgFilterDefinition } from '@/core/types/engine.types';
import { SVG_TYPES, SVG_UNITS } from '../animationEditorUi';

type AnimationEditorSvgFilterLibraryPanelProps = {
  svgFilters: SvgFilterDefinition[];
  canRemoveSvgFilter: boolean;
  onAddSvgFilter: () => void;
  onDeleteSvgFilter: (filterId: string) => void;
  onUpdateSvgFilterUnits: (
    filterId: string,
    units: NonNullable<SvgFilterDefinition['units']> | undefined
  ) => void;
  onAddSvgPrimitive: (filterId: string) => void;
  onDeleteSvgPrimitive: (filterId: string, primitiveId: string) => void;
  onUpdateSvgPrimitiveType: (
    filterId: string,
    primitiveId: string,
    type: SvgFilterDefinition['primitives'][number]['type']
  ) => void;
};

export const AnimationEditorSvgFilterLibraryPanel = ({
  svgFilters,
  canRemoveSvgFilter,
  onAddSvgFilter,
  onDeleteSvgFilter,
  onUpdateSvgFilterUnits,
  onAddSvgPrimitive,
  onDeleteSvgPrimitive,
  onUpdateSvgPrimitiveType,
}: AnimationEditorSvgFilterLibraryPanelProps) => {
  return (
    <aside className="w-[340px] shrink-0 rounded-2xl border border-black/8 bg-(--color-0) p-4 max-[1280px]:w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">SVG Filter Library</h2>
        <button
          type="button"
          onClick={onAddSvgFilter}
          className="inline-flex items-center gap-1 rounded border border-black/15 px-2 py-1 text-xs"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
        {svgFilters.map((filter) => (
          <article
            key={filter.id}
            className="rounded-lg border border-black/10 bg-black/[0.015] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold">{filter.id}</p>
              <button
                type="button"
                onClick={() => onDeleteSvgFilter(filter.id)}
                disabled={!canRemoveSvgFilter}
                className="rounded border border-black/15 px-1.5 py-0.5 text-[11px] disabled:opacity-50"
              >
                Delete
              </button>
            </div>

            <select
              value={filter.units ?? ''}
              onChange={(event) =>
                onUpdateSvgFilterUnits(
                  filter.id,
                  event.target.value
                    ? (event.target.value as NonNullable<
                        SvgFilterDefinition['units']
                      >)
                    : undefined
                )
              }
              className="mt-2 w-full rounded border border-black/15 px-2 py-1 text-xs"
            >
              <option value="">default</option>
              {SVG_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>

            <div className="mt-2 space-y-2">
              {filter.primitives.map((primitive) => (
                <div
                  key={primitive.id}
                  className="rounded border border-black/10 bg-white p-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px]">{primitive.id}</p>
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteSvgPrimitive(filter.id, primitive.id)
                      }
                      disabled={filter.primitives.length <= 1}
                      className="rounded border border-black/15 px-1.5 py-0.5 text-[10px] disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                  <select
                    value={primitive.type}
                    onChange={(event) =>
                      onUpdateSvgPrimitiveType(
                        filter.id,
                        primitive.id,
                        event.target.value as (typeof SVG_TYPES)[number]
                      )
                    }
                    className="w-full rounded border border-black/15 px-2 py-1 text-xs"
                  >
                    {SVG_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onAddSvgPrimitive(filter.id)}
                className="inline-flex items-center gap-1 rounded border border-black/15 px-2 py-1 text-[11px]"
              >
                <Plus size={10} />
                Add primitive
              </button>
            </div>
          </article>
        ))}
        {svgFilters.length === 0 ? (
          <div className="rounded border border-dashed border-black/15 px-3 py-6 text-center text-sm text-(--color-6)">
            No SVG filters yet.
          </div>
        ) : null}
      </div>
    </aside>
  );
};
