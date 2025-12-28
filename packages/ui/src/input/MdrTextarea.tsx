import './MdrTextarea.scss'
import React from 'react';
import { type MdrComponent } from '@mdr/shared';

interface MdrTextareaSpecificProps {
    placeholder?: string,
    value?: string,
    size?: 'Small' | 'Medium' | 'Large',
    state?: 'Default' | 'Error' | 'Warning' | 'Success',
    disabled?: boolean,
    readOnly?: boolean,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    rows?: number,
    cols?: number,
    wrap?: 'Hard' | 'Soft' | 'Off',
    resize?: 'None' | 'Horizontal' | 'Vertical' | 'Both',
    autoFocus?: boolean,
    name?: string,
    onChange?: (value: string) => void,
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>,
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>,
    onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>,
    onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement>,
}

export interface MdrTextareaProps extends MdrComponent, MdrTextareaSpecificProps { }

function MdrTextarea({
    size = 'Medium',
    placeholder,
    value,
    state,
    disabled = false,
    readOnly = false,
    required = false,
    minLength,
    maxLength,
    rows = 4,
    cols,
    wrap,
    resize = 'Both',
    autoFocus = false,
    name,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    className,
    style,
    id,
    dataAttributes = {},
    onClick,
}: MdrTextareaProps) {
    const fullClassName = `MdrTextarea ${size} ${state ? state : ''} ${disabled ? 'Disabled' : ''} ${readOnly ? 'ReadOnly' : ''} ${resize} ${className || ''}`.trim();

    const dataProps = { ...dataAttributes }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    const getResizeStyle = () => {
        const resizeMap: Record<string, 'none' | 'horizontal' | 'vertical' | 'both'> = {
            'None': 'none',
            'Horizontal': 'horizontal',
            'Vertical': 'vertical',
            'Both': 'both',
        };
        return {
            resize: resizeMap[resize] || 'both',
        };
    };

    return (
        <textarea
            className={fullClassName}
            style={{ ...getResizeStyle(), ...style as React.CSSProperties }}
            id={id}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            minLength={minLength}
            maxLength={maxLength}
            rows={rows}
            cols={cols}
            wrap={wrap?.toLowerCase() as 'hard' | 'soft' | 'off'}
            autoFocus={autoFocus}
            name={name}
            onChange={handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onClick={onClick}
            {...dataProps}
        />
    );
}

export default MdrTextarea;
