import { useMemo } from 'react';
import { MdrInput } from '@mdr/ui';
import { useTranslation } from 'react-i18next';

type ColorInputProps = {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

const normalizeHex = (raw: string) => {
  const value = raw.trim();
  if (!value) return null;
  if (/^#([0-9a-f]{3})$/i.test(value)) return value;
  if (/^#([0-9a-f]{6})$/i.test(value)) return value;
  return null;
};

export function ColorInput({
  value,
  onChange,
  placeholder,
  disabled = false,
}: ColorInputProps) {
  const { t } = useTranslation('blueprint');
  const swatchValue = useMemo(() => normalizeHex(value ?? ''), [value]);

  return (
    <div className="flex w-full max-w-65 items-center justify-end gap-2">
      <div className="min-w-0 flex-1">
        <MdrInput
          size="Small"
          value={value ?? ''}
          onChange={(next) => onChange(next.trim() ? next : undefined)}
          placeholder={
            placeholder ??
            t('inspector.fields.colorInput.placeholder', {
              defaultValue: '#RRGGBB / var(--color-x)',
            })
          }
          disabled={disabled}
        />
      </div>
      <input
        type="color"
        value={swatchValue ?? '#000000'}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-9 cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.12)] bg-transparent p-0 in-data-[theme='dark']:border-[rgba(255,255,255,0.16)]"
        aria-label={t('inspector.fields.colorInput.pickerAria', {
          defaultValue: 'Color picker',
        })}
      />
    </div>
  );
}
