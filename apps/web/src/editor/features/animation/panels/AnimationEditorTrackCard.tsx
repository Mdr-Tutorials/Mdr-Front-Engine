import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type {
  AnimationTrack,
  SvgFilterDefinition,
} from '@/core/types/engine.types';
import {
  CSS_FILTER_FNS,
  CSS_FILTER_UNITS,
  STYLE_PROPERTIES,
  TRACK_KINDS,
  getTrackTitle,
} from '../animationEditorUi';
import { AnimationEditorKeyframesEditor } from './AnimationEditorKeyframesEditor';

type AnimationEditorTrackCardProps = {
  bindingId: string;
  track: AnimationTrack;
  expanded: boolean;
  svgFilters: SvgFilterDefinition[];
  timelineDurationMs: number;
  onToggleExpanded: (trackId: string) => void;
  onDeleteTrack: (bindingId: string, trackId: string) => void;
  onUpdateTrackKind: (
    bindingId: string,
    trackId: string,
    kind: AnimationTrack['kind']
  ) => void;
  onUpdateStyleTrackProperty: (
    bindingId: string,
    trackId: string,
    property: Extract<AnimationTrack, { kind: 'style' }>['property']
  ) => void;
  onUpdateCssTrackFn: (
    bindingId: string,
    trackId: string,
    fn: Extract<AnimationTrack, { kind: 'css-filter' }>['fn']
  ) => void;
  onUpdateCssTrackUnit: (
    bindingId: string,
    trackId: string,
    unit: NonNullable<Extract<AnimationTrack, { kind: 'css-filter' }>['unit']>
  ) => void;
  onUpdateSvgTrackFilter: (
    bindingId: string,
    trackId: string,
    filterId: string
  ) => void;
  onUpdateSvgTrackPrimitive: (
    bindingId: string,
    trackId: string,
    primitiveId: string
  ) => void;
  onUpdateSvgTrackAttr: (
    bindingId: string,
    trackId: string,
    attr: string
  ) => void;
  onAddKeyframe: (bindingId: string, trackId: string) => void;
  onDeleteKeyframe: (bindingId: string, trackId: string, index: number) => void;
  onUpdateKeyframeAtMs: (
    bindingId: string,
    trackId: string,
    index: number,
    rawMs: string
  ) => void;
  onUpdateKeyframeValue: (
    bindingId: string,
    trackId: string,
    index: number,
    rawValue: string
  ) => void;
  onUpdateKeyframeEasing: (
    bindingId: string,
    trackId: string,
    index: number,
    easing: string
  ) => void;
  onUpdateKeyframeHold: (
    bindingId: string,
    trackId: string,
    index: number,
    hold: boolean
  ) => void;
};

