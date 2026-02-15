import './MdrTreeSelect.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';

export interface MdrTreeSelectOption {
  id: string;
  label: string;
  children?: MdrTreeSelectOption[];
}

interface MdrTreeSelectSpecificProps {
  label?: string;
  description?: string;
  message?: string;
  options: MdrTreeSelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string, option?: MdrTreeSelectOption) => void;
}

export interface MdrTreeSelectProps
  extends MdrComponent,
    MdrTreeSelectSpecificProps {}

const flattenOptions = (
  options: MdrTreeSelectOption[],
  depth = 0
): Array<{ option: MdrTreeSelectOption; depth: number }> => {
  return options.flatMap((option) => [
    { option, depth },
    ...(option.children ? flattenOptions(option.children, depth + 1) : []),
  ]);
};

function MdrTreeSelect({
  label,
  description,
  message,
  options,
  value,
  defaultValue,
  placeholder = 'Select item',
  disabled = false,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrTreeSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const currentValue = value !== undefined ? value : internalValue;
  const flatOptions = useMemo(() => flattenOptions(options), [options]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    const selected = flatOptions.find(
      (item) => item.option.id === nextValue
    )?.option;
    if (onChange) {
      onChange(nextValue, selected);
    }
  };

  const fullClassName =
    `MdrTreeSelect ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
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
        </div>
      )}
      {description && <div className="MdrFieldDescription">{description}</div>}
      <select
        className="MdrTreeSelectControl"
        disabled={disabled}
        value={currentValue}
        onChange={handleChange}
      >
        {/* Keep empty value selectable state without showing it in the dropdown list. */}
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {flatOptions.map(({ option, depth }) => {
          const prefix = depth > 0 ? `${'-'.repeat(depth)} ` : '';
          return (
            <option key={option.id} value={option.id}>
              {`${prefix}${option.label}`}
            </option>
          );
        })}
      </select>
      {message && <div className="MdrFieldMessage">{message}</div>}
    </div>
  );
}

export default MdrTreeSelect;
