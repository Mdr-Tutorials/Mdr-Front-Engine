import React from 'react';
import { Link, type To } from 'react-router';
import { type MdrComponent } from '@mdr/shared';
import './MdrLink.scss';

interface MdrLinkSpecificProps {
  to: To;
  text?: string;
  title?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface MdrLinkProps extends MdrComponent, MdrLinkSpecificProps {}

function MdrLink({
  to,
  text,
  title,
  disabled = false,
  children,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
  as: LinkComponent = Link,
}: MdrLinkProps) {
  const content = children ?? text ?? 'Link';

  const fullClassName =
    `MdrLink ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();

  const dataProps = { ...dataAttributes };

  const Element = LinkComponent as React.ComponentType<any>;
  const linkProps = {
    to,
    className: fullClassName,
    style,
    id,
    title,
    onClick: onClick,
    ...dataProps,
  };

  const handleClick = disabled
    ? (e: React.MouseEvent) => {
        e.preventDefault();
      }
    : onClick;
  linkProps.onClick = handleClick;

  return <Element {...linkProps}>{content}</Element>;
}

export default MdrLink;
