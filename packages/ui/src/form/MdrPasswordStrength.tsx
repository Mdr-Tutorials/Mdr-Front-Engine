import './MdrPasswordStrength.scss'
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

interface MdrPasswordStrengthSpecificProps {
    label?: string,
    description?: string,
    message?: string,
    value?: string,
    defaultValue?: string,
    size?: 'Small' | 'Medium' | 'Large',
    disabled?: boolean,
    required?: boolean,
    minLength?: number,
    showText?: boolean,
    strengthLabels?: string[],
    onChange?: (value: string) => void,
}

export interface MdrPasswordStrengthProps extends MdrComponent, MdrPasswordStrengthSpecificProps { }

const calculateScore = (value: string, minLength: number) => {
    let score = 0;
    if (value.length >= minLength) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return Math.min(score, 4);
};

function MdrPasswordStrength({
    label,
    description,
    message,
    value,
    defaultValue,
    size = 'Medium',
    disabled = false,
    required = false,
    minLength = 8,
    showText = true,
    strengthLabels = ['Very weak', 'Weak', 'Medium', 'Strong', 'Very strong'],
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrPasswordStrengthProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;
    const score = calculateScore(currentValue, minLength);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        if (value === undefined) {
            setInternalValue(nextValue);
        }
        if (onChange) {
            onChange(nextValue);
        }
    };

    const fullClassName = `MdrPasswordStrength ${size} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={`MdrField ${fullClassName}`} style={style as React.CSSProperties} id={id} {...dataProps}>
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel">{label}</label>
                    {required && <span className="MdrFieldRequired">*</span>}
                </div>
            )}
            {description && <div className="MdrFieldDescription">{description}</div>}
            <input
                className="MdrPasswordStrengthInput"
                type="password"
                value={currentValue}
                disabled={disabled}
                onChange={handleChange}
            />
            <div className="MdrPasswordStrengthMeter" aria-hidden>
                {Array.from({ length: 4 }).map((_, index) => (
                    <span
                        key={index}
                        className={`MdrPasswordStrengthBar ${score > index ? 'Active' : ''} Level${score}`}
                    />
                ))}
            </div>
            {showText && (
                <div className="MdrPasswordStrengthText">{strengthLabels[score] || ''}</div>
            )}
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrPasswordStrength;
