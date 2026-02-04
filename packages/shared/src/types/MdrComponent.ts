import React from 'react';

export interface MdrComponent {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  dataAttributes?: Record<string, string>;
  onClick?: React.MouseEventHandler;
  as?: React.ElementType;
}
