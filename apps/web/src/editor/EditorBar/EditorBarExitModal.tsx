import { MdrButton } from "@mdr/ui"

type EditorBarExitModalProps = {
  isOpen: boolean
  exitLabel: string
  cancelLabel: string
  exitText: string
  title: string
  onClose: () => void
  onConfirm: () => void
}

export function EditorBarExitModal({
  isOpen,
  exitLabel,
  cancelLabel,
  exitText,
  title,
  onClose,
  onConfirm,
}: EditorBarExitModalProps) {
  if (!isOpen) return null

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
          <p className="mt-[6px] text-[12px] text-[var(--color-6)]">{exitLabel}</p>
        </div>
        <div className="mt-[16px] flex justify-end gap-[10px]">
          <MdrButton text={cancelLabel} category="Ghost" size="Small" onClick={onClose} />
          <MdrButton text={exitText} category="Primary" size="Small" onClick={onConfirm} />
        </div>
      </div>
    </div>
  )
}
