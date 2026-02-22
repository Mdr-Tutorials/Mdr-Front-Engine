import { Plus, Trash2 } from 'lucide-react';
import type { AnimationTimeline } from '@/core/types/engine.types';

type AnimationEditorTimelinesPanelProps = {
  timelines: AnimationTimeline[];
  activeTimelineId?: string;
  onAddTimeline: () => void;
  onSelectTimeline: (timelineId: string) => void;
  onDeleteTimeline: (timelineId: string) => void;
};

export const AnimationEditorTimelinesPanel = ({
  timelines,
  activeTimelineId,
  onAddTimeline,
  onSelectTimeline,
  onDeleteTimeline,
}: AnimationEditorTimelinesPanelProps) => {
  return (
    <aside className="w-[260px] shrink-0 rounded-2xl border border-black/8 bg-(--color-0) p-3 max-[1280px]:w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-(--color-9)">Timelines</h2>
        <button
          type="button"
          onClick={onAddTimeline}
          className="inline-flex items-center gap-1 rounded border border-black/15 px-2 py-1 text-xs"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      <div className="flex max-h-[70vh] flex-col gap-2 overflow-auto pr-1">
        {timelines.map((timeline, index) => {
          const isActive = timeline.id === activeTimelineId;
          return (
            <div
              key={timeline.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${
                isActive
                  ? 'border-black/20 bg-black text-white'
                  : 'border-black/10 bg-black/[0.015]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectTimeline(timeline.id)}
                className="min-w-0 flex-1 text-left text-sm"
              >
                <span className="block truncate">
                  {timeline.name.trim() || `Timeline ${index + 1}`}
                </span>
                <span className="block text-[11px] opacity-75">
                  {timeline.durationMs}ms
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteTimeline(timeline.id)}
                className={isActive ? 'text-white/80' : 'text-(--color-6)'}
                aria-label="Delete timeline"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
