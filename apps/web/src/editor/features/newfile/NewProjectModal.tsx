import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { MdrButton, MdrInput, MdrTextarea } from "@mdr/ui"
import "./NewProjectModal.scss"

interface NewProjectModalProps {
    open: boolean
    onClose: () => void
}

const createProjectId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function NewProjectModal({ open, onClose }: NewProjectModalProps) {
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
        navigate(`/editor/project/${id}/blueprint`)
    }

    const nameError = showErrors && !name.trim()

    return (
        <div className="NewProjectModalOverlay" onClick={onClose}>
            <div className="NewProjectModalContainer" onClick={(event) => event.stopPropagation()}>
                <header className="NewProjectModalHeader">
                    <div>
                        <h2>{t('modals.newProject.title')}</h2>
                        <p>{t('modals.newProject.subtitle')}</p>
                    </div>
                    <button className="NewProjectModalClose" onClick={onClose} aria-label={t('modals.close')}>✕</button>
                </header>

                <div className="NewProjectModalBody">
                    <div className="NewProjectModalField">
                        <label className="NewProjectModalLabel" htmlFor="new-project-name">
                            <span>{t('modals.newProject.nameLabel')}</span>
                            <span className="NewProjectModalRequired">{t('modals.newProject.required')}</span>
                        </label>
                        <MdrInput
                            id="new-project-name"
                            placeholder={t('modals.newProject.namePlaceholder')}
                            value={name}
                            onChange={setName}
                            required
                            state={nameError ? "Error" : "Default"}
                        />
                        {nameError && (
                            <span className="NewProjectModalError">{t('modals.newProject.nameRequired')}</span>
                        )}
                    </div>
                    <div className="NewProjectModalField">
                        <label className="NewProjectModalLabel">{t('modals.newProject.descriptionLabel')}</label>
                        <MdrTextarea placeholder={t('modals.newProject.descriptionPlaceholder')} value={description} onChange={setDescription} />
                    </div>
                </div>

                <footer className="NewProjectModalFooter">
                    <MdrButton text={t('modals.actions.cancel')} category="Ghost" onClick={onClose} />
                    <MdrButton text={t('modals.newProject.create')} category="Primary" onClick={handleCreate} />
                </footer>
            </div>
        </div>
    )
}

export default NewProjectModal
