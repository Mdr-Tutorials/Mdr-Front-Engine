import {
  normalizeBindingEntries,
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  buildNodeContainerClass,
  KVListEditor,
  NODE_TEXT_INPUT_CLASS,
  NodeHeader,
  SelectField,
} from './nodePrimitives';
import type { NodeI18n } from './nodeI18n';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

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

export const renderAbstractionGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  if (nodeData.kind === 'subFlowCall') {
    const inputBindings = normalizeBindingEntries(nodeData.inputBindings);
    const outputBindings = normalizeBindingEntries(nodeData.outputBindings);
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[300px]')}>
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
              value={nodeData.subGraphId ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'subGraphId', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.subFlowCall.subGraphIdPlaceholder',
                'sub graph id'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.timeoutMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'timeoutMs', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.subFlowCall.timeoutPlaceholder',
                'timeout ms'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.args', 'args'), {
            inHandle: 'in.data.args',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.done', 'done'), {
            outHandle: 'out.control.done',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.result', 'result'), {
            outHandle: 'out.data.result',
            outSemantic: 'data',
          })}
          <div className="px-4 pb-1 pt-1 text-[10px] uppercase tracking-[0.08em] text-slate-400">
            {tNode(
              t,
              'abstraction.subFlowCall.inputBindings',
              'input bindings'
            )}
          </div>
          <KVListEditor
            t={t}
            items={inputBindings}
            onAdd={() => nodeData.onAddBindingEntry?.(id, 'inputBindings')}
            onRemove={(entryId) =>
              nodeData.onRemoveBindingEntry?.(id, 'inputBindings', entryId)
            }
            onChange={(entryId, field, value) =>
              nodeData.onChangeBindingEntry?.(
                id,
                'inputBindings',
                entryId,
                field,
                value
              )
            }
            keyPlaceholder={tNode(t, 'abstraction.placeholders.arg', 'arg')}
            valuePlaceholder={tNode(
              t,
              'abstraction.placeholders.binding',
              'binding'
            )}
          />
          <div className="px-4 pb-1 pt-1 text-[10px] uppercase tracking-[0.08em] text-slate-400">
            {tNode(
              t,
              'abstraction.subFlowCall.outputBindings',
              'output bindings'
            )}
          </div>
          <KVListEditor
            t={t}
            items={outputBindings}
            onAdd={() => nodeData.onAddBindingEntry?.(id, 'outputBindings')}
            onRemove={(entryId) =>
              nodeData.onRemoveBindingEntry?.(id, 'outputBindings', entryId)
            }
            onChange={(entryId, field, value) =>
              nodeData.onChangeBindingEntry?.(
                id,
                'outputBindings',
                entryId,
                field,
                value
              )
            }
            keyPlaceholder={tNode(
              t,
              'abstraction.placeholders.result',
              'result'
            )}
            valuePlaceholder={tNode(
              t,
              'abstraction.placeholders.binding',
              'binding'
            )}
          />
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'subFlowInput') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[240px]')}>
        <NodeHeader title={nodeData.label} />
        <div className="pb-1">
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.name ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'name', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.subFlowInput.namePlaceholder',
                'name'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.type ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'type', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.subFlowInput.typePlaceholder',
                'type'
              )}
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.required ?? 'false'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'required', value)
              }
              options={[
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'abstraction.subFlowInput.required.false',
                    'optional'
                  ),
                },
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'abstraction.subFlowInput.required.true',
                    'required'
                  ),
                },
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
              placeholder={tNode(
                t,
                'abstraction.subFlowInput.defaultValuePlaceholder',
                'default value'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'subFlowOutput') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[240px]')}>
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
              value={nodeData.name ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'name', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.subFlowOutput.namePlaceholder',
                'name'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.type ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'type', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.subFlowOutput.typePlaceholder',
                'type'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.done', 'done'), {
            outHandle: 'out.control.done',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'memoCache') {
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
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.strategy ?? 'memory'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'strategy', value)
              }
              options={[
                {
                  value: 'memory',
                  label: tNode(
                    t,
                    'abstraction.memoCache.strategy.memory',
                    'memory'
                  ),
                },
                {
                  value: 'session',
                  label: tNode(
                    t,
                    'abstraction.memoCache.strategy.session',
                    'session'
                  ),
                },
                {
                  value: 'local',
                  label: tNode(
                    t,
                    'abstraction.memoCache.strategy.local',
                    'local'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.ttlMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'ttlMs', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.memoCache.ttlPlaceholder',
                'ttl'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.maxSize ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'maxSize', event.target.value)
              }
              placeholder={tNode(
                t,
                'abstraction.memoCache.maxSizePlaceholder',
                'max size'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.key', 'key'), {
            inHandle: 'in.data.key',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {row(
            id,
            nodeData,
            tNode(t, 'abstraction.memoCache.rows.deps', 'deps'),
            {
              inHandle: 'in.data.deps',
              inSemantic: 'data',
            }
          )}
          {row(id, nodeData, tNode(t, 'common.rows.hit', 'hit'), {
            outHandle: 'out.control.hit',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.miss', 'miss'), {
            outHandle: 'out.control.miss',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  return null;
};
