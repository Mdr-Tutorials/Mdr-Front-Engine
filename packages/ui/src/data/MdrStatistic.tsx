import './MdrStatistic.scss'
import { type MdrComponent } from '@mdr/shared';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type React from 'react';

interface MdrStatisticSpecificProps {
    title?: string,
    value: number | string,
    prefix?: React.ReactNode,
    suffix?: React.ReactNode,
    trend?: 'Up' | 'Down',
    precision?: number,
    color?: string,
}

export interface MdrStatisticProps extends MdrComponent, MdrStatisticSpecificProps { }

function MdrStatistic({
    title,
    value,
    prefix,
    suffix,
    trend,
    precision,
    color,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrStatisticProps) {
    const formattedValue = typeof value === 'number' && precision !== undefined
        ? value.toFixed(precision)
        : value;

    const fullClassName = `MdrStatistic ${trend || ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            {title && <div className="MdrStatisticTitle">{title}</div>}
            <div className="MdrStatisticValue" style={color ? { color } : undefined}>
                {trend && (
                    <span className="MdrStatisticTrend">
                        {trend === 'Up' ? (
                            <TrendingUp className="MdrStatisticTrendIcon" />
                        ) : (
                            <TrendingDown className="MdrStatisticTrendIcon" />
                        )}
                    </span>
                )}
                {prefix && <span className="MdrStatisticPrefix">{prefix}</span>}
                <span className="MdrStatisticNumber">{formattedValue}</span>
                {suffix && <span className="MdrStatisticSuffix">{suffix}</span>}
            </div>
        </div>
    );
}

export default MdrStatistic;
