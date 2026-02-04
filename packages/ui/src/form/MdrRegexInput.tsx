import './MdrRegexInput.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';

interface MdrRegexInputSpecificProps {
  label?: string;
  description?: string;
  message?: string;
  invalidMessage?: string;
  validMessage?: string;
  pattern: string | RegExp;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: 'Small' | 'Medium' | 'Large';
  state?: 'Default' | 'Error' | 'Warning' | 'Success';
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
}

export interface MdrRegexInputProps
  extends MdrComponent,
    MdrRegexInputSpecificProps {}

function MdrRegexInput({
  label,
  description,
  message,
  invalidMessage = 'Invalid format',
  validMessage = 'Looks good',
  pattern,
  value,
  defaultValue,
  placeholder,
  size = 'Medium',
  state = 'Default',
  disabled = false,
  required = false,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrRegexInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const currentValue = value !== undefined ? value : internalValue;

  const safeRegex = useMemo(() => {
    try {
      if (pattern instanceof RegExp) {
        const flags = pattern.flags.replace('g', '');
        return new RegExp(pattern.source, flags);
      }
      return new RegExp(pattern);
    } catch {
      return undefined;
    }
  }, [pattern]);

  const isValid = safeRegex ? safeRegex.test(currentValue) : true;

  const resolvedState =
    state !== 'Default'
      ? state
      : currentValue
        ? isValid
          ? 'Success'
          : 'Error'
        : 'Default';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    if (onChange) {
      onChange(nextValue);
    }
  };

  const fullClassName =
    `MdrRegexInput ${size} ${resolvedState} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  const helperMessage =
    message ||
    (currentValue ? (isValid ? validMessage : invalidMessage) : undefined);

  return (
    <div
      className={`MdrField ${fullClassName}`}
      style={style as React.CSSProperties}
      id={id}
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
      <input
        className="MdrRegexInputControl"
        id={id}
        type="text"
        placeholder={placeholder}
        value={currentValue}
        disabled={disabled}
        required={required}
        onChange={handleChange}
      />
      {helperMessage && (
        <div className={`MdrFieldMessage ${resolvedState}`}>
          {helperMessage}
        </div>
      )}
    </div>
  );
}

export default MdrRegexInput;
