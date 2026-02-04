import './MdrSidebar.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

export interface MdrSidebarItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface MdrSidebarSpecificProps {
  title?: string;
  items?: MdrSidebarItem[];
  footer?: React.ReactNode;
  collapsed?: boolean;
  width?: number;
  children?: React.ReactNode;
}

export interface MdrSidebarProps
  extends MdrComponent,
    MdrSidebarSpecificProps {}

function MdrSidebar({
  title,
  items = [],
  footer,
  collapsed = false,
  width = 240,
  children,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrSidebarProps) {
  const fullClassName =
    `MdrSidebar ${collapsed ? 'Collapsed' : ''} ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <aside
      className={fullClassName}
      style={{ width, ...(style as React.CSSProperties) }}
      id={id}
      {...dataProps}
    >
      {title && <div className="MdrSidebarTitle">{title}</div>}
      {children ? (
        children
      ) : (
        <nav className="MdrSidebarNav">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href || '#'}
              className={`MdrSidebarItem ${item.active ? 'Active' : ''}`}
            >
              {item.icon && <span className="MdrSidebarIcon">{item.icon}</span>}
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
      )}
      {footer && <div className="MdrSidebarFooter">{footer}</div>}
    </aside>
  );
}

export default MdrSidebar;
