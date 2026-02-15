import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Type, WandSparkles } from 'lucide-react';
import { MdrInput, MdrRichTextEditor } from '@mdr/ui';
import type {
  InspectorPanelDefinition,
  InspectorPanelRenderProps,
} from './types';
import { InspectorRow } from '../components/InspectorRow';
import {
  getEditableTextFields,
  getNodeTextFieldMode,
  updateNodeTextField,
  updateNodeTextFieldMode,
  type TextFieldKey,
} from '../../blueprintText';

const getFieldLabel = (
  key: TextFieldKey,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  switch (key) {
    case 'title':
      return t('inspector.panels.text.fields.title', {
        defaultValue: 'Title',
      });
    case 'label':
      return t('inspector.panels.text.fields.label', {
        defaultValue: 'Label',
      });
    case 'description':
      return t('inspector.panels.text.fields.description', {
        defaultValue: 'Description',
      });
    case 'text':
    default:
      return t('inspector.panels.text.fields.text', {
        defaultValue: 'Text',
      });
  }
};

function TextPanelView({ node, updateNode }: InspectorPanelRenderProps) {
  const { t } = useTranslation('blueprint');
  const fields = useMemo(() => getEditableTextFields(node), [node]);
  const shouldShowHeader = fields.length > 1;

  const renderTextControl = (field: (typeof fields)[number]) => {
    const mode = getNodeTextFieldMode(node, field.key);
    if (field.key === 'text' && mode === 'rich') {
      return (
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
                updateNode((current) =>
                  updateNodeTextFieldMode(current, field.key, 'plain')
                );
              }}
            >
              <Type size={12} />
            </button>
          </div>
          <MdrRichTextEditor
            className="w-full"
            value={field.value}
            onChange={(value) => {
              updateNode((current) =>
                updateNodeTextField(current, field, value)
              );
            }}
          />
        </div>
      );
    }

    return (
      <div className="InspectorInputRow InspectorSingleInput relative flex w-full items-center">
        <MdrInput
          size="Small"
          className={field.key === 'text' ? 'pr-8' : undefined}
          value={field.value}
          onChange={(value) => {
            updateNode((current) => updateNodeTextField(current, field, value));
          }}
        />
        {field.key === 'text' ? (
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
              updateNode((current) =>
                updateNodeTextFieldMode(current, field.key, 'rich')
              );
            }}
          >
            <WandSparkles size={12} />
          </button>
        ) : null}
      </div>
    );
  };

  if (!shouldShowHeader && fields.length === 1) {
    const field = fields[0];
    const isDefaultTextField = field.key === 'text';
    return (
      <div className="InspectorSection flex flex-col gap-2">
        <div className="InspectorField flex flex-col gap-1.5">
          {isDefaultTextField ? (
            renderTextControl(field)
          ) : (
            <InspectorRow
              label={getFieldLabel(field.key, t)}
              control={renderTextControl(field)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="InspectorSection flex flex-col gap-2">
      {shouldShowHeader ? (
        <div className="InspectorField flex flex-col gap-1.5">
          <div className="InspectorFieldHeader flex items-center gap-1.5">
            <span className="InspectorLabel text-[11px] font-semibold text-(--color-8)">
              {t('inspector.panels.text.title', {
                defaultValue: 'Text',
              })}
            </span>
            <span className="InspectorDescription text-[10px] text-(--color-6)">
              {t('inspector.panels.text.description', {
                defaultValue: 'Edit the content shown by this component.',
              })}
            </span>
          </div>
        </div>
      ) : null}

      {fields.map((field) => (
        <div
          key={`${field.kind}-${field.key}`}
          className="InspectorField flex flex-col gap-1.5"
        >
          <InspectorRow
            label={getFieldLabel(field.key, t)}
            control={renderTextControl(field)}
          />
        </div>
      ))}
    </div>
  );
}

export const textPanel: InspectorPanelDefinition = {
  key: 'text',
  title: 'Text',
  description: 'Text content',
  match: (node) => getEditableTextFields(node).length > 0,
  render: (props) => <TextPanelView {...props} />,
};
