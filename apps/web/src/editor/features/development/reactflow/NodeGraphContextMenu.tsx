import {
  MENU_COLUMN_GAP,
  MENU_COLUMN_WIDTH,
  type ContextMenuItem,
  type ContextMenuState,
} from './nodeGraphEditorModel';
import type { ContextMenuLayout } from './nodeGraphMenuModel';

type NodeGraphContextMenuProps = {
  menu: ContextMenuState;
  menuColumns: ContextMenuItem[][];
  menuLayout: ContextMenuLayout;
  onMenuItemEnter: (level: number, index: number, hasChildren: boolean) => void;
};

export const NodeGraphContextMenu = ({
  menu,
  menuColumns,
  menuLayout,
  onMenuItemEnter,
}: NodeGraphContextMenuProps) => {
  if (!menu) return null;
  return menuColumns.map((items, level) => (
    <div
      key={`menu-column-${level}`}
      className="native-context-menu"
      style={{
        left:
          menuLayout?.lefts[level] ??
          menu.x + level * (MENU_COLUMN_WIDTH + MENU_COLUMN_GAP),
        top: menuLayout?.top ?? menu.y,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={item.tone === 'danger' ? 'is-danger' : undefined}
          onMouseEnter={() =>
            onMenuItemEnter(level, index, Boolean(item.children?.length))
          }
          onClick={() => {
            if (item.children?.length) {
              onMenuItemEnter(level, index, true);
              return;
            }
            item.onSelect?.();
          }}
        >
          <span>{item.icon ?? ''}</span>
          <span>{item.label}</span>
          <span className="native-context-menu__arrow">
            {item.children?.length ? '›' : ''}
          </span>
        </button>
      ))}
    </div>
  ));
};
