import './MdrSpinner.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrSpinnerSpecificProps {
    size?: 'Small' | 'Medium' | 'Large',
    label?: string,
    color?: string,
}

export interface MdrSpinnerProps extends MdrComponent, MdrSpinnerSpecificProps { }

function MdrSpinner({
    size = 'Medium',
    label,
    color,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrSpinnerProps) {
    const fullClassName = `MdrSpinner ${size} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            <span className="MdrSpinnerCircle" style={color ? { borderTopColor: color } : undefined} />
            {label && <span className="MdrSpinnerLabel">{label}</span>}
        </div>
    );
}

export default MdrSpinner;
