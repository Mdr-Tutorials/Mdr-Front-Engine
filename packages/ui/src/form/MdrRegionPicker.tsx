import './MdrRegionPicker.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

export interface MdrRegionOption {
  label: string;
  value: string;
  children?: MdrRegionOption[];
}

export interface MdrRegionValue {
  province?: string;
  city?: string;
  district?: string;
}

interface MdrRegionPickerSpecificProps {
  label?: string;
  description?: string;
  message?: string;
  size?: 'Small' | 'Medium' | 'Large';
  state?: 'Default' | 'Error' | 'Warning' | 'Success';
  disabled?: boolean;
  required?: boolean;
  options: MdrRegionOption[];
  value?: MdrRegionValue;
  defaultValue?: MdrRegionValue;
  placeholder?: {
    province?: string;
    city?: string;
    district?: string;
  };
  onChange?: (value: MdrRegionValue, labels: MdrRegionValue) => void;
}

export interface MdrRegionPickerProps
  extends MdrComponent,
    MdrRegionPickerSpecificProps {}

const findLabel = (options: MdrRegionOption[], value?: string) => {
  if (!value) return undefined;
  return options.find((option) => option.value === value)?.label;
};

function MdrRegionPicker({
  label,
  description,
  message,
  size = 'Medium',
  state = 'Default',
  disabled = false,
  required = false,
  options,
  value,
  defaultValue,
  placeholder,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrRegionPickerProps) {
  const [internalValue, setInternalValue] = useState<MdrRegionValue>(
    defaultValue || {}
  );

  useEffect(() => {
    if (value) {
      setInternalValue(value);
    }
  }, [value?.province, value?.city, value?.district]);

  const currentValue = value || internalValue;

  const provinces = options;
  const selectedProvince = provinces.find(
    (item) => item.value === currentValue.province
  );
  const cities = selectedProvince?.children || [];
  const selectedCity = cities.find((item) => item.value === currentValue.city);
  const districts = selectedCity?.children || [];

  const emitChange = (nextValue: MdrRegionValue) => {
    const labels: MdrRegionValue = {
      province: findLabel(provinces, nextValue.province),
      city: findLabel(cities, nextValue.city),
      district: findLabel(districts, nextValue.district),
    };

    if (!value) {
      setInternalValue(nextValue);
    }
    if (onChange) {
      onChange(nextValue, labels);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value || undefined;
    emitChange({ province, city: undefined, district: undefined });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value || undefined;
    emitChange({ province: currentValue.province, city, district: undefined });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value || undefined;
    emitChange({
      province: currentValue.province,
      city: currentValue.city,
      district,
    });
  };

  const fullClassName =
    `MdrRegionPicker ${size} ${state} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
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
          {required && <span className="MdrFieldRequired">*</span>}
        </div>
      )}
      {description && <div className="MdrFieldDescription">{description}</div>}
      <div className="MdrRegionPickerControls">
        <select
          className="MdrRegionPickerSelect"
          disabled={disabled}
          value={currentValue.province || ''}
          onChange={handleProvinceChange}
        >
          <option value="">{placeholder?.province || 'Province'}</option>
          {provinces.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="MdrRegionPickerSelect"
          disabled={disabled || !currentValue.province}
          value={currentValue.city || ''}
          onChange={handleCityChange}
        >
          <option value="">{placeholder?.city || 'City'}</option>
          {cities.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="MdrRegionPickerSelect"
          disabled={disabled || !currentValue.city}
          value={currentValue.district || ''}
          onChange={handleDistrictChange}
        >
          <option value="">{placeholder?.district || 'District'}</option>
          {districts.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {message && <div className={`MdrFieldMessage ${state}`}>{message}</div>}
    </div>
  );
}

export default MdrRegionPicker;
