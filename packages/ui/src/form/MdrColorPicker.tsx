import './MdrColorPicker.scss'
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

interface MdrColorPickerSpecificProps {
    label?: string,
    description?: string,
    message?: string,
    value?: string,
    defaultValue?: string,
    size?: 'Small' | 'Medium' | 'Large',
    disabled?: boolean,
    showTextInput?: boolean,
    onChange?: (value: string) => void,
}

export interface MdrColorPickerProps extends MdrComponent, MdrColorPickerSpecificProps { }

const normalizeColor = (value: string) => {
    if (!value) return '#000000';
    return value.startsWith('#') ? value : `#${value}`;
};

function MdrColorPicker({
    label,
    description,
    message,
    value,
    defaultValue = '#3f3f3f',
    size = 'Medium',
    disabled = false,
    showTextInput = true,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrColorPickerProps) {
    const [internalValue, setInternalValue] = useState(defaultValue);

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (nextValue: string) => {
        const normalized = normalizeColor(nextValue);
        if (value === undefined) {
            setInternalValue(normalized);
        }
        if (onChange) {
            onChange(normalized);
        }
    };

    const fullClassName = `MdrColorPicker ${size} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={`MdrField ${fullClassName}`} style={style as React.CSSProperties} id={id} {...dataProps}>
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel">{label}</label>
                </div>
            )}
            {description && <div className="MdrFieldDescription">{description}</div>}
            <div className="MdrColorPickerControls">
                <input
                    className="MdrColorPickerInput"
                    type="color"
                    value={normalizeColor(currentValue)}
                    disabled={disabled}
                    onChange={(event) => handleChange(event.target.value)}
                />
                {showTextInput && (
                    <input
                        className="MdrColorPickerText"
                        type="text"
                        value={normalizeColor(currentValue)}
                        disabled={disabled}
                        onChange={(event) => handleChange(event.target.value)}
                    />
                )}
                <span className="MdrColorPickerSwatch" style={{ backgroundColor: normalizeColor(currentValue) }} />
            </div>
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrColorPicker;
