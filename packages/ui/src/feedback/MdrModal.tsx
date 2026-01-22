import './MdrModal.scss'
import { type MdrComponent } from '@mdr/shared';
import { X } from 'lucide-react';
import type React from 'react';

interface MdrModalSpecificProps {
    open: boolean,
    title?: string,
    children?: React.ReactNode,
    footer?: React.ReactNode,
    size?: 'Small' | 'Medium' | 'Large',
    closeOnOverlayClick?: boolean,
    showClose?: boolean,
    onClose?: () => void,
}

export interface MdrModalProps extends MdrComponent, MdrModalSpecificProps { }

function MdrModal({
    open,
    title,
    children,
    footer,
    size = 'Medium',
    closeOnOverlayClick = true,
    showClose = true,
    onClose,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrModalProps) {
    if (!open) return null;

    const fullClassName = `MdrModal ${size} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className="MdrModalOverlay" onClick={closeOnOverlayClick ? onClose : undefined}>
            <div
                className={fullClassName}
                style={style as React.CSSProperties}
                id={id}
                {...dataProps}
                onClick={(event) => event.stopPropagation()}
            >
                {(title || showClose) && (
                    <div className="MdrModalHeader">
                        {title && <h3>{title}</h3>}
                        {showClose && (
                            <button type="button" className="MdrModalClose" onClick={onClose}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}
                <div className="MdrModalBody">{children}</div>
                {footer && <div className="MdrModalFooter">{footer}</div>}
            </div>
        </div>
    );
}

export default MdrModal;
