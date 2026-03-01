import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import {
  buildNodeContainerClass,
  NODE_TEXT_INPUT_CLASS,
  NodeHeader,
  SelectField,
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
  t,
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
              placeholder={tNode(
                t,
                'realtimeFiles.webSocket.protocolsPlaceholder',
                'protocols (comma separated)'
              )}
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
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'realtimeFiles.webSocket.autoReconnect.true',
                    'reconnect'
                  ),
                },
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'realtimeFiles.webSocket.autoReconnect.false',
                    'manual'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.reconnectMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'reconnectMs', event.target.value)
              }
              placeholder={tNode(
                t,
                'realtimeFiles.webSocket.reconnectMsPlaceholder',
                'reconnect'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.heartbeatMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'heartbeatMs', event.target.value)
              }
              placeholder={tNode(
                t,
                'realtimeFiles.webSocket.heartbeatMsPlaceholder',
                'heartbeat'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.send', 'send'), {
            inHandle: 'in.control.send',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.disconnect', 'disconnect'), {
            inHandle: 'in.control.disconnect',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.url', 'url'), {
            inHandle: 'in.data.url',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.payload', 'payload'), {
            inHandle: 'in.data.payload',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.open', 'open'), {
            outHandle: 'out.control.open',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.message', 'message'), {
            outHandle: 'out.control.message',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.close', 'close'), {
            outHandle: 'out.control.close',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
          {row(
            id,
            nodeData,
            tNode(t, 'realtimeFiles.rows.messageData', 'message data'),
            {
              outHandle: 'out.data.message',
              outSemantic: 'data',
            }
          )}
          {row(id, nodeData, tNode(t, 'common.rows.state', 'state'), {
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
              placeholder={tNode(
                t,
                'realtimeFiles.upload.endpointPlaceholder',
                '/api/upload'
              )}
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
              placeholder={tNode(
                t,
                'realtimeFiles.upload.fieldNamePlaceholder',
                'field'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.maxSizeMB ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'maxSizeMB', event.target.value)
              }
              placeholder={tNode(
                t,
                'realtimeFiles.upload.maxSizePlaceholder',
                'MB'
              )}
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
              placeholder={tNode(
                t,
                'realtimeFiles.upload.acceptPlaceholder',
                'accept'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.file', 'file'), {
            inHandle: 'in.data.file',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.extra', 'extra'), {
            inHandle: 'in.data.extra',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.progress', 'progress'), {
            outHandle: 'out.control.progress',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.success', 'success'), {
            outHandle: 'out.control.success',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
          {row(
            id,
            nodeData,
            tNode(t, 'realtimeFiles.rows.progressData', 'progress data'),
            {
              outHandle: 'out.data.progress',
              outSemantic: 'data',
            }
          )}
          {row(id, nodeData, tNode(t, 'common.rows.url', 'url'), {
            outHandle: 'out.data.url',
            outSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.response', 'response'), {
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
              placeholder={tNode(
                t,
                'realtimeFiles.download.filenamePlaceholder',
                'filename'
              )}
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.openMode ?? 'save'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'openMode', value)
              }
              options={[
                {
                  value: 'save',
                  label: tNode(
                    t,
                    'realtimeFiles.download.openMode.save',
                    'save'
                  ),
                },
                {
                  value: 'open',
                  label: tNode(
                    t,
                    'realtimeFiles.download.openMode.open',
                    'open'
                  ),
                },
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
              placeholder={tNode(
                t,
                'realtimeFiles.download.mimeTypePlaceholder',
                'mime'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.url', 'url'), {
            inHandle: 'in.data.url',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.blob', 'blob'), {
            inHandle: 'in.data.blob',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.done', 'done'), {
            outHandle: 'out.control.done',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
        </div>
      </div>
    );
  }

  return null;
};
