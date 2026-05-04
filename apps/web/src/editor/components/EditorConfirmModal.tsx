import { CornerDownLeft, Delete } from 'lucide-react';
import { MdrButton, MdrModal } from '@mdr/ui';
import { useEditorShortcut } from '@/editor/shortcuts';

type EditorConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function EditorConfirmModal({
  open,
  title,
  message,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
}: EditorConfirmModalProps) {
  useEditorShortcut('Escape', onCancel, {
    enabled: open,
    scope: 'modal',
    priority: 100,
    allowInEditable: true,
  });
  useEditorShortcut('Backspace', onCancel, {
    enabled: open,
    scope: 'modal',
    priority: 100,
    allowInEditable: true,
  });
  useEditorShortcut('Enter', onConfirm, {
    enabled: open,
    scope: 'modal',
    priority: 100,
  });

  return (
    <MdrModal
      open={open}
      title={title}
      size="Small"
      onClose={onCancel}
      footer={
        <>
          <MdrButton
            text={cancelText}
            category="Ghost"
            size="Small"
            icon={<Delete size={15} className="opacity-60" />}
            iconPosition="Right"
            onClick={onCancel}
          />
          <MdrButton
            text={confirmText}
            category="Primary"
            size="Small"
            icon={<CornerDownLeft size={15} className="opacity-60" />}
            iconPosition="Right"
            onClick={onConfirm}
          />
        </>
      }
    >
      <p className="m-0 text-sm text-(--text-secondary)">{message}</p>
    </MdrModal>
  );
}
