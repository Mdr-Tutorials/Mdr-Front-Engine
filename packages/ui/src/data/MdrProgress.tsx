import './MdrProgress.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrProgressSpecificProps {
    value: number,
    size?: 'Small' | 'Medium' | 'Large',
    status?: 'Default' | 'Success' | 'Warning' | 'Danger',
    showLabel?: boolean,
    label?: string,
}

export interface MdrProgressProps extends MdrComponent, MdrProgressSpecificProps { }

function MdrProgress({
    value,
    size = 'Medium',
    status = 'Default',
    showLabel = true,
    label,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrProgressProps) {
    const clampedValue = Math.min(100, Math.max(0, value));
    const fullClassName = `MdrProgress ${size} ${status} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            {(label || showLabel) && (
                <div className="MdrProgressHeader">
                    {label && <span>{label}</span>}
                    {showLabel && <span>{clampedValue}%</span>}
                </div>
            )}
            <div className="MdrProgressTrack">
                <div className="MdrProgressBar" style={{ width: `${clampedValue}%` }} />
            </div>
        </div>
    );
}

export default MdrProgress;
