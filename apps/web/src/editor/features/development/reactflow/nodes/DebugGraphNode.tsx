import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
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

export const renderDebugGraphNode = ({ id, nodeData, selected, t }: Props) => {
  const kind = nodeData.kind;
  const isLog = kind === 'log';
  const isAssert = kind === 'assert';
  const isBreakpoint = kind === 'breakpoint';
  const isMockData = kind === 'mockData';
  const isPerfMark = kind === 'perfMark';

  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[230px]')}>
      <NodeHeader
        title={nodeData.label}
        leftSlot={
          isMockData
            ? undefined
            : renderTarget(
                id,
                'in.control.prev',
                'control',
                resolveMultiplicity('target', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
        }
      />
      <div className="pb-2">
        {(isLog || isAssert || isPerfMark) && (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.description ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'description', event.target.value)
              }
              placeholder={
                isAssert
                  ? tNode(
                      t,
                      'debug.placeholders.assertionMessage',
                      'assertion message'
                    )
                  : isPerfMark
                    ? tNode(
                        t,
                        'debug.placeholders.perfMarkName',
                        'perf mark name'
                      )
                    : tNode(t, 'debug.placeholders.logTag', 'log tag')
              }
              spellCheck={false}
            />
          </div>
        )}

        {isLog
          ? row(id, nodeData, tNode(t, 'common.rows.payload', 'payload'), {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              inSemantic: 'data',
              outSemantic: 'control',
            })
          : null}
        {isAssert
          ? row(id, nodeData, tNode(t, 'common.rows.condition', 'condition'), {
              inHandle: 'in.condition.value',
              outHandle: 'out.control.next',
              inSemantic: 'condition',
              outSemantic: 'control',
            })
          : null}
        {isBreakpoint
          ? row(id, nodeData, tNode(t, 'debug.rows.pause', 'pause'), {
              outHandle: 'out.control.next',
              outSemantic: 'control',
            })
          : null}
        {isMockData ? (
          <>
            <div className="px-4 pb-1">
              <input
                className={NODE_TEXT_INPUT_CLASS}
                value={nodeData.value ?? ''}
                onChange={(event) =>
                  nodeData.onChangeField?.(id, 'value', event.target.value)
                }
                placeholder={tNode(
                  t,
                  'debug.placeholders.mockData',
                  '{"mock":true}'
                )}
                spellCheck={false}
              />
            </div>
            {row(id, nodeData, tNode(t, 'debug.rows.mock', 'mock'), {
              outHandle: 'out.data.value',
              outSemantic: 'data',
            })}
          </>
        ) : null}
        {isPerfMark
          ? row(id, nodeData, tNode(t, 'common.rows.payload', 'payload'), {
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
