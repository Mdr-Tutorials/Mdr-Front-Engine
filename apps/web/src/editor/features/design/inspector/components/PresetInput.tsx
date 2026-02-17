import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type PresetInputOption = {
  label: string;
  value: string;
};

type PresetInputProps = {
  value: string;
  options: PresetInputOption[];
  placeholder?: string;
  onChange: (value: string) => void;
};

export function PresetInput({
  value,
  options,
  placeholder,
  onChange,
}: PresetInputProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="InspectorInputRow group relative flex w-full items-center gap-1"
    >
      <input
        className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 pr-7 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="absolute right-1 inline-flex h-5 w-5 items-center justify-center rounded-sm border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
        onClick={() => setOpen((current) => !current)}
        aria-label="Toggle ratio presets"
      >
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-44 overflow-auto rounded-md border border-black/10 bg-(--color-0) p-1 shadow-[0_8px_18px_rgba(0,0,0,0.12)] dark:border-white/14">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="flex w-full items-center rounded-sm border-0 bg-transparent px-2 py-1 text-left text-xs text-(--color-8) hover:bg-black/4 hover:text-(--color-9) dark:hover:bg-white/8"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
