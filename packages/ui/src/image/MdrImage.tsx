import './MdrImage.scss';
import React from 'react';
import { type MdrComponent } from '@mdr/shared';

interface MdrImageSpecificProps {
    src: string;
    alt: string;
    size?: 'Small' | 'Medium' | 'Large' | 'Original';
    fit?: 'Cover' | 'Contain' | 'Fill' | 'None' | 'ScaleDown';
    shape?: 'Square' | 'Rounded' | 'Circle';
    loading?: 'Eager' | 'Lazy';
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
    onError?: React.ReactEventHandler<HTMLImageElement>;
}

export interface MdrImageProps extends MdrComponent, MdrImageSpecificProps {}

function MdrImage({
    src,
    alt,
    size = 'Medium',
    fit = 'Cover',
    shape = 'Rounded',
    loading = 'Lazy',
    className,
    style,
    id,
    dataAttributes = {},
    onLoad,
    onError,
    ...rest
}: MdrImageProps) {
    const fullClassName =
        `MdrImage ${size} ${fit} ${shape} ${className || ''}`.trim();

    const dataProps = { ...dataAttributes };

    return (
        <img
            className={fullClassName}
            style={style as React.CSSProperties}
            id={id}
            src={src}
            alt={alt}
            loading={loading.toLowerCase() as 'eager' | 'lazy'}
            onLoad={onLoad}
            onError={onError}
            {...dataProps}
            {...rest}
        />
    );
}

export default MdrImage;
