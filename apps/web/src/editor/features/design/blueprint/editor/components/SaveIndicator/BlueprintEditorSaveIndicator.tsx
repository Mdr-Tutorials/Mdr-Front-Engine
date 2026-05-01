import { AlertTriangle, Check, CloudOff, Loader2 } from 'lucide-react';
import type {
  SaveIndicatorTone,
  SaveStatus,
  SaveTransport,
} from '@/editor/features/design/BlueprintEditor.autosave';

type BlueprintEditorSaveIndicatorProps = {
  status: SaveStatus;
  transport: SaveTransport;
  label: string;
  tone: SaveIndicatorTone;
  isWorkspaceSaveDisabled: boolean;
};

export function BlueprintEditorSaveIndicator({
  status,
  transport,
  label,
  tone,
  isWorkspaceSaveDisabled,
}: BlueprintEditorSaveIndicatorProps) {
  const icon =
    status === 'error' ? (
      <AlertTriangle size={14} />
    ) : status === 'saving' ? (
      <Loader2 size={14} className="animate-spin" />
    ) : isWorkspaceSaveDisabled ? (
      <CloudOff size={14} />
    ) : (
      <Check size={14} />
    );

  return (
    <div
      data-testid="blueprint-save-indicator"
      data-status={status}
      data-transport={transport ?? 'none'}
      title={label}
      aria-live="polite"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
        tone === 'error'
          ? 'border-(--danger-color) bg-(--danger-subtle) text-(--danger-color)'
          : tone === 'warning'
            ? 'border-(--warning-color) bg-(--warning-subtle) text-(--warning-color)'
            : tone === 'success'
              ? 'border-(--success-color) bg-(--success-subtle) text-(--success-color)'
              : 'border-(--border-default) bg-(--bg-raised) text-(--text-secondary)'
      }`}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </div>
  );
}
