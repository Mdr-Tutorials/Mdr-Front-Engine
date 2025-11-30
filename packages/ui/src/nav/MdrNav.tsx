import React from 'react';
import type { MdrComponent } from '@mdr/shared';
import './MdrNav.scss';

interface MdrNavSpecificProps {
    columns?: 2 | 3; // 2: 左右 3: 左中右
    canHide?: boolean;
    isFloat?: boolean;
    backgroundStyle?: 'Transparent' | 'Solid' | 'Blurred';
    children?: React.ReactNode;
}

interface MdrNavProps extends MdrComponent, MdrNavSpecificProps { }

function MdrNav({
    columns = 3,
    canHide = false,
    isFloat = false,
    backgroundStyle = 'Solid',
    children,
    className,
    style,
    id,
    dataAttributes = {},
    onClick,
    as: Component = 'nav',
}: MdrNavProps) {
    const fullClassName = `MdrNav Columns-${columns} ${isFloat ? 'Float' : ''} ${canHide ? 'CanHide' : ''} ${backgroundStyle} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };
    const Element = Component as React.ElementType;

    return (
        <Element className={fullClassName} style={style} id={id} onClick={onClick} {...dataProps}>
            {children}
        </Element>
    );
}

interface MdrNavAreaProps {
    children?: React.ReactNode;
}

function MdrNavLeft({ children }: MdrNavAreaProps) {
    return (
        <div className="MdrNavLeft">
            {children}
        </div>
    );
}

function MdrNavCenter({ children }: MdrNavAreaProps) {
    return (
        <div className="MdrNavCenter">
            {children}
        </div>
    );
}

function MdrNavRight({ children }: MdrNavAreaProps) {
    return (
        <div className="MdrNavRight">
            {children}
        </div>
    );
}

MdrNav.Left = MdrNavLeft;
MdrNav.Center = MdrNavCenter;
MdrNav.Right = MdrNavRight;

export default MdrNav;
