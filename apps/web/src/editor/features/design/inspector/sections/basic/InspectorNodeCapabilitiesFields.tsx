import { Code } from 'lucide-react';
import { InspectorRow } from '../../components/InspectorRow';
import { LinkBasicsFields } from '../../components/LinkBasicsFields';
import { ClassProtocolEditor } from '../../classProtocol/ClassProtocolEditor';
import { useInspectorSectionContext } from '../InspectorSectionContext';

export function InspectorNodeCapabilitiesFields() {
  const {
    t,
    projectId,
    supportsClassProtocol,
    classNameValue,
    mountedCssEntries,
    openMountedCssEditor,
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
    <>
      {supportsClassProtocol ? (
        <div className="InspectorField flex flex-col gap-1.5">
          <InspectorRow
            label={t('inspector.fields.className.label', {
              defaultValue: 'Class Name',
            })}
            control={
              <ClassProtocolEditor
                projectId={projectId}
                value={classNameValue}
                placeholder="e.g. p-4 flex items-center"
                inputTestId="inspector-classname-input"
                mountedCssEntries={mountedCssEntries}
                onOpenMountedCss={(target) => {
                  openMountedCssEditor(target);
                }}
                onChange={(value) => {
                  updateSelectedNode((current: any) => ({
                    ...current,
                    props: {
                      ...(current.props ?? {}),
                      className: value,
                    },
                  }));
                }}
              />
            }
          />
        </div>
      ) : null}
      {isIconNode && (
        <div className="InspectorField flex flex-col gap-1.5">
          <InspectorRow
            label={t('inspector.fields.icon.label', {
              defaultValue: 'Icon',
            })}
            control={
              <div className="flex w-full items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-7 min-w-0 flex-1 cursor-pointer items-center justify-start gap-2 rounded-md border border-black/10 bg-transparent px-2 text-left text-xs text-(--color-8) dark:border-white/16"
                  onClick={() => setIconPickerOpen(true)}
                  data-testid="inspector-open-icon-picker"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center text-(--color-9)">
                    {SelectedIconComponent ? (
                      <SelectedIconComponent size={14} />
                    ) : null}
                  </span>
                  <span className="truncate">
                    {selectedIconRef
                      ? `${selectedIconRef.provider}:${selectedIconRef.name}`
                      : t('inspector.fields.icon.empty', {
                          defaultValue: 'No icon selected',
                        })}
                  </span>
                </button>
              </div>
            }
          />
        </div>
      )}
      {linkPropKey ? (
        <LinkBasicsFields
          destination={linkDestination}
          target={linkTarget as '_self' | '_blank'}
          rel={linkRel}
          title={linkTitle}
          t={t}
          onChangeDestination={(value) => {
            updateSelectedNode((current: any) => ({
              ...current,
              props: {
                ...(current.props ?? {}),
                [linkPropKey]: value,
              },
            }));
          }}
          onChangeTarget={(value) => {
            updateSelectedNode((current: any) => ({
              ...current,
              props: {
                ...(current.props ?? {}),
                [targetPropKey]: value,
              },
            }));
          }}
          onChangeRel={(value) => {
            updateSelectedNode((current: any) => ({
              ...current,
              props: {
                ...(current.props ?? {}),
                [relPropKey]: value,
              },
            }));
          }}
          onChangeTitle={(value) => {
            updateSelectedNode((current: any) => ({
              ...current,
              props: {
                ...(current.props ?? {}),
                [titlePropKey]: value,
              },
            }));
          }}
        />
      ) : null}
    </>
  );
}
