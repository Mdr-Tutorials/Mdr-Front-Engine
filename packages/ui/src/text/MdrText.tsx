import './MdrText.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrTextSpecificProps {
  children: React.ReactNode;
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Big';
  weight?: 'Light' | 'Normal' | 'Medium' | 'SemiBold' | 'Bold';
  color?:
    | 'Default'
    | 'Muted'
    | 'Primary'
    | 'Secondary'
    | 'Danger'
    | 'Warning'
    | 'Success';
  align?: 'Left' | 'Center' | 'Right';
  truncate?: boolean;
}

export interface MdrTextProps extends MdrComponent, MdrTextSpecificProps {}

function MdrText({
  children,
  size = 'Medium',
  weight = 'Normal',
  color = 'Default',
  align = 'Left',
  truncate = false,
  as: Component = 'span',
  className,
  style,
  id,
  dataAttributes = {},
}: MdrTextProps) {
  const fullClassName =
    `MdrText ${size} ${weight} ${color} ${align} ${truncate ? 'Truncate' : ''} ${className || ''}`.trim();

  const dataProps = { ...dataAttributes };

  const Element = Component as React.ElementType;

  return (
    <Element className={fullClassName} style={style} id={id} {...dataProps}>
      {children}
    </Element>
  );
}

export default MdrText;
