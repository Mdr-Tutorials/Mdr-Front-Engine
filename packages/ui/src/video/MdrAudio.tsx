import React from 'react';
import type { MdrComponent } from '@mdr/shared';

interface MdrAudioSpecificProps {
    src: string;
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
    preload?: 'None' | 'Metadata' | 'Auto';
    onPlay?: React.ReactEventHandler<HTMLAudioElement>;
    onPause?: React.ReactEventHandler<HTMLAudioElement>;
    onEnded?: React.ReactEventHandler<HTMLAudioElement>;
    onTimeUpdate?: React.ReactEventHandler<HTMLAudioElement>;
    onProgress?: React.ReactEventHandler<HTMLAudioElement>;
    onLoadedMetadata?: React.ReactEventHandler<HTMLAudioElement>;
}

export interface MdrAudioProps extends MdrComponent, MdrAudioSpecificProps {}

function MdrAudio({
    src,
    autoplay = false,
    controls = true,
    loop = false,
    muted = false,
    preload = 'Metadata',
    className,
    style,
    id,
    dataAttributes = {},
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onProgress,
    onLoadedMetadata,
    onClick,
}: MdrAudioProps) {
    const fullClassName = `MdrAudio ${className || ''}`.trim();

    const dataProps = { ...dataAttributes };
    const normalizedSrc = src?.trim() ? src : undefined;

    const containerStyle = {
        ...style,
        width: '100%',
        maxWidth: '600px',
    };

    return (
        <div
            className={fullClassName}
            style={containerStyle as React.CSSProperties}
            id={id}
            onClick={onClick}
            {...dataProps}
        >
            <audio
                src={normalizedSrc}
                autoPlay={autoplay}
                controls={controls}
                loop={loop}
                muted={muted}
                preload={preload.toLowerCase() as 'none' | 'metadata' | 'auto'}
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
                onTimeUpdate={onTimeUpdate}
                onProgress={onProgress}
                onLoadedMetadata={onLoadedMetadata}
            />
        </div>
    );
}

export default MdrAudio;
