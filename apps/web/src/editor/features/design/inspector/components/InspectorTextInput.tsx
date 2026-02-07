type InspectorTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

export function InspectorTextInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  inputMode,
}: InspectorTextInputProps) {
  return (
    <input
      className="InspectorTextInput h-[30px] w-full min-w-0 border-0 bg-transparent px-2.5 text-xs text-(--color-9) outline-none placeholder:text-(--color-4) disabled:cursor-not-allowed disabled:opacity-60"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
