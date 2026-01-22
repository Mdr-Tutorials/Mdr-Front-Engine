import './MdrDatePicker.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrDatePickerSpecificProps {
    label?: string,
    description?: string,
    message?: string,
    value?: string,
    placeholder?: string,
    size?: 'Small' | 'Medium' | 'Large',
    state?: 'Default' | 'Error' | 'Warning' | 'Success',
    disabled?: boolean,
    readOnly?: boolean,
    required?: boolean,
    min?: string,
    max?: string,
    name?: string,
    autoFocus?: boolean,
    showIcon?: boolean,
    onChange?: (value: string) => void,
    onFocus?: React.FocusEventHandler<HTMLInputElement>,
    onBlur?: React.FocusEventHandler<HTMLInputElement>,
}

export interface MdrDatePickerProps extends MdrComponent, MdrDatePickerSpecificProps { }

function MdrDatePicker({
    label,
    description,
    message,
    value,
    placeholder,
    size = 'Medium',
    state = 'Default',
    disabled = false,
    readOnly = false,
    required = false,
    min,
    max,
    name,
    autoFocus = false,
    showIcon = true,
    onChange,
    onFocus,
    onBlur,
    className,
    style,
    id,
    dataAttributes = {},
    onClick,
}: MdrDatePickerProps) {
    const fullClassName = `MdrDatePicker ${size} ${state} ${disabled ? 'Disabled' : ''} ${readOnly ? 'ReadOnly' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    return (
        <div className={`MdrField ${fullClassName}`} style={style as React.CSSProperties} {...dataProps}>
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel" htmlFor={id}>{label}</label>
                    {required && <span className="MdrFieldRequired">*</span>}
                </div>
            )}
            {description && <div className="MdrFieldDescription">{description}</div>}
            <div className="MdrDatePickerControl">
                <input
                    className="MdrDatePickerInput"
                    id={id}
                    type="date"
                    placeholder={placeholder}
                    value={value}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    min={min}
                    max={max}
                    name={name}
                    autoFocus={autoFocus}
                    onChange={handleChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onClick={onClick}
                />
                {showIcon && (
                    <span className="MdrDatePickerIcon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                    </span>
                )}
            </div>
            {message && <div className={`MdrFieldMessage ${state}`}>{message}</div>}
        </div>
    );
}

export default MdrDatePicker;
