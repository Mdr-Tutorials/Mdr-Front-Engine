import React from 'react';

export interface MdrComponent {
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    dataAttributes?: Record<string, string>;
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    as?: React.ElementType;
}