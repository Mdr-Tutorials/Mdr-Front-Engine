import React from 'react';
import { Link, type To } from 'react-router';
import { type MdrComponent } from '../../../shared/types/MdrComponent';
import './MdrLink.scss';

interface MdrLinkSpecific {
    to: To;
    text?: string;
    children?: React.ReactNode;
}

interface MdrLinkProps extends MdrComponent, MdrLinkSpecific { }

function MdrLink({
    to,
    text,
    children,
    className,
    style,
    id,
    dataAttributes = {},
    onClick,
    as: LinkComponent = Link,
}: MdrLinkProps) {
    const content = children ?? text ?? 'Link';

    const fullClassName = `MdrLink ${className || ''}`.trim();

    const dataProps = { ...dataAttributes };

    const Element = LinkComponent as React.ComponentType<any>;
    const linkProps = {
        to,
        className: fullClassName,
        style,
        id,
        onClick: onClick,
        ...dataProps,
    };

    return <Element {...linkProps}>{content}</Element>;
}

export default MdrLink;