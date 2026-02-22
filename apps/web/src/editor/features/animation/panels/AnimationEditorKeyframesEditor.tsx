import type {
  AnimationKeyframe,
  AnimationTrack,
} from '@/core/types/engine.types';
import { isHexColor } from '../animationEditorUi';

type AnimationEditorKeyframesEditorProps = {
  bindingId: string;
  track: AnimationTrack;
  timelineDurationMs: number;
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

const getKeyframeValueText = (keyframe: AnimationKeyframe) =>
  typeof keyframe.value === 'number' ? String(keyframe.value) : keyframe.value;

export const AnimationEditorKeyframesEditor = ({
  bindingId,
  track,
  timelineDurationMs,
  onAddKeyframe,
  onDeleteKeyframe,
  onUpdateKeyframeAtMs,
  onUpdateKeyframeValue,
  onUpdateKeyframeEasing,
  onUpdateKeyframeHold,
}: AnimationEditorKeyframesEditorProps) => {
  const isColorTrack = track.kind === 'style' && track.property === 'color';

  return (
    <div className="rounded border border-black/8 bg-black/[0.015] p-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium">Keyframes</p>
        <button
          type="button"
          onClick={() => onAddKeyframe(bindingId, track.id)}
          className="inline-flex items-center gap-1 rounded border border-black/15 px-2 py-1 text-[11px]"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {track.keyframes.map((keyframe, index) => (
          <div
            key={`${track.id}-${keyframe.atMs}-${index}`}
            className="grid grid-cols-[84px_minmax(120px,1fr)_minmax(120px,1fr)_auto_auto] items-center gap-2 max-[900px]:grid-cols-1"
          >
            <input
              type="number"
              min={0}
              max={timelineDurationMs}
              value={keyframe.atMs}
              onChange={(event) =>
                onUpdateKeyframeAtMs(
                  bindingId,
                  track.id,
                  index,
                  event.target.value
                )
              }
              className="rounded border border-black/15 px-2 py-1 text-xs"
            />
            {isColorTrack ? (
              <input
                type="color"
                value={isHexColor(keyframe.value) ? keyframe.value : '#111111'}
                onChange={(event) =>
                  onUpdateKeyframeValue(
                    bindingId,
                    track.id,
                    index,
                    event.target.value
                  )
                }
                className="h-8 rounded border border-black/15 p-1"
              />
            ) : (
              <input
                value={getKeyframeValueText(keyframe)}
                onChange={(event) =>
                  onUpdateKeyframeValue(
                    bindingId,
                    track.id,
                    index,
                    event.target.value
                  )
                }
                className="rounded border border-black/15 px-2 py-1 text-xs"
              />
            )}
            <input
              value={keyframe.easing ?? ''}
              onChange={(event) =>
                onUpdateKeyframeEasing(
                  bindingId,
                  track.id,
                  index,
                  event.target.value
                )
              }
              placeholder="easing"
              className="rounded border border-black/15 px-2 py-1 text-xs"
            />
            <label className="inline-flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={Boolean(keyframe.hold)}
                onChange={(event) =>
                  onUpdateKeyframeHold(
                    bindingId,
                    track.id,
                    index,
                    event.target.checked
                  )
                }
              />
              Hold
            </label>
            <button
              type="button"
              onClick={() => onDeleteKeyframe(bindingId, track.id, index)}
              disabled={track.keyframes.length <= 1}
              className="rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-50"
            >
              Del
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
