import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  buildNodeContainerClass,
  NODE_TEXT_INPUT_CLASS,
  NODE_TEXTAREA_CLASS,
  NodeHeader,
  NodeValidationHint,
  SelectField,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

const row = (
  id: string,
  nodeData: GraphNodeData,
  label: string,
  options: {
    inHandle?: string;
    outHandle?: string;
    inSemantic?: 'control' | 'data' | 'condition';
    outSemantic?: 'control' | 'data' | 'condition';
  }
) => (
  <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
    {options.inHandle
      ? renderTarget(
          id,
          options.inHandle,
          options.inSemantic ?? 'control',
          resolveMultiplicity('target', options.inSemantic ?? 'control'),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
    <span>{label}</span>
    {options.outHandle
      ? renderSource(
          id,
          options.outHandle,
          options.outSemantic ?? 'control',
          resolveMultiplicity('source', options.outSemantic ?? 'control'),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
  </div>
);

export const renderAdvancedFormsGraphNode = ({
  id,
  nodeData,
  selected,
}: Props) => {
  if (nodeData.kind === 'validate') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[280px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.ruleType ?? 'schema'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'ruleType', value)
              }
              options={[
                { value: 'schema', label: 'schema' },
                { value: 'rules', label: 'rules' },
                { value: 'custom', label: 'custom' },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.stopAtFirstError ?? 'false'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'stopAtFirstError', value)
              }
              options={[
                { value: 'false', label: 'collect all' },
                { value: 'true', label: 'stop first' },
              ]}
            />
          </div>
          <div className="px-4 pb-1">
            <textarea
              className={NODE_TEXTAREA_CLASS}
              value={nodeData.schema ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'schema', event.target.value)
              }
              rows={2}
              placeholder="schema / rule DSL"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'value', {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'rules', {
            inHandle: 'in.data.rules',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'valid', { outHandle: 'out.control.valid' })}
          {row(id, nodeData, 'invalid', { outHandle: 'out.control.invalid' })}
          {row(id, nodeData, 'cleaned', {
            outHandle: 'out.data.cleaned',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'errors', {
            outHandle: 'out.data.errors',
            outSemantic: 'data',
          })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'rateLimit') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[260px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.mode ?? 'debounce'}
              onChange={(value) => nodeData.onChangeField?.(id, 'mode', value)}
              options={[
                { value: 'debounce', label: 'debounce' },
                { value: 'throttle', label: 'throttle' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.waitMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'waitMs', event.target.value)
              }
              placeholder="wait ms"
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.leading ?? 'false'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'leading', value)
              }
              options={[
                { value: 'false', label: 'leading off' },
                { value: 'true', label: 'leading on' },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.trailing ?? 'true'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'trailing', value)
              }
              options={[
                { value: 'true', label: 'trailing on' },
                { value: 'false', label: 'trailing off' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.maxWaitMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'maxWaitMs', event.target.value)
              }
              placeholder="max wait"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'value', {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'fire', { outHandle: 'out.control.fire' })}
          {row(id, nodeData, 'value', {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'formContext') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[250px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.formId ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'formId', event.target.value)
              }
              placeholder="form id"
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.autoCreate ?? 'true'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'autoCreate', value)
              }
              options={[
                { value: 'true', label: 'auto create' },
                { value: 'false', label: 'manual' },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.resetOnSubmit ?? 'false'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'resetOnSubmit', value)
              }
              options={[
                { value: 'false', label: 'keep values' },
                { value: 'true', label: 'reset submit' },
              ]}
            />
          </div>
          {row(id, nodeData, 'changed', { outHandle: 'out.control.changed' })}
          {row(id, nodeData, 'form', {
            outHandle: 'out.data.form',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'values', {
            outHandle: 'out.data.values',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'errors', {
            outHandle: 'out.data.errors',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'formField') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[250px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.fieldName ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'fieldName', event.target.value)
              }
              placeholder="field"
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.action ?? 'bind'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'action', value)
              }
              options={[
                { value: 'bind', label: 'bind' },
                { value: 'get', label: 'get' },
                { value: 'set', label: 'set' },
                { value: 'reset', label: 'reset' },
              ]}
            />
          </div>
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.defaultValue ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'defaultValue', event.target.value)
              }
              placeholder="default value"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'form', {
            inHandle: 'in.data.form',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'value', {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'changed', { outHandle: 'out.control.changed' })}
          {row(id, nodeData, 'value', {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'error', {
            outHandle: 'out.data.error',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  return null;
};
