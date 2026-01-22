import './MdrNotification.scss'
import { type MdrComponent } from '@mdr/shared';
import { X } from 'lucide-react';
import type React from 'react';

interface MdrNotificationSpecificProps {
    title: string,
    description?: string,
    type?: 'Info' | 'Success' | 'Warning' | 'Danger',
    closable?: boolean,
    actions?: React.ReactNode,
    onClose?: () => void,
}

export interface MdrNotificationProps extends MdrComponent, MdrNotificationSpecificProps { }

function MdrNotification({
    title,
    description,
    type = 'Info',
    closable = false,
    actions,
    onClose,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrNotificationProps) {
    const fullClassName = `MdrNotification ${type} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            <div className="MdrNotificationHeader">
                <div className="MdrNotificationTitle">{title}</div>
                {closable && (
                    <button type="button" className="MdrNotificationClose" onClick={onClose}>
                        <X size={16} />
                    </button>
                )}
            </div>
            {description && <div className="MdrNotificationDescription">{description}</div>}
            {actions && <div className="MdrNotificationActions">{actions}</div>}
        </div>
    );
}

export default MdrNotification;
