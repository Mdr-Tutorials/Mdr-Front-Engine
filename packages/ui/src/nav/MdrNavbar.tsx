import './MdrNavbar.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

export interface MdrNavbarItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface MdrNavbarSpecificProps {
  brand?: React.ReactNode;
  items?: MdrNavbarItem[];
  actions?: React.ReactNode;
  variant?: 'Solid' | 'Transparent' | 'Blurred';
  size?: 'Small' | 'Medium' | 'Large';
  sticky?: boolean;
  children?: React.ReactNode;
}

export interface MdrNavbarProps extends MdrComponent, MdrNavbarSpecificProps {}

function MdrNavbar({
  brand,
  items = [],
  actions,
  variant = 'Solid',
  size = 'Medium',
  sticky = false,
  children,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrNavbarProps) {
  const fullClassName =
    `MdrNavbar ${size} ${variant} ${sticky ? 'Sticky' : ''} ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <nav
      className={fullClassName}
      style={style as React.CSSProperties}
      id={id}
      {...dataProps}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="MdrNavbarBrand">{brand}</div>
          <div className="MdrNavbarItems">
            {items.map((item) => (
              <a
                key={item.label}
                href={item.href || '#'}
                className={`MdrNavbarItem ${item.active ? 'Active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="MdrNavbarActions">{actions}</div>
        </>
      )}
    </nav>
  );
}

export default MdrNavbar;
