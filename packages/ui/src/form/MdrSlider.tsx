import './MdrSlider.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

interface MdrSliderSpecificProps {
    label?: string;
    description?: string;
    message?: string;
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    defaultValue?: number;
    size?: 'Small' | 'Medium' | 'Large';
    disabled?: boolean;
    showValue?: boolean;
    onChange?: (value: number) => void;
}

export interface MdrSliderProps extends MdrComponent, MdrSliderSpecificProps {}

function MdrSlider({
    label,
    description,
    message,
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue,
    size = 'Medium',
    disabled = false,
    showValue = true,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrSliderProps) {
    const [internalValue, setInternalValue] = useState(defaultValue ?? min);

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Number(event.target.value);
        if (value === undefined) {
            setInternalValue(nextValue);
        }
        if (onChange) {
            onChange(nextValue);
        }
    };

    const fullClassName =
        `MdrSlider ${size} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
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
                        <span className="MdrSliderValue">{currentValue}</span>
                    )}
                </div>
            )}
            {description && (
                <div className="MdrFieldDescription">{description}</div>
            )}
            <input
                className="MdrSliderInput"
                type="range"
                min={min}
                max={max}
                step={step}
                value={currentValue}
                disabled={disabled}
                onChange={handleChange}
            />
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrSlider;
