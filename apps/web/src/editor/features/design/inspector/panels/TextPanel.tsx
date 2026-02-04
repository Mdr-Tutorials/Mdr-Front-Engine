import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdrInput } from '@mdr/ui';
import type {
  InspectorPanelDefinition,
  InspectorPanelRenderProps,
} from './types';
import { InspectorRow } from '../components/InspectorRow';
import {
  getEditableTextFields,
  updateNodeTextField,
  type TextFieldKey,
} from '../../blueprintText';

const getFieldLabel = (
  key: TextFieldKey,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  switch (key) {
    case 'title':
      return t('inspector.panels.text.fields.title', { defaultValue: 'Title' });
    case 'label':
      return t('inspector.panels.text.fields.label', { defaultValue: 'Label' });
    case 'description':
      return t('inspector.panels.text.fields.description', {
        defaultValue: 'Description',
      });
    case 'text':
    default:
      return t('inspector.panels.text.fields.text', { defaultValue: 'Text' });
  }
};

function TextPanelView({ node, updateNode }: InspectorPanelRenderProps) {
  const { t } = useTranslation('blueprint');
  const fields = useMemo(() => getEditableTextFields(node), [node]);
  const shouldShowHeader = fields.length > 1;

  if (!shouldShowHeader && fields.length === 1) {
    const field = fields[0];
    return (
      <div className="InspectorSection">
        <div className="InspectorField">
          <div className="InspectorInputRow InspectorSingleInput">
            <MdrInput
              size="Small"
              value={field.value}
              onChange={(value) => {
                updateNode((current) =>
                  updateNodeTextField(current, field, value)
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="InspectorSection">
      {shouldShowHeader ? (
        <div className="InspectorField">
          <div className="InspectorFieldHeader">
            <span className="InspectorLabel">
              {t('inspector.panels.text.title', { defaultValue: 'Text' })}
            </span>
            <span className="InspectorDescription">
              {t('inspector.panels.text.description', {
                defaultValue: 'Edit the content shown by this component.',
              })}
            </span>
          </div>
        </div>
      ) : null}

      {fields.map((field) => (
        <div key={`${field.kind}-${field.key}`} className="InspectorField">
          <InspectorRow
            label={getFieldLabel(field.key, t)}
            control={
              <MdrInput
                size="Small"
                value={field.value}
                onChange={(value) => {
                  updateNode((current) =>
                    updateNodeTextField(current, field, value)
                  );
                }}
              />
            }
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
