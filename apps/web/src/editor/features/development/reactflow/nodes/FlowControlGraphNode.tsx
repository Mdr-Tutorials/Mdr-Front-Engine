import {
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
import type { NodeI18n } from './nodeI18n';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

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
  t,
}: Props) => {
  const isCollapsed = Boolean(nodeData.collapsed);
  const expandAriaLabel = tNode(
    t,
    'common.aria.expandKind',
    'expand {{kind}}',
    { kind: nodeData.label }
  );
  const collapseAriaLabel = tNode(
    t,
    'common.aria.collapseKind',
    'collapse {{kind}}',
    { kind: nodeData.label }
  );

  if (nodeData.kind === 'start') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[190px]')}>
        <NodeHeader title={nodeData.label} />
        <div className="relative flex min-h-7 items-center px-4 pb-2 text-[11px] font-normal text-slate-700">
          <span>{tNode(t, 'common.rows.entry', 'entry')}</span>
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
          {tNode(t, 'common.rows.exit', 'exit')}
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
              placeholder={tNode(
                t,
                'flowControl.process.stepPlaceholder',
                'process step'
              )}
              spellCheck={false}
            />
          </div>
          {renderRowLabel(
            id,
            nodeData,
            tNode(t, 'common.rows.next', 'next'),
            null,
            'out.control.next'
          )}
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
          collapseAriaLabel={isCollapsed ? expandAriaLabel : collapseAriaLabel}
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
                text={tNode(t, 'flowControl.if.summaryText', '2 branches')}
                title={tNode(
                  t,
                  'flowControl.if.summaryTitle',
                  'true/false branches'
                )}
              />
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
              tNode(t, 'common.rows.condition', 'condition'),
              'in.condition.guard',
              null,
              'condition'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.true', 'true'),
              null,
              'out.control.true'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.false', 'false'),
              null,
              'out.control.false'
            )}
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
          collapseAriaLabel={isCollapsed ? expandAriaLabel : collapseAriaLabel}
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
                text={
                  nodeData.value?.trim() ||
                  tNode(t, 'flowControl.forEach.itemFallback', 'item')
                }
                title={tNode(
                  t,
                  'flowControl.forEach.summaryTitle',
                  'iteration variable'
                )}
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
                placeholder={tNode(
                  t,
                  'flowControl.forEach.itemPlaceholder',
                  'item'
                )}
                spellCheck={false}
              />
            </div>
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.items', 'items'),
              'in.data.items',
              null,
              'data'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.body', 'body'),
              null,
              'out.control.body'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.done', 'done'),
              null,
              'out.control.done'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.item', 'item'),
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
          collapseAriaLabel={isCollapsed ? expandAriaLabel : collapseAriaLabel}
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
                text={tNode(
                  t,
                  'flowControl.tryCatch.summaryText',
                  '3 branches'
                )}
                title={tNode(
                  t,
                  'flowControl.tryCatch.summaryTitle',
                  'try/catch/finally branches'
                )}
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
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.try', 'try'),
              null,
              'out.control.try'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.catch', 'catch'),
              null,
              'out.control.catch'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.finally', 'finally'),
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
          collapseAriaLabel={isCollapsed ? expandAriaLabel : collapseAriaLabel}
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
                text={tNode(
                  t,
                  'flowControl.delay.summaryText',
                  '{{timeout}} ms',
                  { timeout: nodeData.timeoutMs?.trim() || '300' }
                )}
                title={tNode(
                  t,
                  'flowControl.delay.summaryTitle',
                  'delay duration'
                )}
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
                placeholder={tNode(
                  t,
                  'flowControl.delay.timeoutPlaceholder',
                  '300'
                )}
                spellCheck={false}
              />
            </div>
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'flowControl.delay.durationInput', 'duration input'),
              'in.data.ms',
              null,
              'data'
            )}
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.next', 'next'),
              null,
              'out.control.next'
            )}
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
          collapseAriaLabel={isCollapsed ? expandAriaLabel : collapseAriaLabel}
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
                text={tNode(
                  t,
                  'flowControl.parallel.branchCount',
                  '{{count}} branches',
                  { count: branches.length }
                )}
                title={tNode(
                  t,
                  'flowControl.parallel.summaryTitle',
                  'parallel branches'
                )}
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
              t={t}
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
            {renderRowLabel(
              id,
              nodeData,
              tNode(t, 'common.rows.done', 'done'),
              null,
              'out.control.done'
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};
