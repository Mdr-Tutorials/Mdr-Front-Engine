import {
  renderSource,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  buildNodeContainerClass,
  CollapseSummary,
  NODE_TEXT_INPUT_CLASS,
  NodeHeader,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

const getFieldMeta = (kind: GraphNodeData['kind']) => {
  if (kind === 'onClick') {
    return {
      field: 'selector' as const,
      placeholder: '#submit-btn',
      label: 'selector',
    };
  }
  if (kind === 'onInput') {
    return {
      field: 'selector' as const,
      placeholder: 'input[name="email"]',
      label: 'selector',
    };
  }
  if (kind === 'onSubmit') {
    return {
      field: 'selector' as const,
      placeholder: 'form#checkout',
      label: 'selector',
    };
  }
  if (kind === 'onRouteEnter') {
    return {
      field: 'routePath' as const,
      placeholder: '/orders/:id',
      label: 'route',
    };
  }
  if (kind === 'onTimer') {
    return {
      field: 'timeoutMs' as const,
      placeholder: '1000',
      label: 'interval(ms)',
    };
  }
  return null;
};

export const renderEventGraphNode = ({ id, nodeData, selected }: Props) => {
  const meta = getFieldMeta(nodeData.kind);
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
          <span>{meta ? meta.label : 'trigger'}</span>
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
