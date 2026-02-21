import {
  renderSource,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  buildNodeContainerClass,
  CollapseSummary,
  NODE_TEXT_INPUT_CLASS,
  NODE_TEXTAREA_CLASS,
  NodeHeader,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

export const renderValueGraphNode = ({ id, nodeData, selected }: Props) => {
  const isCollapsed = Boolean(nodeData.collapsed);
  const defaultValueByKind: Record<
    'string' | 'number' | 'boolean' | 'object' | 'array',
    string
  > = {
    string: 'hello',
    number: '42',
    boolean: 'true',
    object: '{"key":"value"}',
    array: '[1,2,3]',
  };
  const valueKind =
    nodeData.kind === 'string' ||
    nodeData.kind === 'number' ||
    nodeData.kind === 'boolean' ||
    nodeData.kind === 'object' ||
    nodeData.kind === 'array'
      ? nodeData.kind
      : 'string';
  const collapsedValue = nodeData.value || defaultValueByKind[valueKind];
  const useTextarea =
    nodeData.kind === 'string' ||
    nodeData.kind === 'object' ||
    nodeData.kind === 'array';
  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[200px]')}>
      <NodeHeader
        title={nodeData.label}
        collapsed={isCollapsed}
        onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
        collapseAriaLabel={
          isCollapsed ? `expand ${nodeData.kind}` : `collapse ${nodeData.kind}`
        }
        summary={
          isCollapsed ? (
            <CollapseSummary text={collapsedValue} title={collapsedValue} />
          ) : null
        }
      />
      {isCollapsed
        ? renderSource(
            id,
            'out.data.value',
            'data',
            resolveMultiplicity('source', 'data'),
            '50%',
            nodeData.onPortContextMenu
          )
        : null}
      {isCollapsed ? null : (
        <div className="pb-2">
          <div className="relative px-4 pb-1">
            {useTextarea ? (
              <textarea
                className={NODE_TEXTAREA_CLASS}
                value={nodeData.value ?? ''}
                onChange={(event) =>
                  nodeData.onChangeValue?.(id, event.target.value)
                }
                onInput={(event) => {
                  const element = event.currentTarget;
                  element.style.height = '0px';
                  element.style.height = `${element.scrollHeight}px`;
                }}
                placeholder={defaultValueByKind[valueKind]}
                rows={2}
                spellCheck={false}
              />
            ) : (
              <input
                className={NODE_TEXT_INPUT_CLASS}
                value={nodeData.value ?? ''}
                onChange={(event) =>
                  nodeData.onChangeValue?.(id, event.target.value)
                }
                placeholder={defaultValueByKind[valueKind]}
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
};
