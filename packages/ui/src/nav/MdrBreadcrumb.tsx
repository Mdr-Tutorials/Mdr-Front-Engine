import './MdrBreadcrumb.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

export interface MdrBreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

interface MdrBreadcrumbSpecificProps {
    items: MdrBreadcrumbItem[];
    separator?: React.ReactNode;
}

export interface MdrBreadcrumbProps extends MdrComponent, MdrBreadcrumbSpecificProps { }

function MdrBreadcrumb({
    items,
    separator = '/',
    className,
    style,
    id,
    dataAttributes = {},
}: MdrBreadcrumbProps) {
    const fullClassName = `MdrBreadcrumb ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <nav className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            {items.map((item, index) => (
                <span key={item.label} className="MdrBreadcrumbItem">
                    {item.icon && <span className="MdrBreadcrumbIcon">{item.icon}</span>}
                    {item.href ? (
                        <a href={item.href}>{item.label}</a>
                    ) : (
                        <span>{item.label}</span>
                    )}
                    {index < items.length - 1 && <span className="MdrBreadcrumbSeparator">{separator}</span>}
                </span>
            ))}
        </nav>
    );
}

export default MdrBreadcrumb;
