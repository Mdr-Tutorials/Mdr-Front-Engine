import { CornerDownLeft, Delete } from 'lucide-react';
import { MdrButton } from '@mdr/ui';
import { useEditorShortcut } from '@/editor/shortcuts';

type EditorBarExitModalProps = {
  isOpen: boolean;
  exitLabel: string;
  cancelLabel: string;
  exitText: string;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function EditorBarExitModal({
  isOpen,
  exitLabel,
  cancelLabel,
  exitText,
  title,
  onClose,
  onConfirm,
}: EditorBarExitModalProps) {
  useEditorShortcut('Escape', onClose, {
    enabled: isOpen,
    scope: 'modal',
    priority: 100,
    allowInEditable: true,
  });
  useEditorShortcut('Backspace', onClose, {
    enabled: isOpen,
    scope: 'modal',
    priority: 100,
    allowInEditable: true,
  });
  useEditorShortcut('Enter', onConfirm, {
    enabled: isOpen,
    scope: 'modal',
    priority: 100,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(8,8,8,0.5)] backdrop-blur-[6px]"
      onClick={onClose}
    >
      <div
        className="w-[min(420px,90vw)] rounded-[16px] border border-(--border-subtle) bg-(--bg-canvas) px-[20px] pt-[18px] pb-[20px] text-(--text-primary) shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h3 className="m-0 text-[18px] font-bold">{title}</h3>
          <p className="mt-[6px] text-(length:--font-size-xs) text-(--text-muted)">
            {exitLabel}
          </p>
        </div>
        <div className="mt-[16px] flex justify-end gap-[10px]">
          <MdrButton
            text={cancelLabel}
            category="Ghost"
            size="Small"
            icon={<Delete size={15} className="opacity-60" />}
            iconPosition="Right"
            onClick={onClose}
          />
          <MdrButton
            text={exitText}
            category="Primary"
            size="Small"
            icon={<CornerDownLeft size={15} className="opacity-60" />}
            iconPosition="Right"
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
}
