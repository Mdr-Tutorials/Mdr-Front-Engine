import {
  normalizeKeyValueEntries,
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
    semantic?: 'control' | 'data' | 'condition';
  }
) => {
  const semantic = options.semantic ?? 'data';
  return (
    <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
      {options.inHandle
        ? renderTarget(
            id,
            options.inHandle,
            semantic,
            resolveMultiplicity('target', semantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
      <span>{label}</span>
      {options.outHandle
        ? renderSource(
            id,
            options.outHandle,
            semantic,
            resolveMultiplicity('source', semantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
    </div>
  );
};

export const renderStateGraphNode = ({ id, nodeData, selected, t }: Props) => {
  const kind = nodeData.kind;
  const isGetState = kind === 'getState';
  const isSetState = kind === 'setState';
  const isComputed = kind === 'computed';
  const isWatchState = kind === 'watchState';
  const isStorageRead = kind === 'localStorageRead';
  const isStorageWrite = kind === 'localStorageWrite';
  const entries = normalizeKeyValueEntries(nodeData.keyValueEntries);

  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[240px]')}>
      <NodeHeader
        title={nodeData.label}
        leftSlot={
          isSetState || isStorageWrite
            ? renderTarget(
                id,
                'in.control.prev',
                'control',
                resolveMultiplicity('target', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
            : undefined
        }
      />
      <div className="pb-2">
        <div className="px-4 pb-1">
          <input
            className={NODE_TEXT_INPUT_CLASS}
            value={nodeData.stateKey ?? ''}
            onChange={(event) =>
              nodeData.onChangeField?.(id, 'stateKey', event.target.value)
            }
            placeholder={
              isStorageRead || isStorageWrite
                ? tNode(t, 'state.placeholders.storageKey', 'storage key')
                : tNode(t, 'state.placeholders.stateKey', 'state key')
            }
            spellCheck={false}
          />
        </div>

        {(isComputed || isSetState || isStorageWrite) && (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.expression ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'expression', event.target.value)
              }
              placeholder={
                isComputed
                  ? tNode(
                      t,
                      'state.placeholders.computedExpression',
                      '(state) => state.count * 2'
                    )
                  : isStorageWrite
                    ? tNode(
                        t,
                        'state.placeholders.storageWriteExpression',
                        'JSON.stringify(value)'
                      )
                    : tNode(
                        t,
                        'state.placeholders.nextValueExpression',
                        'next value expression'
                      )
              }
              spellCheck={false}
            />
          </div>
        )}

        {(isComputed || isSetState) && (
          <KVListEditor
            t={t}
            items={entries}
            onAdd={() => nodeData.onAddKeyValueEntry?.(id)}
            onRemove={(entryId) =>
              nodeData.onRemoveKeyValueEntry?.(id, entryId)
            }
            onChange={(entryId, field, value) =>
              nodeData.onChangeKeyValueEntry?.(id, entryId, field, value)
            }
            keyPlaceholder={tNode(t, 'state.placeholders.depKey', 'dep key')}
            valuePlaceholder={tNode(
              t,
              'state.placeholders.depPath',
              'dep path'
            )}
          />
        )}

        {isGetState
          ? row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
              outHandle: 'out.data.value',
            })
          : null}
        {isWatchState
          ? row(id, nodeData, tNode(t, 'common.rows.changed', 'changed'), {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
        {isStorageRead
          ? row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
              inHandle: 'in.data.value',
              outHandle: 'out.data.value',
            })
          : null}
        {isSetState
          ? row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
        {isComputed
          ? row(id, nodeData, tNode(t, 'common.rows.result', 'result'), {
              inHandle: 'in.data.value',
              outHandle: 'out.data.value',
            })
          : null}
        {isStorageWrite
          ? row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
      </div>
    </div>
  );
};
