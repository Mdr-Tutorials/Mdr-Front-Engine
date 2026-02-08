import './MdrPopover.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

interface MdrPopoverSpecificProps {
    title?: string;
    content: React.ReactNode;
    trigger?: 'Click' | 'Hover';
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    panelClassName?: string;
    panelStyle?: React.CSSProperties;
    children: React.ReactNode;
}

export interface MdrPopoverProps
    extends MdrComponent,
        MdrPopoverSpecificProps {}

function MdrPopover({
    title,
    content,
    trigger = 'Click',
    open,
    defaultOpen = false,
    onOpenChange,
    panelClassName,
    panelStyle,
    children,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrPopoverProps) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);

    useEffect(() => {
        if (open !== undefined) {
            setInternalOpen(open);
        }
    }, [open]);

    const isOpen = open !== undefined ? open : internalOpen;

    const setOpen = (next: boolean) => {
        if (open === undefined) {
            setInternalOpen(next);
        }
        if (onOpenChange) {
            onOpenChange(next);
        }
    };

    const fullClassName = `MdrPopover ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    const triggerProps =
        trigger === 'Hover'
            ? {
                  onMouseEnter: () => setOpen(true),
                  onMouseLeave: () => setOpen(false),
              }
            : {
                  onClick: () => setOpen(!isOpen),
              };

    return (
        <span
            className={fullClassName}
            style={style as React.CSSProperties}
            id={id}
            {...dataProps}
            {...triggerProps}
        >
            {children}
            {isOpen && (
                <span
                    className={`MdrPopoverPanel ${panelClassName || ''}`.trim()}
                    style={panelStyle}
                >
                    {title && <div className="MdrPopoverTitle">{title}</div>}
                    <div className="MdrPopoverContent">{content}</div>
                </span>
            )}
        </span>
    );
}

export default MdrPopover;
