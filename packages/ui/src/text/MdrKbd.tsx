import './MdrKbd.scss';
import { type MdrComponent } from '@mdr/shared';
import { Keyboard } from 'lucide-react';
import type React from 'react';

interface MdrKbdSpecificProps {
  children?: React.ReactNode;
  text?: string;
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large';
  texture?: 'Flat' | 'Soft' | 'Raised' | 'Inset';
  tone?: 'Default' | 'Muted' | 'Primary' | 'Danger' | 'Warning' | 'Success';
  showIcon?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'Left' | 'Right';
  bordered?: boolean;
  filled?: boolean;
}

export interface MdrKbdProps extends MdrComponent, MdrKbdSpecificProps {}

function MdrKbd({
  children,
  text,
  size = 'Small',
  texture = 'Soft',
  tone = 'Default',
  showIcon = false,
  icon,
  iconPosition = 'Left',
  bordered = true,
  filled = true,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
  as: Component = 'kbd',
}: MdrKbdProps) {
  const content = children ?? text;
  const shouldRenderIcon = showIcon || Boolean(icon);
  const resolvedIcon = icon ?? <Keyboard size={12} aria-hidden="true" />;
  const fullClassName =
    `MdrKbd ${size} ${texture} ${tone} ${bordered ? 'Bordered' : 'Borderless'} ${filled ? 'Filled' : 'Unfilled'} ${shouldRenderIcon ? 'WithIcon' : ''} ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };
  const Element = Component as React.ElementType;

  return (
    <Element
      className={fullClassName}
      style={style}
      id={id}
      onClick={onClick}
      {...dataProps}
    >
      {shouldRenderIcon && iconPosition === 'Left' && (
        <span className="MdrKbdIcon" aria-hidden="true">
          {resolvedIcon}
        </span>
      )}
      <span className="MdrKbdText">{content}</span>
      {shouldRenderIcon && iconPosition === 'Right' && (
        <span className="MdrKbdIcon" aria-hidden="true">
          {resolvedIcon}
        </span>
      )}
    </Element>
  );
}

export default MdrKbd;
