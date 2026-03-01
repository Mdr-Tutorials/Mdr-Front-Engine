import { ChevronDown, Code } from 'lucide-react';
import { InspectorRow } from '@/editor/features/design/inspector/components/InspectorRow';
import { LinkBasicsFields } from '@/editor/features/design/inspector/components/LinkBasicsFields';
import { ClassProtocolEditor } from '@/editor/features/design/inspector/classProtocol/ClassProtocolEditor';
import { useInspectorSectionContext } from './InspectorSectionContext';

export function InspectorStyleSection() {
  const {
    t,
    expandedSections,
    toggleSection,
    openMountedCssEditor,
    mountedCssEntries,
    matchedPanels,
    expandedPanels,
    togglePanel,
    supportsClassProtocol,
    classNameValue,
    selectedNode,
    updateSelectedNode,
    isIconNode,
    SelectedIconComponent,
    selectedIconRef,
    setIconPickerOpen,
    linkPropKey,
    linkDestination,
    linkTarget,
    linkRel,
    linkTitle,
    targetPropKey,
    relPropKey,
    titlePropKey,
  } = useInspectorSectionContext();

  return (
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
          onClick={() => {
            openMountedCssEditor();
          }}
          aria-label={t('inspector.groups.style.openMountedCss', {
            defaultValue: 'Open mounted CSS',
          })}
          title={
            mountedCssEntries[0]?.path
              ? `${t('inspector.groups.style.openMountedCss', {
                  defaultValue: 'Open mounted CSS',
                })}: ${mountedCssEntries[0].path}`
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
        <div className="flex flex-col gap-2 pb-1 pt-1">
          {matchedPanels.length ? (
            matchedPanels.map((panel) => {
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
                  {isExpanded ? (
                    <div className="mt-1">
                      {panel.render({
                        node: selectedNode,
                        updateNode: updateSelectedNode,
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="InspectorDescription text-[10px] text-(--color-6)">
              {t('inspector.groups.style.empty', {
                defaultValue: 'No style settings for this component.',
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
