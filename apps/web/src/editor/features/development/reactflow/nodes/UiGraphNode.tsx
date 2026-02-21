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
    inSemantic?: 'control' | 'data' | 'condition';
    outSemantic?: 'control' | 'data' | 'condition';
  }
) => {
  const semantic = options.semantic ?? 'control';
  const inSemantic = options.inSemantic ?? semantic;
  const outSemantic = options.outSemantic ?? semantic;
  return (
    <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
      {options.inHandle
        ? renderTarget(
            id,
            options.inHandle,
            inSemantic,
            resolveMultiplicity('target', inSemantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
      <span>{label}</span>
      {options.outHandle
        ? renderSource(
            id,
            options.outHandle,
            outSemantic,
            resolveMultiplicity('source', outSemantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
    </div>
  );
};

export const renderUiGraphNode = ({ id, nodeData, selected }: Props) => {
  const kind = nodeData.kind;
  const isRenderComponent = kind === 'renderComponent';
  const isConditionalRender = kind === 'conditionalRender';
  const isListRender = kind === 'listRender';
  const isToast = kind === 'toast';
  const isModal = kind === 'modal';
  const entries = normalizeKeyValueEntries(nodeData.keyValueEntries);

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
      <div className="pb-2">
        {(isRenderComponent ||
          isConditionalRender ||
          isListRender ||
          isModal) && (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.value ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'value', event.target.value)
              }
              placeholder={
                isRenderComponent
                  ? 'ComponentName'
                  : isConditionalRender
                    ? 'visible section'
                    : isListRender
                      ? 'List item renderer'
                      : 'modal id'
              }
              spellCheck={false}
            />
          </div>
        )}

        {isToast && (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.description ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'description', event.target.value)
              }
              placeholder="toast message"
              spellCheck={false}
            />
          </div>
        )}

        {isRenderComponent ||
        isConditionalRender ||
        isListRender ||
        isToast ||
        isModal
          ? row(id, nodeData, 'props/data', {
              inHandle: 'in.data.value',
              inSemantic: 'data',
            })
          : null}

        {isConditionalRender
          ? row(id, nodeData, 'condition', {
              inHandle: 'in.condition.value',
              inSemantic: 'condition',
            })
          : null}

        {isRenderComponent ||
        isConditionalRender ||
        isListRender ||
        isToast ||
        isModal
          ? row(id, nodeData, 'next', {
              outHandle: 'out.control.next',
              outSemantic: 'control',
            })
          : null}

        {(isRenderComponent || isConditionalRender || isListRender) && (
          <KVListEditor
            items={entries}
            onAdd={() => nodeData.onAddKeyValueEntry?.(id)}
            onRemove={(entryId) =>
              nodeData.onRemoveKeyValueEntry?.(id, entryId)
            }
            onChange={(entryId, field, value) =>
              nodeData.onChangeKeyValueEntry?.(id, entryId, field, value)
            }
            keyPlaceholder="prop"
            valuePlaceholder="binding"
          />
        )}
      </div>
    </div>
  );
};
