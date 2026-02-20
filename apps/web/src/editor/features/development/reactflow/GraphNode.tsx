import type { MouseEvent } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

export type GraphNodeKind =
  | 'start'
  | 'process'
  | 'switch'
  | 'fetch'
  | 'end'
  | 'string'
  | 'number'
  | 'expression';
export type SwitchCaseItem = { id: string; label: string };
export type FetchStatusItem = { id: string; code: string };

export type GraphNodeData = {
  label: string;
  kind: GraphNodeKind;
  value?: string;
  expression?: string;
  method?: string;
  hasUrlInput?: boolean;
  cases?: SwitchCaseItem[] | string[];
  statusCodes?: FetchStatusItem[] | string[];
  onPortContextMenu?: (
    event: MouseEvent,
    nodeId: string,
    handleId: string,
    role: 'source' | 'target'
  ) => void;
  onAddCase?: (nodeId: string) => void;
  onRemoveCase?: (nodeId: string, caseId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
  onChangeValue?: (nodeId: string, value: string) => void;
  onChangeExpression?: (nodeId: string, expression: string) => void;
  onAddStatusCode?: (nodeId: string) => void;
  onRemoveStatusCode?: (nodeId: string, statusId: string) => void;
  onChangeStatusCode?: (nodeId: string, statusId: string, code: string) => void;
  onChangeMethod?: (nodeId: string, method: string) => void;
  collapsed?: boolean;
};

type PortSemantic = 'control' | 'data' | 'condition';
type PortMultiplicity = 'single' | 'multi';

const resolveMultiplicity = (
  role: 'source' | 'target',
  semantic: PortSemantic
): PortMultiplicity => {
  if (role === 'target' && semantic === 'control') return 'multi';
  if (role === 'source' && semantic === 'data') return 'multi';
  return 'single';
};

const normalizeCases = (cases?: GraphNodeData['cases']): SwitchCaseItem[] => {
  if (!Array.isArray(cases)) return [];
  return cases
    .map((item, index) =>
      typeof item === 'string'
        ? { id: `${index}`, label: item }
        : {
            id: item.id || `${index}`,
            label: item.label || `case-${index + 1}`,
          }
    )
    .filter((item) => Boolean(item.id));
};

const normalizeStatusCodes = (
  statusCodes?: GraphNodeData['statusCodes']
): FetchStatusItem[] => {
  if (!Array.isArray(statusCodes)) return [];
  return statusCodes
    .map((item, index) =>
      typeof item === 'string'
        ? { id: `${index}`, code: item || `${200 + index}` }
        : { id: item.id || `${index}`, code: item.code || `${200 + index}` }
    )
    .filter((item) => Boolean(item.id));
};

const renderTarget = (
  id: string,
  handleId: string,
  semantic: PortSemantic,
  multiplicity: PortMultiplicity,
  top: string | undefined,
  onPortContextMenu: GraphNodeData['onPortContextMenu']
) => (
  <Handle
    id={handleId}
    type="target"
    position={Position.Left}
    className={`native-switch-port semantic-${semantic} ${multiplicity === 'multi' ? 'is-multi' : ''}`}
    style={top ? { top } : undefined}
    onContextMenu={
      onPortContextMenu
        ? (event) => onPortContextMenu(event, id, handleId, 'target')
        : undefined
    }
  />
);

const renderSource = (
  id: string,
  handleId: string,
  semantic: PortSemantic,
  multiplicity: PortMultiplicity,
  top: string | undefined,
  onPortContextMenu: GraphNodeData['onPortContextMenu']
) => (
  <Handle
    id={handleId}
    type="source"
    position={Position.Right}
    className={`native-switch-port semantic-${semantic} ${multiplicity === 'multi' ? 'is-multi' : ''}`}
    style={top ? { top } : undefined}
    onContextMenu={
      onPortContextMenu
        ? (event) => onPortContextMenu(event, id, handleId, 'source')
        : undefined
    }
  />
);

export const GraphNode = ({ id, data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData;
  const cases = normalizeCases(nodeData.cases);
  const isCollapsed = Boolean(nodeData.collapsed);

  if (nodeData.kind === 'switch') {
    return (
      <div
        className={`relative min-w-[220px] overflow-visible rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.12)] ${
          selected
            ? 'ring-1 ring-slate-500/45 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.16)]'
            : ''
        }`}
      >
        <div className="relative flex items-center justify-between px-3.5 pb-1.5 pt-2">
          {renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
          <div className="pl-1 font-[Poppins,sans-serif] text-[13px] font-semibold tracking-[0.01em] text-slate-900">
            {nodeData.label}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                nodeData.onAddCase?.(id);
              }}
              aria-label="add case"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                nodeData.onToggleCollapse?.(id);
              }}
              aria-label={isCollapsed ? 'expand switch' : 'collapse switch'}
            >
              {isCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>
        </div>
        {isCollapsed ? (
          <>
            <div className="relative flex min-h-7 items-center px-4 pb-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-500">
              {renderTarget(
                id,
                'in.data.value',
                'data',
                resolveMultiplicity('target', 'data'),
                undefined,
                nodeData.onPortContextMenu
              )}
              <span>{cases.length} case(s)</span>
            </div>
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="relative flex min-h-6 items-center px-4 text-[11px] font-normal text-slate-500"
              >
                <span>{caseItem.label}</span>
                {renderTarget(
                  id,
                  `in.condition.case-${caseItem.id}`,
                  'condition',
                  resolveMultiplicity('target', 'condition'),
                  undefined,
                  nodeData.onPortContextMenu
                )}
                {renderSource(
                  id,
                  `out.control.case-${caseItem.id}`,
                  'control',
                  resolveMultiplicity('source', 'control'),
                  undefined,
                  nodeData.onPortContextMenu
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="pb-2">
            <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-500">
              {renderTarget(
                id,
                'in.data.value',
                'data',
                resolveMultiplicity('target', 'data'),
                undefined,
                nodeData.onPortContextMenu
              )}
              <span>switch value</span>
            </div>
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="group relative flex min-h-7 items-center gap-2 px-4 text-[11px] font-normal text-slate-700"
              >
                <span>{caseItem.label}</span>
                {renderTarget(
                  id,
                  `in.condition.case-${caseItem.id}`,
                  'condition',
                  resolveMultiplicity('target', 'condition'),
                  undefined,
                  nodeData.onPortContextMenu
                )}
                {renderSource(
                  id,
                  `out.control.case-${caseItem.id}`,
                  'control',
                  resolveMultiplicity('source', 'control'),
                  undefined,
                  nodeData.onPortContextMenu
                )}
                <button
                  type="button"
                  className="nodrag nopan ml-auto flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    nodeData.onRemoveCase?.(id, caseItem.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <div className="relative flex min-h-7 items-center gap-2 px-4 text-[11px] font-normal text-slate-700">
              <span>default</span>
              {renderSource(
                id,
                'out.control.default',
                'control',
                resolveMultiplicity('source', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )}
            </div>
          </div>
        )}
        {isCollapsed
          ? renderSource(
              id,
              'out.control.default',
              'control',
              resolveMultiplicity('source', 'control'),
              undefined,
              nodeData.onPortContextMenu
            )
          : null}
      </div>
    );
  }

  if (nodeData.kind === 'fetch') {
    const statusCodes = normalizeStatusCodes(nodeData.statusCodes);
    return (
      <div
        className={`relative min-w-[240px] overflow-visible rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.12)] ${
          selected
            ? 'ring-1 ring-slate-500/45 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.16)]'
            : ''
        }`}
      >
        <div className="relative flex min-h-9 items-center justify-between px-3.5 py-1.5">
          {renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
          <div className="pl-1 font-[Poppins,sans-serif] text-[13px] font-semibold tracking-[0.01em] text-slate-900">
            {nodeData.label}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                nodeData.onAddStatusCode?.(id);
              }}
              aria-label="add status code"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                nodeData.onToggleCollapse?.(id);
              }}
              aria-label={isCollapsed ? 'expand fetch' : 'collapse fetch'}
            >
              {isCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>
        </div>

        {isCollapsed ? (
          <>
            <div className="relative flex min-h-7 items-center px-4 pb-2 text-[11px] font-normal text-slate-500">
              {renderTarget(
                id,
                'in.data.url',
                'data',
                resolveMultiplicity('target', 'data'),
                undefined,
                nodeData.onPortContextMenu
              )}
              <span>
                {nodeData.method || 'GET'} · {statusCodes.length} code(s)
              </span>
            </div>
            {statusCodes.map((item) => (
              <div key={item.id}>
                {renderSource(
                  id,
                  `out.control.status-${item.id}`,
                  'control',
                  resolveMultiplicity('source', 'control'),
                  undefined,
                  nodeData.onPortContextMenu
                )}
              </div>
            ))}
            {renderSource(
              id,
              'out.control.error-request',
              'control',
              resolveMultiplicity('source', 'control'),
              undefined,
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.error-unexpected',
              'control',
              resolveMultiplicity('source', 'control'),
              undefined,
              nodeData.onPortContextMenu
            )}
          </>
        ) : (
          <div className="pb-2">
            <div className="relative px-4 pb-1">
              <input
                className="nodrag nopan h-7 w-full rounded border border-slate-200 bg-slate-50 px-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                value={nodeData.value ?? ''}
                onChange={(event) =>
                  nodeData.onChangeValue?.(id, event.target.value)
                }
                placeholder={
                  nodeData.hasUrlInput
                    ? 'URL comes from data input'
                    : 'https://api.example.com/orders'
                }
                disabled={Boolean(nodeData.hasUrlInput)}
                spellCheck={false}
              />
              {renderTarget(
                id,
                'in.data.url',
                'data',
                resolveMultiplicity('target', 'data'),
                undefined,
                nodeData.onPortContextMenu
              )}
            </div>

            <div className="px-4 pb-1">
              <select
                className="nodrag nopan h-7 w-full rounded border border-slate-200 bg-slate-50 px-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                value={nodeData.method || 'GET'}
                onChange={(event) =>
                  nodeData.onChangeMethod?.(id, event.target.value)
                }
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {statusCodes.map((item) => (
              <div
                key={item.id}
                className="group relative flex min-h-7 items-center gap-2 px-4 text-[11px] font-normal text-slate-700"
              >
                <input
                  className="nodrag nopan h-6 w-16 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                  value={item.code}
                  onChange={(event) =>
                    nodeData.onChangeStatusCode?.(
                      id,
                      item.id,
                      event.target.value
                    )
                  }
                  placeholder="200"
                  spellCheck={false}
                />
                {renderSource(
                  id,
                  `out.control.status-${item.id}`,
                  'control',
                  resolveMultiplicity('source', 'control'),
                  undefined,
                  nodeData.onPortContextMenu
                )}
                <button
                  type="button"
                  className="nodrag nopan ml-auto flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    nodeData.onRemoveStatusCode?.(id, item.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
              <span>request error</span>
              {renderSource(
                id,
                'out.control.error-request',
                'control',
                resolveMultiplicity('source', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )}
            </div>
            <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
              <span>unexpected status</span>
              {renderSource(
                id,
                'out.control.error-unexpected',
                'control',
                resolveMultiplicity('source', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'expression') {
    return (
      <div
        className={`relative min-w-[220px] overflow-visible rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.12)] ${
          selected
            ? 'ring-1 ring-slate-500/45 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.16)]'
            : ''
        }`}
      >
        <div className="relative flex min-h-9 items-center justify-between px-3.5 py-1.5">
          <div className="truncate pl-1 pr-2 font-[Poppins,sans-serif] text-[13px] font-semibold tracking-[0.01em] text-slate-900">
            {nodeData.label}
          </div>
          {isCollapsed ? (
            <div className="mr-1 truncate text-[11px] font-normal text-slate-500">
              {nodeData.expression || 'expression'}
            </div>
          ) : null}
          <button
            type="button"
            className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={(event) => {
              event.stopPropagation();
              nodeData.onToggleCollapse?.(id);
            }}
            aria-label={
              isCollapsed ? 'expand expression' : 'collapse expression'
            }
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
          {isCollapsed
            ? renderSource(
                id,
                'out.data.value',
                'data',
                resolveMultiplicity('source', 'data'),
                '35%',
                nodeData.onPortContextMenu
              )
            : null}
          {isCollapsed
            ? renderSource(
                id,
                'out.condition.result',
                'condition',
                'multi',
                '65%',
                nodeData.onPortContextMenu
              )
            : null}
        </div>
        {isCollapsed ? null : (
          <div className="pb-2">
            <div className="px-4 pb-1">
              <input
                className="nodrag nopan h-7 w-full rounded border border-slate-200 bg-slate-50 px-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                value={nodeData.expression ?? ''}
                onChange={(event) =>
                  nodeData.onChangeExpression?.(id, event.target.value)
                }
                placeholder="a > 0 && b < 3"
                spellCheck={false}
              />
            </div>
            <div className="relative h-3">
              {renderSource(
                id,
                'out.data.value',
                'data',
                resolveMultiplicity('source', 'data'),
                '0%',
                nodeData.onPortContextMenu
              )}
              {renderSource(
                id,
                'out.condition.result',
                'condition',
                'multi',
                '100%',
                nodeData.onPortContextMenu
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'string' || nodeData.kind === 'number') {
    return (
      <div
        className={`relative min-w-[200px] overflow-visible rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.12)] ${
          selected
            ? 'ring-1 ring-slate-500/45 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.16)]'
            : ''
        }`}
      >
        <div className="relative flex min-h-9 items-center justify-between px-3.5 py-1.5">
          <div className="font-[Poppins,sans-serif] text-[13px] font-semibold tracking-[0.01em] text-slate-900">
            {nodeData.label}
          </div>
          <div className="flex items-center gap-1">
            {isCollapsed ? (
              <span className="max-w-[96px] truncate text-[11px] font-normal text-slate-500">
                {nodeData.value ||
                  (nodeData.kind === 'string' ? '"hello"' : '42')}
              </span>
            ) : null}
            <button
              type="button"
              className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                nodeData.onToggleCollapse?.(id);
              }}
              aria-label={
                isCollapsed
                  ? `expand ${nodeData.kind}`
                  : `collapse ${nodeData.kind}`
              }
            >
              {isCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>
          {isCollapsed
            ? renderSource(
                id,
                'out.data.value',
                'data',
                resolveMultiplicity('source', 'data'),
                undefined,
                nodeData.onPortContextMenu
              )
            : null}
        </div>
        {isCollapsed ? null : (
          <div className="pb-2">
            <div className="relative px-4 pb-1">
              {nodeData.kind === 'string' ? (
                <textarea
                  className="nodrag nopan min-h-7 w-full resize-none overflow-hidden rounded border border-slate-200 bg-slate-50 px-2 py-1 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                  value={nodeData.value ?? ''}
                  onChange={(event) =>
                    nodeData.onChangeValue?.(id, event.target.value)
                  }
                  onInput={(event) => {
                    const element = event.currentTarget;
                    element.style.height = '0px';
                    element.style.height = `${element.scrollHeight}px`;
                  }}
                  placeholder='"hello"'
                  rows={2}
                  spellCheck={false}
                />
              ) : (
                <input
                  className="nodrag nopan h-7 w-full rounded border border-slate-200 bg-slate-50 px-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                  value={nodeData.value ?? ''}
                  onChange={(event) =>
                    nodeData.onChangeValue?.(id, event.target.value)
                  }
                  placeholder="42"
                  spellCheck={false}
                />
              )}
              {renderSource(
                id,
                'out.data.value',
                'data',
                resolveMultiplicity('source', 'data'),
                undefined,
                nodeData.onPortContextMenu
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative min-w-[200px] overflow-visible rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.12)] ${
        selected
          ? 'ring-1 ring-slate-500/45 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.16)]'
          : ''
      }`}
    >
      <div className="px-4 pb-2 pt-2.5 font-[Poppins,sans-serif] text-[13px] font-semibold tracking-[0.01em] text-slate-900">
        {nodeData.label}
      </div>
      <div className="pb-2">
        <div className="relative flex min-h-7 items-center px-4 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700">
          {nodeData.kind !== 'start'
            ? renderTarget(
                id,
                'in.control.prev',
                'control',
                resolveMultiplicity('target', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
            : null}
          <span>{nodeData.kind}</span>
          {nodeData.kind !== 'end'
            ? renderSource(
                id,
                'out.control.next',
                'control',
                resolveMultiplicity('source', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
            : null}
        </div>
      </div>
    </div>
  );
};
