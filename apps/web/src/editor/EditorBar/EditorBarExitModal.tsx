import { CornerDownLeft, Delete } from 'lucide-react';
import { MdrButton } from '@mdr/ui';
import { hasModifierKey, useWindowKeydown } from '@/shortcuts';

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
  useWindowKeydown(
    (event) => {
      if (event.defaultPrevented) return;
      if (hasModifierKey(event)) return;
      if (event.key === 'Backspace' || event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      }
    },
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(8,8,8,0.5)] backdrop-blur-[6px]"
      onClick={onClose}
    >
      <div
        className="w-[min(420px,90vw)] rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-[var(--color-0)] px-[20px] pb-[20px] pt-[18px] text-[var(--color-10)] shadow-[0_16px_40px_rgba(0,0,0,0.16)] dark:border-[rgba(255,255,255,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h3 className="m-0 text-[18px] font-bold">{title}</h3>
          <p className="mt-[6px] text-[12px] text-[var(--color-6)]">
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
