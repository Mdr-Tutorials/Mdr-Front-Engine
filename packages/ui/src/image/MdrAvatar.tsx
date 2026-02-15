import React from 'react';
import { type MdrComponent } from '@mdr/shared';

interface MdrAvatarSpecificProps {
  src?: string;
  alt?: string;
  size?: 'ExtraSmall' | 'Small' | 'Medium' | 'Large' | 'ExtraLarge';
  shape?: 'Square' | 'Rounded' | 'Circle';
  fallback?: string;
  initials?: string;
  status?: 'Online' | 'Offline' | 'Busy' | 'Away';
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export interface MdrAvatarProps extends MdrComponent, MdrAvatarSpecificProps {}

function MdrAvatar({
  src,
  alt = 'Avatar',
  size = 'Medium',
  shape = 'Circle',
  fallback,
  initials,
  status,
  className,
  style,
  id,
  dataAttributes = {},
  onError,
  ...rest
}: MdrAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const fullClassName =
    `MdrAvatar ${size} ${shape} ${status ? `status-${status}` : ''} ${className || ''}`.trim();

  const dataProps = { ...dataAttributes };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    if (onError) {
      onError(e);
    }
  };

  const renderContent = () => {
    if (src && !imageError) {
      return <img src={src} alt={alt} onError={handleError} {...rest} />;
    }

    if (initials) {
      return <span className="MdrAvatar-initials">{initials}</span>;
    }

    if (fallback) {
      return <img src={fallback} alt={alt} {...rest} />;
    }

    return (
      <span className="MdrAvatar-placeholder">
        {alt.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div
      className={fullClassName}
      style={style as React.CSSProperties}
      id={id}
      {...dataProps}
    >
      {renderContent()}
      {status && <span className="MdrAvatar-status" />}
    </div>
  );
}

export default MdrAvatar;
