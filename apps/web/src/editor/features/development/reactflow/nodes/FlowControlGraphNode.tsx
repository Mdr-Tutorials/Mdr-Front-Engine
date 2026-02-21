import {
  formatCountLabel,
  normalizeBranches,
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  BranchListEditor,
  buildNodeContainerClass,
  CollapseSummary,
  NODE_TEXT_INPUT_CLASS,
  NodeHeader,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

const renderRowLabel = (
  id: string,
  nodeData: GraphNodeData,
  label: string,
  inHandle: string | null,
  outHandle: string | null,
  semantic: 'control' | 'data' | 'condition' = 'control'
) => (
  <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
    {inHandle
      ? renderTarget(
          id,
          inHandle,
          semantic,
          resolveMultiplicity('target', semantic),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
    <span>{label}</span>
    {outHandle
      ? renderSource(
          id,
          outHandle,
          semantic,
          resolveMultiplicity('source', semantic),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
  </div>
);

export const renderFlowControlGraphNode = ({
  id,
  nodeData,
  selected,
}: Props) => {
  const isCollapsed = Boolean(nodeData.collapsed);

  if (nodeData.kind === 'start') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[190px]')}>
        <NodeHeader title={nodeData.label} />
        <div className="relative flex min-h-7 items-center px-4 pb-2 text-[11px] font-normal text-slate-700">
          <span>entry</span>
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
    );
  }

  if (nodeData.kind === 'end') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[190px]')}>
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
        <div className="px-4 pb-2 text-[11px] font-normal text-slate-500">
          exit
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'process') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
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
          summary={
            nodeData.value?.trim() ? (
              <CollapseSummary
                text={nodeData.value.trim()}
                title={nodeData.value.trim()}
              />
            ) : null
          }
        />
        <div className="pb-2">
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.value ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'value', event.target.value)
              }
              placeholder="process step"
              spellCheck={false}
            />
          </div>
          {renderRowLabel(id, nodeData, 'next', null, 'out.control.next')}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'if') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
        <NodeHeader
          title={nodeData.label}
          collapsed={isCollapsed}
          onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
          collapseAriaLabel={isCollapsed ? 'expand if' : 'collapse if'}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
          summary={
            isCollapsed ? (
              <CollapseSummary text="2 branches" title="true/false branches" />
            ) : null
          }
        />
        {isCollapsed ? (
          <>
            {renderTarget(
              id,
              'in.condition.guard',
              'condition',
              resolveMultiplicity('target', 'condition'),
              '52%',
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.true',
              'control',
              resolveMultiplicity('source', 'control'),
              '42%',
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.false',
              'control',
              resolveMultiplicity('source', 'control'),
              '66%',
              nodeData.onPortContextMenu
            )}
          </>
        ) : (
          <div className="pb-2">
            {renderRowLabel(
              id,
              nodeData,
              'condition',
              'in.condition.guard',
              null,
              'condition'
            )}
            {renderRowLabel(id, nodeData, 'true', null, 'out.control.true')}
            {renderRowLabel(id, nodeData, 'false', null, 'out.control.false')}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'forEach') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[230px]')}>
        <NodeHeader
          title={nodeData.label}
          collapsed={isCollapsed}
          onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
          collapseAriaLabel={
            isCollapsed ? 'expand foreach' : 'collapse foreach'
          }
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
          summary={
            isCollapsed ? (
              <CollapseSummary
                text={nodeData.value?.trim() || 'item'}
                title="iteration variable"
              />
            ) : null
          }
        />
        {isCollapsed ? (
          <>
            {renderTarget(
              id,
              'in.data.items',
              'data',
              resolveMultiplicity('target', 'data'),
              '56%',
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.body',
              'control',
              resolveMultiplicity('source', 'control'),
              '40%',
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.done',
              'control',
              resolveMultiplicity('source', 'control'),
              '64%',
              nodeData.onPortContextMenu
            )}
          </>
        ) : (
          <div className="pb-2">
            <div className="px-4 pb-1">
              <input
                className={NODE_TEXT_INPUT_CLASS}
                value={nodeData.value ?? ''}
                onChange={(event) =>
                  nodeData.onChangeField?.(id, 'value', event.target.value)
                }
                placeholder="item"
                spellCheck={false}
              />
            </div>
            {renderRowLabel(
              id,
              nodeData,
              'items',
              'in.data.items',
              null,
              'data'
            )}
            {renderRowLabel(id, nodeData, 'body', null, 'out.control.body')}
            {renderRowLabel(id, nodeData, 'done', null, 'out.control.done')}
            {renderRowLabel(
              id,
              nodeData,
              'item',
              null,
              'out.data.item',
              'data'
            )}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'tryCatch') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
        <NodeHeader
          title={nodeData.label}
          collapsed={isCollapsed}
          onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
          collapseAriaLabel={
            isCollapsed ? 'expand try-catch' : 'collapse try-catch'
          }
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
          summary={
            isCollapsed ? (
              <CollapseSummary
                text="3 branches"
                title="try/catch/finally branches"
              />
            ) : null
          }
        />
        {isCollapsed ? (
          <>
            {renderSource(
              id,
              'out.control.try',
              'control',
              resolveMultiplicity('source', 'control'),
              '38%',
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.catch',
              'control',
              resolveMultiplicity('source', 'control'),
              '56%',
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.finally',
              'control',
              resolveMultiplicity('source', 'control'),
              '74%',
              nodeData.onPortContextMenu
            )}
          </>
        ) : (
          <div className="pb-2">
            {renderRowLabel(id, nodeData, 'try', null, 'out.control.try')}
            {renderRowLabel(id, nodeData, 'catch', null, 'out.control.catch')}
            {renderRowLabel(
              id,
              nodeData,
              'finally',
              null,
              'out.control.finally'
            )}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'delay') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
        <NodeHeader
          title={nodeData.label}
          collapsed={isCollapsed}
          onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
          collapseAriaLabel={isCollapsed ? 'expand delay' : 'collapse delay'}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
          summary={
            isCollapsed ? (
              <CollapseSummary
                text={`${nodeData.timeoutMs?.trim() || '300'} ms`}
                title="delay duration"
              />
            ) : null
          }
        />
        {isCollapsed ? (
          <>
            {renderTarget(
              id,
              'in.data.ms',
              'data',
              resolveMultiplicity('target', 'data'),
              '56%',
              nodeData.onPortContextMenu
            )}
            {renderSource(
              id,
              'out.control.next',
              'control',
              resolveMultiplicity('source', 'control'),
              '50%',
              nodeData.onPortContextMenu
            )}
          </>
        ) : (
          <div className="pb-2">
            <div className="px-4 pb-1">
              <input
                className={NODE_TEXT_INPUT_CLASS}
                value={nodeData.timeoutMs ?? ''}
                onChange={(event) =>
                  nodeData.onChangeField?.(id, 'timeoutMs', event.target.value)
                }
                placeholder="300"
                spellCheck={false}
              />
            </div>
            {renderRowLabel(
              id,
              nodeData,
              'duration input',
              'in.data.ms',
              null,
              'data'
            )}
            {renderRowLabel(id, nodeData, 'next', null, 'out.control.next')}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'parallel' || nodeData.kind === 'race') {
    const branches = normalizeBranches(nodeData.branches);
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[240px]')}>
        <NodeHeader
          title={nodeData.label}
          collapsed={isCollapsed}
          onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
          collapseAriaLabel={
            isCollapsed
              ? `expand ${nodeData.kind}`
              : `collapse ${nodeData.kind}`
          }
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
          summary={
            isCollapsed ? (
              <CollapseSummary
                text={formatCountLabel(branches.length, 'branch', 'branches')}
                title="parallel branches"
              />
            ) : null
          }
        />
        {isCollapsed ? (
          <>
            {branches.map((branch, index) => (
              <div key={`collapsed-branch-${branch.id}`} className="contents">
                {renderSource(
                  id,
                  `out.control.branch-${branch.id}`,
                  'control',
                  resolveMultiplicity('source', 'control'),
                  `${35 + index * 12}%`,
                  nodeData.onPortContextMenu
                )}
              </div>
            ))}
            {renderSource(
              id,
              'out.control.done',
              'control',
              resolveMultiplicity('source', 'control'),
              '78%',
              nodeData.onPortContextMenu
            )}
          </>
        ) : (
          <div className="pb-2">
            <BranchListEditor
              items={branches}
              onAdd={() => nodeData.onAddBranch?.(id)}
              onRemove={(branchId) => nodeData.onRemoveBranch?.(id, branchId)}
              onChangeLabel={(branchId, label) =>
                nodeData.onChangeBranchLabel?.(id, branchId, label)
              }
              renderEnd={(branch) =>
                renderSource(
                  id,
                  `out.control.branch-${branch.id}`,
                  'control',
                  resolveMultiplicity('source', 'control'),
                  undefined,
                  nodeData.onPortContextMenu
                )
              }
            />
            {renderRowLabel(id, nodeData, 'done', null, 'out.control.done')}
          </div>
        )}
      </div>
    );
  }

  return null;
};
