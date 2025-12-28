import React from 'react';
import type { MdrComponent } from '@mdr/shared';

type EmbedType = 'YouTube' | 'Vimeo' | 'Twitter' | 'Instagram' | 'Facebook' | 'Custom';

interface MdrEmbedSpecificProps {
    type: EmbedType,
    url: string,
    title?: string,
    allowFullScreen?: boolean,
    loading?: 'Eager' | 'Lazy',
    width?: number | string,
    height?: number | string,
    aspectRatio?: '16:9' | '4:3' | '1:1' | '21:9',
}

export interface MdrEmbedProps extends Omit<MdrComponent, 'as'>, MdrEmbedSpecificProps { }

function getEmbedUrl(type: EmbedType, url: string): string {
    switch (type) {
        case 'YouTube':
            const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return youtubeMatch ? `https://www.youtube.com/embed/${youtubeMatch[1]}` : url;

        case 'Vimeo':
            const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
            return vimeoMatch ? `https://player.vimeo.com/video/${vimeoMatch[1]}` : url;

        case 'Twitter':
            return url;

        case 'Instagram':
            return url;

        case 'Facebook':
            const facebookMatch = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
            return facebookMatch ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}` : url;

        case 'Custom':
        default:
            return url;
    }
}

function MdrEmbed({
    type,
    url,
    title,
    allowFullScreen = false,
    loading = 'Lazy',
    width,
    height,
    aspectRatio = '16:9',
    className,
    style,
    id,
    dataAttributes = {},
    onLoad,
    onError,
    ...rest
}: MdrEmbedProps) {
    const fullClassName = `MdrEmbed ${type} ${aspectRatio.replace(':', '-')} ${className || ''}`.trim();

    const dataProps = { ...dataAttributes }

    const containerStyle: React.CSSProperties = {
        ...style,
        width: width || '100%',
        height: height || 'auto',
    };

    const aspectRatioMap: Record<string, string> = {
        '16:9': '16 / 9',
        '4:3': '4 / 3',
        '1:1': '1 / 1',
        '21:9': '21 / 9',
    };

    const embedContainerStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        aspectRatio: aspectRatioMap[aspectRatio],
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
    };

    const iframeStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
    };

    const embedUrl = getEmbedUrl(type, url);

    if (type === 'Twitter' || type === 'Instagram') {
        return (
            <div className={fullClassName} style={containerStyle} id={id} {...dataProps}>
                <div style={embedContainerStyle}>
                    <iframe
                        style={iframeStyle}
                        src={embedUrl}
                        title={title || `${type} embed`}
                        loading={loading.toLowerCase() as 'eager' | 'lazy'}
                        onLoad={onLoad}
                        onError={onError}
                        {...rest}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={fullClassName} style={containerStyle} id={id} {...dataProps}>
            <div style={embedContainerStyle}>
                <iframe
                    style={iframeStyle}
                    src={embedUrl}
                    title={title || `${type} embed`}
                    allowFullScreen={allowFullScreen}
                    loading={loading.toLowerCase() as 'eager' | 'lazy'}
                    onLoad={onLoad}
                    onError={onError}
                    {...rest}
                />
            </div>
        </div>
    );
}

export default MdrEmbed;
