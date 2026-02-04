import './MdrBadge.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrBadgeSpecificProps {
  count?: number;
  max?: number;
  dot?: boolean;
  showZero?: boolean;
  color?: string;
  children?: React.ReactNode;
}

export interface MdrBadgeProps extends MdrComponent, MdrBadgeSpecificProps {}

function MdrBadge({
  count = 0,
  max = 99,
  dot = false,
  showZero = false,
  color,
  children,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;
  const showBadge = dot || count > 0 || showZero;

  const fullClassName = `MdrBadge ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <span
      className={fullClassName}
      style={style as React.CSSProperties}
      id={id}
      {...dataProps}
    >
      {children}
      {showBadge && (
        <span
          className={`MdrBadgeCount ${dot ? 'Dot' : ''}`}
          style={color ? { backgroundColor: color } : undefined}
        >
          {!dot && displayCount}
        </span>
      )}
    </span>
  );
}

export default MdrBadge;
