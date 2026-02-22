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

export const renderRoutingGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  const kind = nodeData.kind;
  const isNavigate = kind === 'navigate';
  const isRouteParams = kind === 'routeParams';
  const isRouteQuery = kind === 'routeQuery';
  const isRouteGuard = kind === 'routeGuard';

  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[230px]')}>
      <NodeHeader
        title={nodeData.label}
        leftSlot={
          isNavigate || isRouteGuard
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
        {(isNavigate || isRouteGuard || isRouteParams || isRouteQuery) && (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.routePath ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'routePath', event.target.value)
              }
              placeholder={
                isRouteParams || isRouteQuery
                  ? tNode(t, 'routing.placeholders.routePattern', '/orders/:id')
                  : tNode(t, 'routing.placeholders.navigatePath', '/dashboard')
              }
              spellCheck={false}
            />
          </div>
        )}

        {isNavigate
          ? row(id, nodeData, tNode(t, 'routing.rows.to', 'to'), {
              inHandle: 'in.data.value',
              outHandle: 'out.control.next',
              inSemantic: 'data',
              outSemantic: 'control',
            })
          : null}
        {isRouteParams
          ? row(id, nodeData, tNode(t, 'routing.rows.params', 'params'), {
              outHandle: 'out.data.value',
              outSemantic: 'data',
            })
          : null}
        {isRouteQuery
          ? row(id, nodeData, tNode(t, 'routing.rows.query', 'query'), {
              outHandle: 'out.data.value',
              outSemantic: 'data',
            })
          : null}
        {isRouteGuard
          ? row(id, nodeData, tNode(t, 'routing.rows.allow', 'allow?'), {
              inHandle: 'in.condition.value',
              outHandle: 'out.control.next',
              inSemantic: 'condition',
              outSemantic: 'control',
            })
          : null}
      </div>
    </div>
  );
};
