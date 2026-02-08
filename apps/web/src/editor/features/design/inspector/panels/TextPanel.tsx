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

    if (!shouldShowHeader && fields.length === 1) {
        const field = fields[0];
        const isDefaultTextField = field.key === 'text';
        return (
            <div className="InspectorSection flex flex-col gap-2">
                <div className="InspectorField flex flex-col gap-1.5">
                    {isDefaultTextField ? (
                        <div className="InspectorInputRow InspectorSingleInput flex w-full items-center gap-1 [&>*]:flex-1">
                            <MdrInput
                                size="Small"
                                value={field.value}
                                onChange={(value) => {
                                    updateNode((current) =>
                                        updateNodeTextField(
                                            current,
                                            field,
                                            value
                                        )
                                    );
                                }}
                            />
                        </div>
                    ) : (
                        <InspectorRow
                            label={getFieldLabel(field.key, t)}
                            control={
                                <div className="InspectorInputRow InspectorSingleInput flex w-full items-center gap-1 [&>*]:flex-1">
                                    <MdrInput
                                        size="Small"
                                        value={field.value}
                                        onChange={(value) => {
                                            updateNode((current) =>
                                                updateNodeTextField(
                                                    current,
                                                    field,
                                                    value
                                                )
                                            );
                                        }}
                                    />
                                </div>
                            }
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
                                defaultValue:
                                    'Edit the content shown by this component.',
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
                        control={
                            <MdrInput
                                size="Small"
                                value={field.value}
                                onChange={(value) => {
                                    updateNode((current) =>
                                        updateNodeTextField(
                                            current,
                                            field,
                                            value
                                        )
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
