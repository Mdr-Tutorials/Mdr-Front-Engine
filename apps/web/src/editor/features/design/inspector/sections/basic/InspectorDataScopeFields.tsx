import { useEffect, useMemo, useState } from 'react';
import { useInspectorSectionContext } from '../InspectorSectionContext';

const LEGACY_DATA_MODEL_KEY = 'x-mdr-data-model';
const LEGACY_DATA_SCHEMA_KEY = 'x-mdr-data-schema';
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asSchemaText = (value: unknown) => {
  try {
    return value === undefined ? '' : JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
};

export function InspectorDataScopeFields() {
  const { t, selectedNode, updateSelectedNode } = useInspectorSectionContext();
  if (!selectedNode) return null;

  const mountedDataModel = useMemo(() => {
    const data = selectedNode.data as Record<string, unknown> | undefined;
    if (isPlainObject(data?.value)) {
      return data.value;
    }
    const extendModel = data?.extend;
    if (
      extendModel &&
      typeof extendModel === 'object' &&
      !Array.isArray(extendModel)
    ) {
      return extendModel;
    }
    const legacy =
      data?.[LEGACY_DATA_MODEL_KEY] ?? data?.[LEGACY_DATA_SCHEMA_KEY];
    return isPlainObject(legacy) ? legacy : {};
  }, [selectedNode.data]);
  const mountedMockData = useMemo(() => {
    const data = selectedNode.data as Record<string, unknown> | undefined;
    if (data?.mock !== undefined) {
      return data.mock;
    }
    if (Array.isArray(data?.value)) {
      return data.value;
    }
    return {};
  }, [selectedNode.data]);
  const [schemaDraft, setSchemaDraft] = useState(
    asSchemaText(mountedDataModel)
  );
  const [mockDraft, setMockDraft] = useState(asSchemaText(mountedMockData));
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [mockError, setMockError] = useState<string | null>(null);
  const isMounted = selectedNode.data !== undefined;

  useEffect(() => {
    setSchemaDraft(asSchemaText(mountedDataModel));
    setSchemaError(null);
  }, [mountedDataModel]);
  useEffect(() => {
    setMockDraft(asSchemaText(mountedMockData));
    setMockError(null);
  }, [mountedMockData]);

  const applySchemaDraft = () => {
    const raw = schemaDraft.trim();
    if (!raw) {
      updateSelectedNode((current: any) => {
        const nextNode = { ...current };
        delete nextNode.data;
        return nextNode;
      });
      setSchemaError(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed)) {
        setSchemaError(
          t('inspector.fields.dataModel.schemaObjectOnly', {
            defaultValue: 'Data model must be a JSON object.',
          })
        );
        return;
      }
      setSchemaError(null);
      updateSelectedNode((current: any) => {
        const nextData = {
          ...(current.data ?? {}),
          value: parsed,
        } as Record<string, unknown>;
        if (nextData.mock === undefined) {
          nextData.mock = {};
        }
        delete nextData.extend;
        delete nextData[LEGACY_DATA_MODEL_KEY];
        delete nextData[LEGACY_DATA_SCHEMA_KEY];
        return { ...current, data: nextData };
      });
    } catch {
      setSchemaError(
        t('inspector.fields.dataModel.invalidJson', {
          defaultValue: 'Invalid JSON format.',
        })
      );
    }
  };
  const applyMockDraft = () => {
    const raw = mockDraft.trim();
    if (!raw) {
      updateSelectedNode((current: any) => {
        if (!current.data) return current;
        const nextData = { ...(current.data as Record<string, unknown>) };
        delete nextData.mock;
        return {
          ...current,
          data: nextData,
        };
      });
      setMockError(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setMockError(null);
      updateSelectedNode((current: any) => {
        const nextData = {
          ...(current.data ?? {}),
          mock: parsed,
        } as Record<string, unknown>;
        delete nextData[LEGACY_DATA_MODEL_KEY];
        delete nextData[LEGACY_DATA_SCHEMA_KEY];
        return { ...current, data: nextData };
      });
    } catch {
      setMockError(
        t('inspector.fields.dataModel.invalidJson', {
          defaultValue: 'Invalid JSON format.',
        })
      );
    }
  };

  return (
    <div className="grid gap-1.5 rounded-md border border-black/8 p-2 dark:border-white/14">
      <div className="text-[10px] font-semibold text-(--color-7)">
        {t('inspector.fields.dataModel.title', { defaultValue: 'Data Model' })}
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-(--color-8)">
        <input
          data-testid="inspector-data-model-enable"
          type="checkbox"
          checked={isMounted}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            updateSelectedNode((current: any) => {
              if (!checked) {
                const nextNode = { ...current };
                delete nextNode.data;
                return nextNode;
              }
              const nextData = {
                ...(current.data ?? {}),
                value: {},
                mock: {},
              } as Record<string, unknown>;
              delete nextData.extend;
              delete nextData[LEGACY_DATA_MODEL_KEY];
              delete nextData[LEGACY_DATA_SCHEMA_KEY];
              return { ...current, data: nextData };
            });
          }}
        />
        {t('inspector.fields.dataModel.enable', {
          defaultValue: 'Mount data model JSON on this component',
        })}
      </label>
      {isMounted ? (
        <>
          <textarea
            data-testid="inspector-data-model-schema"
            className="min-h-24 w-full rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs dark:border-white/16"
            value={schemaDraft}
            placeholder={t('inspector.fields.dataModel.schemaPlaceholder', {
              defaultValue:
                '{\n  "totalCount": "number",\n  "items": [\n    {\n      "data": "string"\n    }\n  ]\n}',
            })}
            onChange={(event) => {
              setSchemaDraft(event.target.value);
              setSchemaError(null);
            }}
            onBlur={applySchemaDraft}
          />
          <div className="text-[10px] font-semibold text-(--color-7)">
            {t('inspector.fields.dataModel.mockLabel', {
              defaultValue: 'Mock JSON',
            })}
          </div>
          <textarea
            data-testid="inspector-data-model-mock"
            className="min-h-24 w-full rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs dark:border-white/16"
            value={mockDraft}
            placeholder={t('inspector.fields.dataModel.mockPlaceholder', {
              defaultValue:
                '{\n  "totalCount": 2,\n  "items": [\n    {\n      "data": "mdr"\n    }\n  ]\n}',
            })}
            onChange={(event) => {
              setMockDraft(event.target.value);
              setMockError(null);
            }}
            onBlur={applyMockDraft}
          />
          {schemaError ? (
            <p className="m-0 text-[10px] text-[rgb(208,53,53)]">
              {schemaError}
            </p>
          ) : null}
          {mockError ? (
            <p className="m-0 text-[10px] text-[rgb(208,53,53)]">{mockError}</p>
          ) : null}
          <p className="m-0 text-[10px] text-(--color-6)">
            {t('inspector.fields.dataModel.hint', {
              defaultValue:
                'Child properties can bind with field paths directly in their own inputs.',
            })}
          </p>
        </>
      ) : null}
    </div>
  );
}
