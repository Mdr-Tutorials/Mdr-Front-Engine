import { ReactNode } from 'react';
import './IconButtonGroup.css';

export type IconButtonOption<T extends string = string> = {
  value: T;
  icon: ReactNode;
  label: string;
};

type IconButtonGroupProps<T extends string = string> = {
  value: T;
  options: IconButtonOption<T>[];
  onChange: (value: T) => void;
  layout?: 'horizontal' | 'grid' | 'grid-2x2';
};

export function IconButtonGroup<T extends string = string>({
  value,
  options,
  onChange,
  layout = 'horizontal',
}: IconButtonGroupProps<T>) {
  const getLayoutClass = () => {
    if (layout === 'grid') return 'Grid';
    if (layout === 'grid-2x2') return 'Grid2x2';
    return 'Horizontal';
  };

  return (
    <div className={`IconButtonGroup ${getLayoutClass()}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`IconButton ${value === option.value ? 'Active' : ''}`}
          onClick={() => onChange(option.value)}
          title={option.label}
          aria-label={option.label}
        >
          <span className="IconButtonIcon">{option.icon}</span>
          <span className="IconButtonLabel">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
