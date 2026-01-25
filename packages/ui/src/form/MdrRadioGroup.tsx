import './MdrRadioGroup.scss'
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useId, useState } from 'react';
import type React from 'react';

export interface MdrRadioOption {
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
}

interface MdrRadioGroupSpecificProps {
    label?: string,
    description?: string,
    message?: string,
    options: MdrRadioOption[];
    value?: string;
    defaultValue?: string;
    name?: string;
    layout?: 'Vertical' | 'Horizontal';
    disabled?: boolean;
    onChange?: (value: string) => void;
}

export interface MdrRadioGroupProps extends MdrComponent, MdrRadioGroupSpecificProps { }

function MdrRadioGroup({
    label,
    description,
    message,
    options,
    value,
    defaultValue,
    name,
    layout = 'Vertical',
    disabled = false,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrRadioGroupProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const fallbackName = useId();

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;
    const groupName = name || `mdr-radio-${fallbackName}`;

    const handleChange = (nextValue: string) => {
        if (value === undefined) {
            setInternalValue(nextValue);
        }
        if (onChange) {
            onChange(nextValue);
        }
    };

    const fullClassName = `MdrRadioGroup ${layout} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={`MdrField ${fullClassName}`} style={style as React.CSSProperties} id={id} {...dataProps}>
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel">{label}</label>
                </div>
            )}
            {description && <div className="MdrFieldDescription">{description}</div>}
            <ul className="MdrRadioGroupList">
                {options.map((option) => {
                    const isDisabled = disabled || option.disabled;
                    return (
                        <li key={option.value} className="MdrRadioGroupItem">
                            <label className={`MdrRadioGroupLabel ${isDisabled ? 'Disabled' : ''}`}>
                                <input
                                    type="radio"
                                    name={groupName}
                                    value={option.value}
                                    checked={currentValue === option.value}
                                    disabled={isDisabled}
                                    onChange={() => handleChange(option.value)}
                                />
                                <span className="MdrRadioGroupText">
                                    <span>{option.label}</span>
                                    {option.description && (
                                        <span className="MdrRadioGroupDescription">{option.description}</span>
                                    )}
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrRadioGroup;
