import './MdrHeading.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrHeadingSpecificProps {
    children: React.ReactNode,
    level?: 1 | 2 | 3 | 4 | 5 | 6,
    weight?: 'Light' | 'Normal' | 'Medium' | 'SemiBold' | 'Bold',
    color?: 'Default' | 'Muted' | 'Primary' | 'Secondary' | 'Danger' | 'Warning' | 'Success',
    align?: 'Left' | 'Center' | 'Right',
}

export interface MdrHeadingProps extends MdrComponent, MdrHeadingSpecificProps { }

function MdrHeading({
    children,
    level = 1,
    weight = 'Bold',
    color = 'Default',
    align = 'Left',
    as: Component,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrHeadingProps) {
    const fullClassName = `MdrHeading Level${level} ${weight} ${color} ${align} ${className || ''}`.trim();

    const dataProps = { ...dataAttributes }

    const Element = (Component || `h${level}`) as React.ElementType

    return <Element className={fullClassName} style={style} id={id} {...dataProps}>{children}</Element>;
}

export default MdrHeading;
