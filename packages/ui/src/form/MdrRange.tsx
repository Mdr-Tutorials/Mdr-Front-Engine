import './MdrRange.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';

export interface MdrRangeValue {
    min: number;
    max: number;
}

interface MdrRangeSpecificProps {
    label?: string;
    description?: string;
    message?: string;
    min?: number;
    max?: number;
    step?: number;
    value?: MdrRangeValue;
    defaultValue?: MdrRangeValue;
    disabled?: boolean;
    showValue?: boolean;
    onChange?: (value: MdrRangeValue) => void;
}

export interface MdrRangeProps extends MdrComponent, MdrRangeSpecificProps {}

function MdrRange({
    label,
    description,
    message,
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue,
    disabled = false,
    showValue = true,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrRangeProps) {
    const [internalValue, setInternalValue] = useState<MdrRangeValue>(
        defaultValue || { min, max }
    );

    useEffect(() => {
        if (value) {
            setInternalValue(value);
        }
    }, [value?.min, value?.max]);

    const currentValue = value || internalValue;

    const updateValue = (nextValue: MdrRangeValue) => {
        if (!value) {
            setInternalValue(nextValue);
        }
        if (onChange) {
            onChange(nextValue);
        }
    };

    const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextMin = Math.min(Number(event.target.value), currentValue.max);
        updateValue({ min: nextMin, max: currentValue.max });
    };

    const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextMax = Math.max(Number(event.target.value), currentValue.min);
        updateValue({ min: currentValue.min, max: nextMax });
    };

    const trackStyle = useMemo(() => {
        const range = max - min || 1;
        const startPercent = ((currentValue.min - min) / range) * 100;
        const endPercent = ((currentValue.max - min) / range) * 100;
        return {
            '--range-start': `${startPercent}%`,
            '--range-end': `${endPercent}%`,
        } as React.CSSProperties;
    }, [currentValue.min, currentValue.max, min, max]);

    const fullClassName =
        `MdrRange ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div
            className={`MdrField ${fullClassName}`}
            style={style as React.CSSProperties}
            id={id}
            {...dataProps}
        >
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel">{label}</label>
                    {showValue && (
                        <span className="MdrRangeValue">
                            {currentValue.min} - {currentValue.max}
                        </span>
                    )}
                </div>
            )}
            {description && (
                <div className="MdrFieldDescription">{description}</div>
            )}
            <div className="MdrRangeTrack" style={trackStyle}>
                <input
                    className="MdrRangeInput"
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue.min}
                    disabled={disabled}
                    onChange={handleMinChange}
                />
                <input
                    className="MdrRangeInput"
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue.max}
                    disabled={disabled}
                    onChange={handleMaxChange}
                />
            </div>
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrRange;
