import { AlertTriangle, Check, CloudOff, Loader2 } from 'lucide-react';
import type {
    SaveIndicatorTone,
    SaveStatus,
    SaveTransport,
} from './BlueprintEditor.autosave';

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
                    ? 'border-rose-200 bg-rose-100 text-rose-700'
                    : tone === 'warning'
                      ? 'border-amber-200 bg-amber-100 text-amber-700'
                      : tone === 'success'
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
            }`}
        >
            {icon}
            <span className="sr-only">{label}</span>
        </div>
    );
}
