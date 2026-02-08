import './MdrCard.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrCardSpecificProps {
    children: React.ReactNode;
    size?: 'Small' | 'Medium' | 'Large';
    variant?: 'Default' | 'Bordered' | 'Elevated' | 'Flat';
    padding?: 'None' | 'Small' | 'Medium' | 'Large';
    hoverable?: boolean;
    clickable?: boolean;
}

export interface MdrCardProps extends MdrComponent, MdrCardSpecificProps {}

function MdrCard({
    children,
    size = 'Medium',
    variant = 'Default',
    padding = 'Medium',
    hoverable = false,
    clickable = false,
    className,
    style,
    id,
    dataAttributes = {},
    onClick,
}: MdrCardProps) {
    const fullClassName =
        `MdrCard ${size} ${variant} Padding${padding} ${hoverable ? 'Hoverable' : ''} ${clickable ? 'Clickable' : ''} ${className || ''}`.trim();

    const dataProps = { ...dataAttributes };

    return (
        <div
            className={fullClassName}
            style={style as React.CSSProperties | undefined}
            id={id}
            onClick={onClick}
            {...dataProps}
        >
            {children}
        </div>
    );
}

export default MdrCard;
