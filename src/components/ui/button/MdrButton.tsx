import './MdrButton.scss'
import { type MdrComponent } from '../../../types/MdrComponent';
import type React from 'react';

interface MdrButtonSpecificProps {
    text?: string,
    size?: 'Big' | 'Medium' | 'Small' | 'Tiny',
    category?: 'Primary' | 'Secondary' | 'Danger' | 'SubDanger' | 'Warning' | 'SubWarning' | 'Ghost',
    disabled?: boolean,
    icon?: React.ReactNode,
    onlyIcon?: boolean,
    iconPosition?: 'Left' | 'Right',
}

interface MdrButtonProps extends MdrComponent, MdrButtonSpecificProps { }

function MdrButton({
    text,
    size = 'Medium',
    category = 'Secondary',
    disabled = false,
    onlyIcon = false,
    icon,
    iconPosition = 'Right',
    className,
    style,
    id,
    dataAttributes = {},
    onClick,
    as: Component = 'button',
}: MdrButtonProps
) {
    const fullClassName = `MdrButton ${size} ${category} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();

    const dataProps = { ...dataAttributes }

    const Element = Component as React.ElementType

    if (onlyIcon && icon) {
        return <Element className={fullClassName} style={style} id={id} onClick={onClick} {...dataProps} >{icon}</Element>;
    }
    if (icon && iconPosition === 'Left') {
        return <Element className={fullClassName} style={style} id={id} onClick={onClick} {...dataProps} >{icon}<span>{text}</span></Element>;
    }
    if (icon && iconPosition === 'Right') {
        return <Element className={fullClassName} style={style} id={id} onClick={onClick} {...dataProps} ><span>{text}</span>{icon}</Element>;
    }
    return <Element className={fullClassName} style={style} id={id} onClick={onClick} {...dataProps} >{text}</Element>;
}

export default MdrButton;