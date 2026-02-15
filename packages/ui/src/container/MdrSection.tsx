import './MdrSection.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrSectionSpecificProps {
  children: React.ReactNode;
  size?: 'Small' | 'Medium' | 'Large';
  backgroundColor?: 'Default' | 'Light' | 'Dark' | 'Primary' | 'Secondary';
  padding?: 'None' | 'Small' | 'Medium' | 'Large';
  textAlign?: 'Left' | 'Center' | 'Right';
  fullWidth?: boolean;
}

export interface MdrSectionProps
  extends MdrComponent,
    MdrSectionSpecificProps {}

function MdrSection({
  children,
  size = 'Medium',
  backgroundColor = 'Default',
  padding = 'Medium',
  textAlign = 'Left',
  fullWidth = false,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrSectionProps) {
  const fullClassName =
    `MdrSection ${size} ${backgroundColor} Padding${padding} ${textAlign} ${fullWidth ? 'FullWidth' : ''} ${className || ''}`.trim();

  const dataProps = { ...dataAttributes };

  return (
    <section
      className={fullClassName}
      style={style as React.CSSProperties}
      id={id}
      {...dataProps}
    >
      {children}
    </section>
  );
}

export default MdrSection;
