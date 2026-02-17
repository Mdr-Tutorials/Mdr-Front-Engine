import type React from 'react';
import { type MdrComponent } from '@mdr/shared';
import './MdrOutlet.scss';

interface MdrOutletSpecificProps {
  emptyText?: string;
  children?: React.ReactNode;
}

export interface MdrOutletProps extends MdrComponent, MdrOutletSpecificProps {}

function MdrOutlet({
  emptyText = 'Outlet is empty.',
  children,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrOutletProps) {
  const hasContent = children !== undefined && children !== null;

  return (
    <div
      className={`MdrOutlet ${className ?? ''}`.trim()}
      style={style}
      id={id}
      {...dataAttributes}
    >
      {hasContent ? (
        children
      ) : (
        <div className="MdrOutletEmpty">{emptyText}</div>
      )}
    </div>
  );
}

export default MdrOutlet;
