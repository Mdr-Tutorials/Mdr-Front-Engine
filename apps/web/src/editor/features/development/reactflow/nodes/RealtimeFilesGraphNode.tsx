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

export const renderRealtimeFilesGraphNode = ({
  id,
  nodeData,
  selected,
}: Props) => {
  if (nodeData.kind === 'webSocket') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[290px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.connect',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.protocols ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'protocols', event.target.value)
              }
              placeholder="protocols (comma separated)"
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.autoReconnect ?? 'true'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'autoReconnect', value)
              }
              options={[
                { value: 'true', label: 'reconnect' },
                { value: 'false', label: 'manual' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.reconnectMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'reconnectMs', event.target.value)
              }
              placeholder="reconnect"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.heartbeatMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'heartbeatMs', event.target.value)
              }
              placeholder="heartbeat"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'send', { inHandle: 'in.control.send' })}
          {row(id, nodeData, 'disconnect', {
            inHandle: 'in.control.disconnect',
          })}
          {row(id, nodeData, 'url', {
            inHandle: 'in.data.url',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'payload', {
            inHandle: 'in.data.payload',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'open', { outHandle: 'out.control.open' })}
          {row(id, nodeData, 'message', { outHandle: 'out.control.message' })}
          {row(id, nodeData, 'close', { outHandle: 'out.control.close' })}
          {row(id, nodeData, 'error', { outHandle: 'out.control.error' })}
          {row(id, nodeData, 'message data', {
            outHandle: 'out.data.message',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'state', {
            outHandle: 'out.data.state',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'uploadFile') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[280px]')}>
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
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.endpoint ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'endpoint', event.target.value)
              }
              placeholder="/api/upload"
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.method ?? 'POST'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'method', value)
              }
              options={[
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'PATCH', label: 'PATCH' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.fieldName ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'fieldName', event.target.value)
              }
              placeholder="field"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.maxSizeMB ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'maxSizeMB', event.target.value)
              }
              placeholder="MB"
              spellCheck={false}
            />
          </div>
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.accept ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'accept', event.target.value)
              }
              placeholder="accept"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'file', {
            inHandle: 'in.data.file',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'extra', {
            inHandle: 'in.data.extra',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'progress', { outHandle: 'out.control.progress' })}
          {row(id, nodeData, 'success', { outHandle: 'out.control.success' })}
          {row(id, nodeData, 'error', { outHandle: 'out.control.error' })}
          {row(id, nodeData, 'progress data', {
            outHandle: 'out.data.progress',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'url', {
            outHandle: 'out.data.url',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'response', {
            outHandle: 'out.data.response',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'download') {
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
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.filename ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'filename', event.target.value)
              }
              placeholder="filename"
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.openMode ?? 'save'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'openMode', value)
              }
              options={[
                { value: 'save', label: 'save' },
                { value: 'open', label: 'open' },
              ]}
            />
          </div>
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.mimeType ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'mimeType', event.target.value)
              }
              placeholder="mime"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'url', {
            inHandle: 'in.data.url',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'blob', {
            inHandle: 'in.data.blob',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'done', { outHandle: 'out.control.done' })}
          {row(id, nodeData, 'error', { outHandle: 'out.control.error' })}
        </div>
      </div>
    );
  }

  return null;
};
