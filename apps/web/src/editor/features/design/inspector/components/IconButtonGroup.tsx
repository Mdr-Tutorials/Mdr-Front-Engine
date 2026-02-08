import { type ReactNode } from 'react';

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
    const containerClass =
        layout === 'horizontal'
            ? 'flex flex-col gap-0.5'
            : 'grid grid-cols-2 gap-0.5';

    return (
        <div className={containerClass}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`flex w-full min-w-15 flex-row items-center justify-between gap-1 rounded px-2 py-1.5 text-(--color-6) transition-all ${
                        value === option.value
                            ? 'bg-(--color-2) font-medium text-(--color-9) hover:bg-(--color-3)'
                            : 'bg-transparent hover:bg-(--color-1) hover:text-(--color-8)'
                    }`}
                    onClick={() => onChange(option.value)}
                    title={option.label}
                    aria-label={option.label}
                >
                    <span className="flex items-center justify-center text-[20px]">
                        {option.icon}
                    </span>
                    <span className="text-center text-[11px] leading-[1.2] whitespace-nowrap">
                        {option.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
