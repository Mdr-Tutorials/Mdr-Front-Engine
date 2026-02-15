import './MdrTimePicker.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

interface MdrTimePickerSpecificProps {
  label?: string;
  description?: string;
  message?: string;
  value?: string;
  placeholder?: string;
  size?: 'Small' | 'Medium' | 'Large';
  state?: 'Default' | 'Error' | 'Warning' | 'Success';
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  name?: string;
  autoFocus?: boolean;
  showIcon?: boolean;
  onChange?: (value: string) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export interface MdrTimePickerProps
  extends MdrComponent,
    MdrTimePickerSpecificProps {}

function MdrTimePicker({
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
}: MdrTimePickerProps) {
  const fullClassName =
    `MdrTimePicker ${size} ${state} ${disabled ? 'Disabled' : ''} ${readOnly ? 'ReadOnly' : ''} ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
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
      {description && <div className="MdrFieldDescription">{description}</div>}
      <div className="MdrTimePickerControl">
        <input
          className="MdrTimePickerInput"
          id={id}
          type="time"
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
          <span className="MdrTimePickerIcon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6l4 2" />
            </svg>
          </span>
        )}
      </div>
      {message && <div className={`MdrFieldMessage ${state}`}>{message}</div>}
    </div>
  );
}

export default MdrTimePicker;
