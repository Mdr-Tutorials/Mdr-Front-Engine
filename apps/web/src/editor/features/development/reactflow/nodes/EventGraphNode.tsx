import {
  renderSource,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import {
  buildNodeContainerClass,
  CollapseSummary,
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

const getFieldMeta = (kind: GraphNodeData['kind'], t: NodeI18n) => {
  if (kind === 'onClick') {
    return {
      field: 'selector' as const,
      placeholder: tNode(t, 'event.onClick.selectorPlaceholder', '#submit-btn'),
      label: tNode(t, 'common.rows.selector', 'selector'),
    };
  }
  if (kind === 'onInput') {
    return {
      field: 'selector' as const,
      placeholder: tNode(
        t,
        'event.onInput.selectorPlaceholder',
        'input[name="email"]'
      ),
      label: tNode(t, 'common.rows.selector', 'selector'),
    };
  }
  if (kind === 'onSubmit') {
    return {
      field: 'selector' as const,
      placeholder: tNode(
        t,
        'event.onSubmit.selectorPlaceholder',
        'form#checkout'
      ),
      label: tNode(t, 'common.rows.selector', 'selector'),
    };
  }
  if (kind === 'onRouteEnter') {
    return {
      field: 'routePath' as const,
      placeholder: tNode(
        t,
        'event.onRouteEnter.routePlaceholder',
        '/orders/:id'
      ),
      label: tNode(t, 'common.rows.route', 'route'),
    };
  }
  if (kind === 'onTimer') {
    return {
      field: 'timeoutMs' as const,
      placeholder: tNode(t, 'event.onTimer.intervalPlaceholder', '1000'),
      label: tNode(t, 'event.onTimer.intervalLabel', 'interval(ms)'),
    };
  }
  return null;
};

export const renderEventGraphNode = ({ id, nodeData, selected, t }: Props) => {
  const meta = getFieldMeta(nodeData.kind, t);
  const summaryValue = meta ? String(nodeData[meta.field] ?? '') : '';
  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
      <NodeHeader
        title={nodeData.label}
        summary={
          summaryValue ? (
            <CollapseSummary text={summaryValue} title={summaryValue} />
          ) : null
        }
      />
      <div className="pb-2">
        {meta ? (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={String(nodeData[meta.field] ?? '')}
              onChange={(event) =>
                nodeData.onChangeField?.(id, meta.field, event.target.value)
              }
              placeholder={meta.placeholder}
              spellCheck={false}
            />
          </div>
        ) : null}
        <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
          <span>
            {meta ? meta.label : tNode(t, 'event.trigger', 'trigger')}
          </span>
          {renderSource(
            id,
            'out.control.next',
            'control',
            resolveMultiplicity('source', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        </div>
      </div>
    </div>
  );
};
