import './MdrSkeleton.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrSkeletonSpecificProps {
    variant?: 'Text' | 'Circle' | 'Rect',
    width?: number | string,
    height?: number | string,
    lines?: number,
}

export interface MdrSkeletonProps extends MdrComponent, MdrSkeletonSpecificProps { }

function MdrSkeleton({
    variant = 'Text',
    width,
    height,
    lines = 1,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrSkeletonProps) {
    const fullClassName = `MdrSkeleton ${variant} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    const baseStyle: React.CSSProperties = {
        width,
        height,
        ...style as React.CSSProperties,
    };

    if (variant === 'Text' && lines > 1) {
        return (
            <div className="MdrSkeletonGroup" id={id} {...dataProps}>
                {Array.from({ length: lines }).map((_, index) => (
                    <div key={index} className={fullClassName} style={baseStyle} />
                ))}
            </div>
        );
    }

    return (
        <div className={fullClassName} style={baseStyle} id={id} {...dataProps} />
    );
}

export default MdrSkeleton;
