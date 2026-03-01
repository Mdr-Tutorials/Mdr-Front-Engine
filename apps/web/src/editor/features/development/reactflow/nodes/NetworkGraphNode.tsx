import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import {
  buildNodeContainerClass,
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

export const renderNetworkGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  const kind = nodeData.kind;
  const isRetry = kind === 'retry';
  const isTimeout = kind === 'timeout';
  const isCancel = kind === 'cancel';
  const isCacheRead = kind === 'cacheRead';
  const isCacheWrite = kind === 'cacheWrite';

  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[230px]')}>
      <NodeHeader
        title={nodeData.label}
        leftSlot={
          isRetry || isTimeout || isCancel || isCacheWrite
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
        {(isTimeout || isCacheRead || isCacheWrite || isRetry) && (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={
                isTimeout
                  ? (nodeData.timeoutMs ?? '')
                  : isRetry
                    ? (nodeData.value ?? '')
                    : (nodeData.stateKey ?? '')
              }
              onChange={(event) =>
                nodeData.onChangeField?.(
                  id,
                  isTimeout ? 'timeoutMs' : isRetry ? 'value' : 'stateKey',
                  event.target.value
                )
              }
              placeholder={
                isTimeout
                  ? tNode(t, 'network.placeholders.timeoutMs', '3000')
                  : isRetry
                    ? tNode(t, 'network.placeholders.retryTimes', '3')
                    : tNode(t, 'network.placeholders.cacheKey', 'cache key')
              }
              spellCheck={false}
            />
          </div>
        )}

        {isRetry
          ? row(id, nodeData, tNode(t, 'common.rows.next', 'next'), {
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
        {isTimeout
          ? row(id, nodeData, tNode(t, 'network.rows.msInput', 'ms input'), {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              inSemantic: 'data',
              outSemantic: 'control',
            })
          : null}
        {isCancel
          ? row(id, nodeData, tNode(t, 'network.rows.cancel', 'cancel'), {
              outHandle: 'out.control.next',
              semantic: 'control',
            })
          : null}
        {isCacheRead
          ? row(id, nodeData, tNode(t, 'common.rows.key', 'key'), {
              inHandle: 'in.data.value',
              outHandle: 'out.data.value',
              semantic: 'data',
            })
          : null}
        {isCacheWrite
          ? row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              inSemantic: 'data',
              outSemantic: 'control',
            })
          : null}
      </div>
    </div>
  );
};
