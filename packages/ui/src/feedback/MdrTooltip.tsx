import './MdrTooltip.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrTooltipSpecificProps {
  content: React.ReactNode;
  placement?: 'Top' | 'Right' | 'Bottom' | 'Left';
  children: React.ReactNode;
}

export interface MdrTooltipProps
  extends MdrComponent,
    MdrTooltipSpecificProps {}

function MdrTooltip({
  content,
  placement = 'Top',
  children,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrTooltipProps) {
  const fullClassName = `MdrTooltip ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <span
      className={fullClassName}
      style={style as React.CSSProperties}
      id={id}
      {...dataProps}
    >
      {children}
      <span className={`MdrTooltipContent ${placement}`}>{content}</span>
    </span>
  );
}

export default MdrTooltip;