export const AnimationEditorTrackCard = ({
  bindingId,
  track,
  expanded,
  svgFilters,
  timelineDurationMs,
  onToggleExpanded,
  onDeleteTrack,
  onUpdateTrackKind,
  onUpdateStyleTrackProperty,
  onUpdateCssTrackFn,
  onUpdateCssTrackUnit,
  onUpdateSvgTrackFilter,
  onUpdateSvgTrackPrimitive,
  onUpdateSvgTrackAttr,
  onAddKeyframe,
  onDeleteKeyframe,
  onUpdateKeyframeAtMs,
  onUpdateKeyframeValue,
  onUpdateKeyframeEasing,
  onUpdateKeyframeHold,
}: AnimationEditorTrackCardProps) => {
  const matchedFilter =
    track.kind === 'svg-filter-attr'
      ? (svgFilters.find((filter) => filter.id === track.filterId) ??
        svgFilters[0])
      : undefined;
  const primitiveOptions = matchedFilter?.primitives ?? [];

  return (
    <section className="rounded border border-black/10 bg-white p-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleExpanded(track.id)}
          className="rounded p-1"
          aria-label={expanded ? 'Collapse track' : 'Expand track'}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <p className="min-w-0 flex-1 truncate text-xs font-medium">
          {getTrackTitle(track)}
        </p>
        <button
          type="button"
          onClick={() => onDeleteTrack(bindingId, track.id)}
          className="rounded p-1"
          aria-label="Delete track"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {expanded ? (
        <div className="mt-2 space-y-2 border-t border-black/8 pt-2">
          <select
            value={track.kind}
            onChange={(event) =>
              onUpdateTrackKind(
                bindingId,
                track.id,
                event.target.value as AnimationTrack['kind']
              )
            }
            className="w-full rounded border border-black/15 px-2 py-1.5 text-sm"
          >
            {TRACK_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>

          {track.kind === 'style' ? (
            <select
              value={track.property}
              onChange={(event) =>
                onUpdateStyleTrackProperty(
                  bindingId,
                  track.id,
                  event.target.value as Extract<
                    AnimationTrack,
                    { kind: 'style' }
                  >['property']
                )
              }
              className="w-full rounded border border-black/15 px-2 py-1.5 text-sm"
            >
              {STYLE_PROPERTIES.map((property) => (
                <option key={property} value={property}>
                  {property}
                </option>
              ))}
            </select>
          ) : null}

          {track.kind === 'css-filter' ? (
            <div className="grid grid-cols-2 gap-2 max-[720px]:grid-cols-1">
              <select
                value={track.fn}
                onChange={(event) =>
                  onUpdateCssTrackFn(
                    bindingId,
                    track.id,
                    event.target.value as Extract<
                      AnimationTrack,
                      { kind: 'css-filter' }
                    >['fn']
                  )
                }
                className="rounded border border-black/15 px-2 py-1.5 text-sm"
              >
                {CSS_FILTER_FNS.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
              <select
                value={track.unit ?? 'px'}
                onChange={(event) =>
                  onUpdateCssTrackUnit(
                    bindingId,
                    track.id,
                    event.target.value as NonNullable<
                      Extract<AnimationTrack, { kind: 'css-filter' }>['unit']
                    >
                  )
                }
                className="rounded border border-black/15 px-2 py-1.5 text-sm"
              >
                {CSS_FILTER_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {track.kind === 'svg-filter-attr' ? (
            <div className="grid grid-cols-3 gap-2 max-[900px]:grid-cols-1">
              <select
                value={track.filterId}
                onChange={(event) =>
                  onUpdateSvgTrackFilter(
                    bindingId,
                    track.id,
                    event.target.value
                  )
                }
                className="rounded border border-black/15 px-2 py-1.5 text-sm"
                disabled={svgFilters.length === 0}
              >
                {svgFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.id}
                  </option>
                ))}
              </select>
              <select
                value={track.primitiveId}
                onChange={(event) =>
                  onUpdateSvgTrackPrimitive(
                    bindingId,
                    track.id,
                    event.target.value
                  )
                }
                className="rounded border border-black/15 px-2 py-1.5 text-sm"
                disabled={primitiveOptions.length === 0}
              >
                {primitiveOptions.map((primitive) => (
                  <option key={primitive.id} value={primitive.id}>
                    {primitive.id}
                  </option>
                ))}
              </select>
              <input
                value={track.attr}
                onChange={(event) =>
                  onUpdateSvgTrackAttr(bindingId, track.id, event.target.value)
                }
                className="rounded border border-black/15 px-2 py-1.5 text-sm"
              />
            </div>
          ) : null}

          <AnimationEditorKeyframesEditor
            bindingId={bindingId}
            track={track}
            timelineDurationMs={timelineDurationMs}
            onAddKeyframe={onAddKeyframe}
            onDeleteKeyframe={onDeleteKeyframe}
            onUpdateKeyframeAtMs={onUpdateKeyframeAtMs}
            onUpdateKeyframeValue={onUpdateKeyframeValue}
            onUpdateKeyframeEasing={onUpdateKeyframeEasing}
            onUpdateKeyframeHold={onUpdateKeyframeHold}
          />
        </div>
      ) : null}
    </section>
  );
};
