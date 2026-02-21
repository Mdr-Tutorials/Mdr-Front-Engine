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
  NodeValidationHint,
  SelectField,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

const row = (
  id: string,
  nodeData: GraphNodeData,
  label: string,
  options: {
    inHandle?: string;
    outHandle?: string;
    inSemantic?: 'control' | 'data' | 'condition';
    outSemantic?: 'control' | 'data' | 'condition';
  }
) => (
  <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
    {options.inHandle
      ? renderTarget(
          id,
          options.inHandle,
          options.inSemantic ?? 'control',
          resolveMultiplicity('target', options.inSemantic ?? 'control'),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
    <span>{label}</span>
    {options.outHandle
      ? renderSource(
          id,
          options.outHandle,
          options.outSemantic ?? 'control',
          resolveMultiplicity('source', options.outSemantic ?? 'control'),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
  </div>
);

export const renderInteractionMotionGraphNode = ({
  id,
  nodeData,
  selected,
}: Props) => {
  if (nodeData.kind === 'playAnimation') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[260px]')}>
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
        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.targetId ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'targetId', event.target.value)
              }
              placeholder="target id"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.timelineName ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'timelineName', event.target.value)
              }
              placeholder="timeline"
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.action ?? 'play'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'action', value)
              }
              options={[
                { value: 'play', label: 'play' },
                { value: 'pause', label: 'pause' },
                { value: 'reverse', label: 'reverse' },
                { value: 'stop', label: 'stop' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.speed ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'speed', event.target.value)
              }
              placeholder="speed"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.iterations ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'iterations', event.target.value)
              }
              placeholder="loops"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'target', {
            inHandle: 'in.data.target',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'timeline', {
            inHandle: 'in.data.timeline',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'start', { outHandle: 'out.control.start' })}
          {row(id, nodeData, 'complete', { outHandle: 'out.control.complete' })}
          {row(id, nodeData, 'error', { outHandle: 'out.control.error' })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'scrollTo') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[250px]')}>
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
        <div className="pb-1">
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.target ?? 'top'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'target', value)
              }
              options={[
                { value: 'top', label: 'top' },
                { value: 'bottom', label: 'bottom' },
                { value: 'selector', label: 'selector' },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.behavior ?? 'smooth'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'behavior', value)
              }
              options={[
                { value: 'smooth', label: 'smooth' },
                { value: 'auto', label: 'auto' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.offset ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'offset', event.target.value)
              }
              placeholder="offset"
              spellCheck={false}
            />
          </div>
          {nodeData.target === 'selector' ? (
            <div className="px-4 pb-1">
              <input
                className={NODE_TEXT_INPUT_CLASS}
                value={nodeData.selector ?? ''}
                onChange={(event) =>
                  nodeData.onChangeField?.(id, 'selector', event.target.value)
                }
                placeholder="#selector"
                spellCheck={false}
              />
            </div>
          ) : null}
          {row(id, nodeData, 'target', {
            inHandle: 'in.data.target',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'done', { outHandle: 'out.control.done' })}
          {row(id, nodeData, 'error', { outHandle: 'out.control.error' })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'focusControl') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[240px]')}>
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
        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.action ?? 'focus'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'action', value)
              }
              options={[
                { value: 'focus', label: 'focus' },
                { value: 'blur', label: 'blur' },
                { value: 'select', label: 'select' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.selector ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'selector', event.target.value)
              }
              placeholder="#input"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'target', {
            inHandle: 'in.data.target',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'done', { outHandle: 'out.control.done' })}
          {row(id, nodeData, 'error', { outHandle: 'out.control.error' })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'clipboard') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[230px]')}>
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
        <div className="pb-1">
          <div className="px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.mode ?? 'copy'}
              onChange={(value) => nodeData.onChangeField?.(id, 'mode', value)}
              options={[
                { value: 'copy', label: 'copy' },
                { value: 'read', label: 'read' },
              ]}
            />
          </div>
          {row(id, nodeData, 'value in', {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'done', { outHandle: 'out.control.done' })}
          {row(id, nodeData, 'error', { outHandle: 'out.control.error' })}
          {row(id, nodeData, 'value out', {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  return null;
};
