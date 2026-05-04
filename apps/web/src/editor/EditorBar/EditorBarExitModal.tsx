import { EditorConfirmModal } from '@/editor/components/EditorConfirmModal';

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
  return (
    <EditorConfirmModal
      open={isOpen}
      title={title}
      message={exitLabel}
      cancelText={cancelLabel}
      confirmText={exitText}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
}
