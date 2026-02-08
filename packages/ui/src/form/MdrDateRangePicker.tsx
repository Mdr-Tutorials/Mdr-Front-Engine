import './MdrDateRangePicker.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrDateRangePickerSpecificProps {
    label?: string;
    description?: string;
    message?: string;
    startValue?: string;
    endValue?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    size?: 'Small' | 'Medium' | 'Large';
    state?: 'Default' | 'Error' | 'Warning' | 'Success';
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    min?: string;
    max?: string;
    name?: string;
    onChange?: (range: { start: string; end: string }) => void;
    onStartChange?: (value: string) => void;
    onEndChange?: (value: string) => void;
}

export interface MdrDateRangePickerProps
    extends MdrComponent,
        MdrDateRangePickerSpecificProps {}

function MdrDateRangePicker({
    label,
    description,
    message,
    startValue,
    endValue,
    startPlaceholder,
    endPlaceholder,
    size = 'Medium',
    state = 'Default',
    disabled = false,
    readOnly = false,
    required = false,
    min,
    max,
    name,
    onChange,
    onStartChange,
    onEndChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrDateRangePickerProps) {
    const fullClassName =
        `MdrDateRangePicker ${size} ${state} ${disabled ? 'Disabled' : ''} ${readOnly ? 'ReadOnly' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (onStartChange) {
            onStartChange(next);
        }
        if (onChange) {
            onChange({ start: next, end: endValue || '' });
        }
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (onEndChange) {
            onEndChange(next);
        }
        if (onChange) {
            onChange({ start: startValue || '', end: next });
        }
    };

    return (
        <div
            className={`MdrField ${fullClassName}`}
            style={style as React.CSSProperties}
            {...dataProps}
        >
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel" htmlFor={id}>
                        {label}
                    </label>
                    {required && <span className="MdrFieldRequired">*</span>}
                </div>
            )}
            {description && (
                <div className="MdrFieldDescription">{description}</div>
            )}
            <div className="MdrDateRangePickerControls">
                <input
                    className="MdrDateRangePickerInput"
                    id={id}
                    type="date"
                    placeholder={startPlaceholder}
                    value={startValue}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    min={min}
                    max={max}
                    name={name}
                    onChange={handleStartChange}
                />
                <span className="MdrDateRangePickerSeparator">to</span>
                <input
                    className="MdrDateRangePickerInput"
                    type="date"
                    placeholder={endPlaceholder}
                    value={endValue}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    min={min}
                    max={max}
                    name={name}
                    onChange={handleEndChange}
                />
            </div>
            {message && (
                <div className={`MdrFieldMessage ${state}`}>{message}</div>
            )}
        </div>
    );
}

export default MdrDateRangePicker;
