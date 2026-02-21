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

export const renderExpressionGraphNode = ({
  id,
  nodeData,
  selected,
}: Props) => {
  const isCollapsed = Boolean(nodeData.collapsed);
  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
      <NodeHeader
        title={nodeData.label}
        collapsed={isCollapsed}
        onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
        collapseAriaLabel={
          isCollapsed ? 'expand expression' : 'collapse expression'
        }
        summary={
          isCollapsed ? (
            <CollapseSummary
              text={nodeData.expression || 'expression'}
              title={nodeData.expression || 'expression'}
            />
          ) : null
        }
      />
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
      {isCollapsed ? null : (
        <div className="pb-2">
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
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
};
