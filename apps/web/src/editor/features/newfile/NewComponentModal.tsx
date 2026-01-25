import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { MdrButton, MdrInput, MdrTextarea } from "@mdr/ui"
import "./NewComponentModal.scss"

interface NewComponentModalProps {
    open: boolean
    onClose: () => void
}

const createProjectId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function NewComponentModal({ open, onClose }: NewComponentModalProps) {
    const { t } = useTranslation('editor')
    const navigate = useNavigate()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [showErrors, setShowErrors] = useState(false)

    if (!open) return null

    const handleCreate = () => {
        if (!name.trim()) {
            setShowErrors(true)
            return
        }
        const id = createProjectId()
        onClose()
        navigate(`/editor/project/${id}/component`)
    }

    const nameError = showErrors && !name.trim()

    return (
        <div className="NewComponentModalOverlay" onClick={onClose}>
            <div className="NewComponentModalContainer" onClick={(event) => event.stopPropagation()}>
                <header className="NewComponentModalHeader">
                    <div>
                        <h2>{t('modals.newComponent.title')}</h2>
                        <p>{t('modals.newComponent.subtitle')}</p>
                    </div>
                    <button className="NewComponentModalClose" onClick={onClose} aria-label={t('modals.close')}>
                        ✕
                    </button>
                </header>

                <div className="NewComponentModalBody">
                    <div className="NewComponentModalField">
                        <label className="NewComponentModalLabel" htmlFor="new-component-name">
                            <span>{t('modals.newComponent.nameLabel')}</span>
                            <span className="NewComponentModalRequired">{t('modals.newComponent.required')}</span>
                        </label>
                        <MdrInput
                            id="new-component-name"
                            placeholder={t('modals.newComponent.namePlaceholder')}
                            value={name}
                            onChange={setName}
                            required
                            state={nameError ? "Error" : "Default"}
                        />
                        {nameError && (
                            <span className="NewComponentModalError">{t('modals.newComponent.nameRequired')}</span>
                        )}
                    </div>
                    <div className="NewComponentModalField">
                        <label className="NewComponentModalLabel">{t('modals.newComponent.descriptionLabel')}</label>
                        <MdrTextarea placeholder={t('modals.newComponent.descriptionPlaceholder')} value={description} onChange={setDescription} />
                    </div>
                </div>

                <footer className="NewComponentModalFooter">
                    <MdrButton text={t('modals.actions.cancel')} category="Ghost" onClick={onClose} />
                    <MdrButton text={t('modals.newComponent.create')} category="Primary" onClick={handleCreate} />
                </footer>
            </div>
        </div>
    )
}

export default NewComponentModal
