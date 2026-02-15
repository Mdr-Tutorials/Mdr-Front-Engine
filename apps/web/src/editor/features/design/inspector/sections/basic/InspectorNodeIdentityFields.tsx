import { AlertTriangle, Check, Type, WandSparkles } from 'lucide-react';
import { MdrInput, MdrRichTextEditor } from '@mdr/ui';
import { InspectorRow } from '../../components/InspectorRow';
import { getTextFieldLabel } from '../../../BlueprintEditorInspector.utils';
import {
  getNodeTextFieldMode,
  updateNodeTextField,
  updateNodeTextFieldMode,
} from '../../../blueprintText';
import { useInspectorSectionContext } from '../InspectorSectionContext';

export function InspectorNodeIdentityFields() {
  const {
    t,
    draftId,
    setDraftId,
    applyRename,
    selectedNode,
    isDirty,
    canApply,
    isDuplicate,
    primaryTextField,
    updateSelectedNode,
  } = useInspectorSectionContext();

  return (
    <>
      <div className="InspectorField flex flex-col gap-1.5">
        <InspectorRow
          label={t('inspector.fields.id.label', {
            defaultValue: 'Component ID',
          })}
          control={
            <div className="InspectorInputRow group flex w-full items-center gap-1">
              <MdrInput
                size="Small"
                value={draftId}
                dataAttributes={{
                  'data-testid': 'inspector-id-input',
                }}
                onChange={(value) => setDraftId(value)}
                onBlur={applyRename}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyRename();
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setDraftId(selectedNode.id);
                  }
                }}
              />
              {isDirty && (
                <div className="InspectorFieldActions inline-flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    type="button"
                    className="InspectorFieldAction inline-flex items-center justify-center rounded-full border-0 bg-transparent px-1 py-0.5 text-(--color-6) hover:text-(--color-9) disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={applyRename}
                    disabled={!canApply}
                    aria-label={t('inspector.actions.apply', {
                      defaultValue: 'Apply',
                    })}
                    title={t('inspector.actions.apply', {
                      defaultValue: 'Apply',
                    })}
                  >
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>
          }
        />
        {isDuplicate && (
          <div
            className="InspectorWarning inline-flex items-center gap-1 text-[10px] text-[rgba(220,74,74,0.9)]"
            role="alert"
          >
            <AlertTriangle size={12} />
            <span>
              {t('inspector.fields.id.duplicate', {
                defaultValue: 'ID already exists.',
              })}
            </span>
          </div>
        )}
      </div>
      {primaryTextField ? (
        <div className="InspectorField flex flex-col gap-1.5">
          <InspectorRow
            label={getTextFieldLabel(primaryTextField.key, t)}
            control={
              primaryTextField.key === 'text' &&
              getNodeTextFieldMode(selectedNode, 'text') === 'rich' ? (
                <div className="flex w-full flex-col gap-1.5">
                  <div className="inline-flex items-center justify-end">
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent text-(--color-7) hover:text-(--color-9)"
                      title={t('inspector.panels.text.switchToPlain', {
                        defaultValue: 'Switch to plain text input',
                      })}
                      aria-label={t('inspector.panels.text.switchToPlain', {
                        defaultValue: 'Switch to plain text input',
                      })}
                      onClick={() => {
                        updateSelectedNode((current: any) =>
                          updateNodeTextFieldMode(current, 'text', 'plain')
                        );
                      }}
                    >
                      <Type size={12} />
                    </button>
                  </div>
                  <MdrRichTextEditor
                    className="w-full"
                    value={primaryTextField.value}
                    onChange={(value) => {
                      updateSelectedNode((current: any) =>
                        updateNodeTextField(current, primaryTextField, value)
                      );
                    }}
                  />
                </div>
              ) : (
                <div className="InspectorInputRow InspectorSingleInput relative flex w-full items-center">
                  <MdrInput
                    size="Small"
                    className={
                      primaryTextField.key === 'text' ? 'pr-8' : undefined
                    }
                    value={primaryTextField.value}
                    onChange={(value) => {
                      updateSelectedNode((current: any) =>
                        updateNodeTextField(current, primaryTextField, value)
                      );
                    }}
                  />
                  {primaryTextField.key === 'text' ? (
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border-0 bg-transparent text-(--color-7) hover:text-(--color-9)"
                      title={t('inspector.panels.text.switchToRich', {
                        defaultValue:
                          'Switch to rich text editor (bold/italic/color/size)',
                      })}
                      aria-label={t('inspector.panels.text.switchToRich', {
                        defaultValue:
                          'Switch to rich text editor (bold/italic/color/size)',
                      })}
                      onClick={() => {
                        updateSelectedNode((current: any) =>
                          updateNodeTextFieldMode(current, 'text', 'rich')
                        );
                      }}
                    >
                      <WandSparkles size={12} />
                    </button>
                  ) : null}
                </div>
              )
            }
          />
        </div>
      ) : null}
    </>
  );
}
