import './MdrRating.scss';
import { type MdrComponent } from '@mdr/shared';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import type React from 'react';

interface MdrRatingSpecificProps {
  label?: string;
  description?: string;
  message?: string;
  value?: number;
  defaultValue?: number;
  max?: number;
  size?: 'Small' | 'Medium' | 'Large';
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

export interface MdrRatingProps extends MdrComponent, MdrRatingSpecificProps {}

function MdrRating({
  label,
  description,
  message,
  value,
  defaultValue = 0,
  max = 5,
  size = 'Medium',
  readOnly = false,
  disabled = false,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrRatingProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const currentValue = value !== undefined ? value : internalValue;
  const displayValue = hoverValue !== null ? hoverValue : currentValue;

  const handleSelect = (nextValue: number) => {
    if (readOnly || disabled) return;
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    if (onChange) {
      onChange(nextValue);
    }
  };

  const fullClassName =
    `MdrRating ${size} ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
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
      <div className="MdrRatingStars">
        {Array.from({ length: max }, (_, index) => {
          const ratingValue = index + 1;
          return (
            <button
              key={ratingValue}
              type="button"
              className={`MdrRatingStar ${displayValue >= ratingValue ? 'Active' : ''}`}
              onClick={() => handleSelect(ratingValue)}
              onMouseEnter={() => setHoverValue(ratingValue)}
              onMouseLeave={() => setHoverValue(null)}
              disabled={disabled}
            >
              <Star className="MdrRatingIcon" />
            </button>
          );
        })}
      </div>
      {message && <div className="MdrFieldMessage">{message}</div>}
    </div>
  );
}

export default MdrRating;
