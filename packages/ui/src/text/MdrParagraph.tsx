import './MdrParagraph.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrParagraphSpecificProps {
    children: React.ReactNode;
    size?: 'Small' | 'Medium' | 'Large';
    weight?: 'Light' | 'Normal' | 'Medium' | 'SemiBold';
    color?:
        | 'Default'
        | 'Muted'
        | 'Primary'
        | 'Secondary'
        | 'Danger'
        | 'Warning'
        | 'Success';
    align?: 'Left' | 'Center' | 'Right';
}

export interface MdrParagraphProps
    extends MdrComponent,
        MdrParagraphSpecificProps {}

function MdrParagraph({
    children,
    size = 'Medium',
    weight = 'Normal',
    color = 'Default',
    align = 'Left',
    as: Component = 'p',
    className,
    style,
    id,
    dataAttributes = {},
}: MdrParagraphProps) {
    const fullClassName =
        `MdrParagraph ${size} ${weight} ${color} ${align} ${className || ''}`.trim();

    const dataProps = { ...dataAttributes };

    const Element = Component as React.ElementType;

    return (
        <Element className={fullClassName} style={style} id={id} {...dataProps}>
            {children}
        </Element>
    );
}

export default MdrParagraph;
