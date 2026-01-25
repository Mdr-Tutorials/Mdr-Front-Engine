import './MdrSelect.scss'
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

export interface MdrSelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface MdrSelectSpecificProps {
    label?: string,
    description?: string,
    message?: string,
    options: MdrSelectOption[];
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    size?: 'Small' | 'Medium' | 'Large',
    disabled?: boolean;
    onChange?: (value: string, option?: MdrSelectOption) => void;
}

export interface MdrSelectProps extends MdrComponent, MdrSelectSpecificProps { }

function MdrSelect({
    label,
    description,
    message,
    options,
    value,
    defaultValue,
    placeholder = 'Select item',
    size = 'Medium',
    disabled = false,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrSelectProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextValue = event.target.value;
        if (value === undefined) {
            setInternalValue(nextValue);
        }
        const selected = options.find((option) => option.value === nextValue);
        if (onChange) {
            onChange(nextValue, selected);
        }
    };

    const fullClassName = `MdrSelect ${size} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={`MdrField ${fullClassName}`} style={style as React.CSSProperties} id={id} {...dataProps}>
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel">{label}</label>
                </div>
            )}
            {description && <div className="MdrFieldDescription">{description}</div>}
            <select
                className="MdrSelectControl"
                disabled={disabled}
                value={currentValue}
                onChange={handleChange}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrSelect;
