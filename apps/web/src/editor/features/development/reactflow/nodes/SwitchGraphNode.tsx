import { Plus } from 'lucide-react';
import {
  formatCountLabel,
  normalizeCases,
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  BranchListEditor,
  buildNodeContainerClass,
  NodeHeader,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

export const renderSwitchGraphNode = ({ id, nodeData, selected }: Props) => {
  const cases = normalizeCases(nodeData.cases);
  const isCollapsed = Boolean(nodeData.collapsed);
  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
      {isCollapsed ? (
        <>
          {renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            '25%',
            nodeData.onPortContextMenu
          )}
          {renderTarget(
            id,
            'in.data.value',
            'data',
            resolveMultiplicity('target', 'data'),
            '50%',
            nodeData.onPortContextMenu
          )}
          {cases.map((caseItem) => (
            <div
              key={`collapsed-left-condition-${caseItem.id}`}
              className="contents"
            >
              {renderTarget(
                id,
                `in.condition.case-${caseItem.id}`,
                'condition',
                resolveMultiplicity('target', 'condition'),
                '75%',
                nodeData.onPortContextMenu
              )}
            </div>
          ))}
        </>
      ) : null}
      <NodeHeader
        title={nodeData.label}
        collapsed={isCollapsed}
        onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
        collapseAriaLabel={isCollapsed ? 'expand switch' : 'collapse switch'}
        leftSlot={
          isCollapsed
            ? null
            : renderTarget(
                id,
                'in.control.prev',
                'control',
                resolveMultiplicity('target', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
        }
        actions={
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
        }
      />
      {isCollapsed ? (
        <div className="relative flex min-h-7 items-center px-4 pb-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-500">
          <span>{formatCountLabel(cases.length, 'case', 'cases')}</span>
          {cases.map((caseItem) => (
            <div key={`collapsed-output-${caseItem.id}`} className="contents">
              {renderSource(
                id,
                `out.control.case-${caseItem.id}`,
                'control',
                resolveMultiplicity('source', 'control'),
                '82%',
                nodeData.onPortContextMenu
              )}
            </div>
          ))}
          {renderSource(
            id,
            'out.control.default',
            'control',
            resolveMultiplicity('source', 'control'),
            '82%',
            nodeData.onPortContextMenu
          )}
        </div>
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
          <BranchListEditor
            items={cases}
            onRemove={(branchId) => nodeData.onRemoveCase?.(id, branchId)}
            onChangeLabel={
              nodeData.onChangeBranchLabel
                ? (branchId, label) =>
                    nodeData.onChangeBranchLabel?.(id, branchId, label)
                : undefined
            }
            renderStart={(caseItem) =>
              renderTarget(
                id,
                `in.condition.case-${caseItem.id}`,
                'condition',
                resolveMultiplicity('target', 'condition'),
                undefined,
                nodeData.onPortContextMenu
              )
            }
            renderEnd={(caseItem) =>
              renderSource(
                id,
                `out.control.case-${caseItem.id}`,
                'control',
                resolveMultiplicity('source', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
            }
          />
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
    </div>
  );
};
