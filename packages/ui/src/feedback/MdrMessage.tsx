import './MdrMessage.scss'
import { type MdrComponent } from '@mdr/shared';
import { X } from 'lucide-react';

interface MdrMessageSpecificProps {
    text: string,
    type?: 'Info' | 'Success' | 'Warning' | 'Danger',
    closable?: boolean,
    onClose?: () => void,
}

export interface MdrMessageProps extends MdrComponent, MdrMessageSpecificProps { }

function MdrMessage({
    text,
    type = 'Info',
    closable = false,
    onClose,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrMessageProps) {
    const fullClassName = `MdrMessage ${type} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            <span>{text}</span>
            {closable && (
                <button type="button" className="MdrMessageClose" onClick={onClose}>
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

export default MdrMessage;
