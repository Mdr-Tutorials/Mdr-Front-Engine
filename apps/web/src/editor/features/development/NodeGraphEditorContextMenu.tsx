import { useTranslation } from 'react-i18next';
import type { NodeGraphEditorController } from './NodeGraphEditor.controller';
import { EDGE_COLOR_OPTIONS } from './nodeGraph/constants';

type NodeGraphEditorContextMenuProps = {
  contextMenu: NodeGraphEditorController['contextMenu'];
};

export const NodeGraphEditorContextMenu = ({
  contextMenu,
}: NodeGraphEditorContextMenuProps) => {
  const { t } = useTranslation('editor');
  const menu = contextMenu.state;
  if (!menu) return null;

  return (
    <div
      ref={contextMenu.refs.menuRef}
      className="absolute z-30 w-[220px] rounded-[12px] border border-black/12 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur"
      style={{
        left: menu.x,
        top: menu.y,
      }}
      data-testid="nodegraph-context-menu"
    >
      {menu.kind === 'node' ? (
        <div className="grid gap-1">
          <button
            type="button"
            className="flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
            onClick={() => {
              contextMenu.onDuplicateNode(menu.nodeId);
            }}
          >
            {t('nodeGraph.contextMenu.duplicateNode', {
              defaultValue: 'Duplicate in place',
            })}
          </button>
          <button
            type="button"
            className="flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
            onClick={() => {
              contextMenu.onDeleteNode(menu.nodeId);
            }}
          >
            {t('nodeGraph.contextMenu.deleteNode', {
              defaultValue: 'Delete node',
            })}
          </button>
        </div>
      ) : menu.kind === 'port' || menu.kind === 'canvas' ? (
        <div className="relative grid gap-1">
          {contextMenu.canCreateNode ? (
            <button
              ref={contextMenu.refs.createRootItemRef}
              type="button"
              className="flex h-8 items-center justify-between rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
              onClick={contextMenu.onToggleCreateMenu}
            >
              <span>
                {t('nodeGraph.contextMenu.createNode', {
                  defaultValue: 'Create node',
                })}
              </span>
              <span className="text-[10px] text-(--color-6)">›</span>
            </button>
          ) : null}

          {menu.kind === 'port' ? (
            <button
              type="button"
              className="flex h-8 items-center rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={contextMenu.portConnectionCount === 0}
              onClick={() => {
                contextMenu.onDisconnectPort(
                  menu.nodeId,
                  menu.portId,
                  menu.role
                );
              }}
            >
              {t('nodeGraph.contextMenu.disconnectPort', {
                defaultValue: 'Disconnect',
              })}
            </button>
          ) : null}

          {contextMenu.canCreateNode && contextMenu.isCreateMenuOpen ? (
            <div
              ref={contextMenu.refs.createGroupMenuRef}
              className="absolute left-[calc(100%+6px)] w-[186px] rounded-[12px] border border-black/12 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)]"
              style={{ top: contextMenu.createMenuTop }}
            >
              <div className="relative grid gap-1">
                {contextMenu.createNodeGroups.map((group) => (
                  <button
                    key={`port-create-group-${group.id}`}
                    type="button"
                    className="flex h-8 items-center justify-between rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
                    onMouseEnter={(event) =>
                      contextMenu.onSelectCreateGroup(
                        group.id,
                        event.currentTarget
                      )
                    }
                    onClick={(event) =>
                      contextMenu.onSelectCreateGroup(
                        group.id,
                        event.currentTarget
                      )
                    }
                  >
                    <span>{group.label}</span>
                    <span className="text-[10px] text-(--color-6)">›</span>
                  </button>
                ))}
                {contextMenu.activeCreateGroup ? (
                  <div
                    className="absolute left-[calc(100%+6px)] w-[186px] rounded-[12px] border border-black/12 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)]"
                    style={{ top: contextMenu.createLeafMenuTop }}
                  >
                    <div className="grid gap-1">
                      {contextMenu.activeCreateGroup.items.map((item) => (
                        <button
                          key={`port-create-${contextMenu.activeCreateGroup?.id}-${item.type}`}
                          type="button"
                          className="flex h-8 items-center rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
                          onClick={() => {
                            contextMenu.onCreateNode(item.type);
                          }}
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-1">
          <div className="px-2 pb-1 text-[11px] font-semibold text-(--color-7)">
            {t('nodeGraph.contextMenu.edgeColor', {
              defaultValue: 'Edge color',
            })}
          </div>
          {EDGE_COLOR_OPTIONS.map((option) => {
            const currentColor =
              contextMenu.edge?.metadata &&
              typeof contextMenu.edge.metadata.color === 'string'
                ? contextMenu.edge.metadata.color
                : null;
            const isActive =
              option.color === null
                ? currentColor === null
                : currentColor === option.color;
            return (
              <button
                key={option.key}
                type="button"
                className="flex h-8 items-center gap-2 rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
                onClick={() => {
                  contextMenu.onChangeEdgeColor(menu.edgeId, option.color);
                }}
              >
                <span
                  className="h-3 w-3 rounded-full border border-black/25"
                  style={{
                    backgroundColor: option.color ?? 'transparent',
                  }}
                />
                <span className="flex-1">{option.label}</span>
                {isActive ? <span>✓</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
