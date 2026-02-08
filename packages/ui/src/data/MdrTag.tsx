import './MdrTag.scss';
import { type MdrComponent } from '@mdr/shared';
import { X } from 'lucide-react';
import type React from 'react';

interface MdrTagSpecificProps {
    text?: string;
    color?:
        | 'Default'
        | 'Primary'
        | 'Secondary'
        | 'Success'
        | 'Warning'
        | 'Danger';
    size?: 'Small' | 'Medium' | 'Large';
    variant?: 'Solid' | 'Outline' | 'Soft';
    closable?: boolean;
    onClose?: () => void;
}

export interface MdrTagProps extends MdrComponent, MdrTagSpecificProps {}

function MdrTag({
    text,
    color = 'Default',
    size = 'Medium',
    variant = 'Soft',
    closable = false,
    onClose,
    className,
    style,
    id,
    dataAttributes = {},
    onClick,
}: MdrTagProps) {
    const fullClassName =
        `MdrTag ${size} ${color} ${variant} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <span
            className={fullClassName}
            style={style as React.CSSProperties}
            id={id}
            onClick={onClick}
            {...dataProps}
        >
            <span className="MdrTagText">{text}</span>
            {closable && (
                <button type="button" className="MdrTagClose" onClick={onClose}>
                    <X size={12} />
                </button>
            )}
        </span>
    );
}

export default MdrTag;
