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

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

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

export const renderStateGraphNode = ({ id, nodeData, selected }: Props) => {
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
              isStorageRead || isStorageWrite ? 'storage key' : 'state key'
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
                  ? '(state) => state.count * 2'
                  : isStorageWrite
                    ? 'JSON.stringify(value)'
                    : 'next value expression'
              }
              spellCheck={false}
            />
          </div>
        )}

        {(isComputed || isSetState) && (
          <KVListEditor
            items={entries}
            onAdd={() => nodeData.onAddKeyValueEntry?.(id)}
            onRemove={(entryId) =>
              nodeData.onRemoveKeyValueEntry?.(id, entryId)
            }
            onChange={(entryId, field, value) =>
              nodeData.onChangeKeyValueEntry?.(id, entryId, field, value)
            }
            keyPlaceholder="dep key"
            valuePlaceholder="dep path"
          />
        )}

        {isGetState
          ? row(id, nodeData, 'value', { outHandle: 'out.data.value' })
          : null}
        {isWatchState
          ? row(id, nodeData, 'changed', {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
        {isStorageRead
          ? row(id, nodeData, 'value', {
              inHandle: 'in.data.value',
              outHandle: 'out.data.value',
            })
          : null}
        {isSetState
          ? row(id, nodeData, 'value', {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
        {isComputed
          ? row(id, nodeData, 'result', {
              inHandle: 'in.data.value',
              outHandle: 'out.data.value',
            })
          : null}
        {isStorageWrite
          ? row(id, nodeData, 'value', {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
      </div>
    </div>
  );
};
