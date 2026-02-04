import React from 'react';
import type { MdrComponent } from '@mdr/shared';

interface MdrIframeSpecificProps {
  src: string;
  srcDoc?: string;
  title?: string;
  allow?: string;
  allowFullScreen?: boolean;
  loading?: 'Eager' | 'Lazy';
  referrerPolicy?:
    | 'NoReferrer'
    | 'NoReferrerWhenDowngrade'
    | 'Origin'
    | 'OriginWhenCrossOrigin'
    | 'SameOrigin'
    | 'StrictOrigin'
    | 'StrictOriginWhenCrossOrigin'
    | 'UnsafeUrl';
  sandbox?: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '21:9';
}

export interface MdrIframeProps
  extends Omit<MdrComponent, 'as'>,
    MdrIframeSpecificProps,
    Omit<
      React.IframeHTMLAttributes<HTMLIFrameElement>,
      'width' | 'height' | 'loading' | 'referrerPolicy'
    > {}

function MdrIframe({
  src,
  srcDoc,
  title,
  allow,
  allowFullScreen = false,
  loading = 'Lazy',
  referrerPolicy,
  sandbox,
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
}: MdrIframeProps) {
  const fullClassName =
    `MdrIframe ${aspectRatio.replace(':', '-')} ${className || ''}`.trim();

  const dataProps = { ...dataAttributes };

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

  const iframeContainerStyle: React.CSSProperties = {
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

  return (
    <div
      className={fullClassName}
      style={containerStyle}
      id={id}
      {...dataProps}
    >
      <div style={iframeContainerStyle}>
        <iframe
          style={iframeStyle}
          src={src}
          srcDoc={srcDoc}
          title={title}
          allow={allow}
          allowFullScreen={allowFullScreen}
          loading={loading.toLowerCase() as 'eager' | 'lazy'}
          referrerPolicy={
            referrerPolicy?.toLowerCase() as React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy']
          }
          sandbox={sandbox}
          onLoad={onLoad}
          onError={onError}
          {...rest}
        />
      </div>
    </div>
  );
}

export default MdrIframe;
