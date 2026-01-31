import "./EditorBarExitModal.scss"
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
    <div className="EditorBarExitOverlay" onClick={onClose}>
      <div className="EditorBarExitModal" onClick={(event) => event.stopPropagation()}>
        <div className="EditorBarExitTitle">
          <h3>{title}</h3>
          <p>{exitLabel}</p>
        </div>
        <div className="EditorBarExitActions">
          <MdrButton text={cancelLabel} category="Ghost" size="Small" onClick={onClose} />
          <MdrButton text={exitText} category="Primary" size="Small" onClick={onConfirm} />
        </div>
      </div>
    </div>
  )
}
