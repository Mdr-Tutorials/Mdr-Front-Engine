import './MdrEmpty.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrEmptySpecificProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export interface MdrEmptyProps extends MdrComponent, MdrEmptySpecificProps {}

function MdrEmpty({
  title = 'No data',
  description,
  icon,
  action,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrEmptyProps) {
  const fullClassName = `MdrEmpty ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <div
      className={fullClassName}
      style={style as React.CSSProperties}
      id={id}
      {...dataProps}
    >
      {icon && <div className="MdrEmptyIcon">{icon}</div>}
      <div className="MdrEmptyTitle">{title}</div>
      {description && <div className="MdrEmptyDescription">{description}</div>}
      {action && <div className="MdrEmptyAction">{action}</div>}
    </div>
  );
}

export default MdrEmpty;
