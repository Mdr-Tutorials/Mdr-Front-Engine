import { useCallback } from 'react';
import { ChevronDown, Code, Sparkles } from 'lucide-react';
import { useInspectorSectionContext } from '@/editor/features/design/inspector/sections/InspectorSectionContext';

export function InspectorStyleTab() {
  const {
    t,
    expandedSections,
    toggleSection,
    openMountedCssEditor,
    mountedCssEntries,
    matchedPanels,
    expandedPanels,
    togglePanel,
    hasAnimationDefinition,
    isAnimationMounted,
    mountedAnimationBindingCount,
    mountSelectedNodeToAnimation,
    unmountSelectedNodeFromAnimation,
    openAnimationEditor,
    canOpenAnimationEditor,
    selectedNode,
  } = useInspectorSectionContext();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
      <section className="pt-1">
        <div className="flex w-full items-center justify-between gap-1 px-0 py-1">
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
            onClick={() => toggleSection('style')}
          >
            <span className="text-[13px] font-semibold tracking-[0.01em] text-(--color-9)">
              {t('inspector.groups.style.title', {
                defaultValue: 'Style',
              })}
            </span>
            <ChevronDown
              size={14}
              className={`${expandedSections.style ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
            />
          </button>
          <button
            type="button"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
            onClick={() => openMountedCssEditor()}
            aria-label={t('inspector.groups.style.openMountedCss', {
              defaultValue: 'Open mounted CSS',
            })}
            title={
              mountedCssEntries[0]?.path
                ? `${t('inspector.groups.style.openMountedCss', { defaultValue: 'Open mounted CSS' })}: ${mountedCssEntries[0].path}`
                : t('inspector.groups.style.attachMountedCss', {
                    defaultValue: 'Attach mounted CSS',
                  })
            }
            data-testid="inspector-style-open-mounted-css"
          >
            <Code size={14} />
          </button>
        </div>
        {expandedSections.style && (
          <div className="flex flex-col gap-2 pt-1 pb-1">
            {matchedPanels.map((panel) => {
              const isExpanded = expandedPanels[panel.key] ?? true;
              const panelTitle = t(`inspector.panels.${panel.key}.title`, {
                defaultValue: panel.title,
              });
              return (
                <div key={panel.key} className="pt-1">
                  <button
                    type="button"
                    className="flex min-h-5.5 w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
                    onClick={() => togglePanel(panel.key)}
                  >
                    <span className="InspectorLabel text-[11px] font-semibold text-(--color-8)">
                      {panelTitle}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`${isExpanded ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-1">
                      {panel.render({
                        node: selectedNode!,
                        updateNode: t as any, // placeholder — will be fixed in Phase 2
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

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
        {expandedSections.animation && (
          <div className="flex flex-col gap-1.5 pt-1 pb-1">
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
        )}
      </section>
    </div>
  );
}