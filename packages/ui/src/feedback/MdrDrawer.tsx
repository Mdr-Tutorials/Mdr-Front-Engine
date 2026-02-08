import './MdrDrawer.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrDrawerSpecificProps {
    open: boolean;
    title?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    placement?: 'Left' | 'Right' | 'Top' | 'Bottom';
    size?: number;
    closeOnOverlayClick?: boolean;
    onClose?: () => void;
}

export interface MdrDrawerProps extends MdrComponent, MdrDrawerSpecificProps {}

function MdrDrawer({
    open,
    title,
    children,
    footer,
    placement = 'Right',
    size = 360,
    closeOnOverlayClick = true,
    onClose,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrDrawerProps) {
    if (!open) return null;

    const fullClassName = `MdrDrawer ${placement} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    const drawerStyle: React.CSSProperties =
        placement === 'Top' || placement === 'Bottom'
            ? { height: size, ...(style as React.CSSProperties) }
            : { width: size, ...(style as React.CSSProperties) };

    return (
        <div
            className="MdrDrawerOverlay"
            onClick={closeOnOverlayClick ? onClose : undefined}
        >
            <div
                className={fullClassName}
                style={drawerStyle}
                id={id}
                {...dataProps}
                onClick={(event) => event.stopPropagation()}
            >
                {title && <div className="MdrDrawerHeader">{title}</div>}
                <div className="MdrDrawerBody">{children}</div>
                {footer && <div className="MdrDrawerFooter">{footer}</div>}
            </div>
        </div>
    );
}

export default MdrDrawer;
