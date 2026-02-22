import { ChevronDown, Sparkles } from 'lucide-react';
import { useInspectorSectionContext } from './InspectorSectionContext';

export function InspectorAnimationSection() {
  const {
    t,
    selectedNode,
    expandedSections,
    toggleSection,
    hasAnimationDefinition,
    isAnimationMounted,
    mountedAnimationBindingCount,
    mountSelectedNodeToAnimation,
    unmountSelectedNodeFromAnimation,
    openAnimationEditor,
    canOpenAnimationEditor,
  } = useInspectorSectionContext();

  return (
    <section className="pt-1">
      <div className="flex w-full items-center justify-between gap-1 px-0 py-1">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
          onClick={() => toggleSection('animation')}
        >
          <span className="text-[13px] font-semibold tracking-[0.01em] text-(--color-9)">
            {t('inspector.groups.animation.title', {
              defaultValue: 'Animation Mount',
            })}
          </span>
          <ChevronDown
            size={14}
            className={`${expandedSections.animation ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
          />
        </button>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9) disabled:cursor-not-allowed disabled:opacity-40"
          onClick={openAnimationEditor}
          disabled={!canOpenAnimationEditor}
          aria-label={t('inspector.groups.animation.openEditor', {
            defaultValue: 'Open animation editor',
          })}
          title={t('inspector.groups.animation.openEditor', {
            defaultValue: 'Open animation editor',
          })}
        >
          <Sparkles size={14} />
        </button>
      </div>
      {expandedSections.animation ? (
        <div className="flex flex-col gap-1.5 pb-1 pt-1">
          <div className="px-0 py-0.5 text-[10px] text-(--color-6)">
            {selectedNode?.id ? (
              <>
                {t('inspector.groups.animation.selectedNode', {
                  defaultValue: 'Current node',
                })}
                <span className="font-mono text-(--color-8)">
                  {`: ${selectedNode.id}`}
                </span>
              </>
            ) : (
              t('inspector.groups.animation.noSelection', {
                defaultValue: 'Select a component to mount animation.',
              })
            )}
          </div>
          {!hasAnimationDefinition ? (
            <div className="text-[10px] text-(--color-6)">
              {t('inspector.groups.animation.empty', {
                defaultValue:
                  'No animation yet. Mounting will initialize the animation document.',
              })}
            </div>
          ) : null}
          {selectedNode?.id ? (
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="text-[10px] text-(--color-6)">
                {isAnimationMounted
                  ? t('inspector.groups.animation.mounted', {
                      defaultValue: 'Mounted to animation',
                    })
                  : t('inspector.groups.animation.unmounted', {
                      defaultValue: 'Not mounted',
                    })}
                {isAnimationMounted && mountedAnimationBindingCount > 1 ? (
                  <span className="text-(--color-5)">
                    {t('inspector.groups.animation.bindingCount', {
                      defaultValue: `(${mountedAnimationBindingCount} bindings)`,
                      count: mountedAnimationBindingCount,
                    })}
                  </span>
                ) : null}
              </div>
              {isAnimationMounted ? (
                <button
                  type="button"
                  className="h-6 px-1.5 text-[10px] text-(--color-7) hover:text-(--color-9)"
                  onClick={unmountSelectedNodeFromAnimation}
                >
                  {t('inspector.groups.animation.unmount', {
                    defaultValue: 'Unmount',
                  })}
                </button>
              ) : (
                <button
                  type="button"
                  className="h-6 px-1.5 text-[10px] text-(--color-8) hover:text-(--color-9)"
                  onClick={mountSelectedNodeToAnimation}
                >
                  {t('inspector.groups.animation.mount', {
                    defaultValue: 'Mount',
                  })}
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
