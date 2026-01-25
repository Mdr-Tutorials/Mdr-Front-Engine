import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { MdrButton, MdrInput, MdrTextarea } from "@mdr/ui"
import "./NewNodeGraphModal.scss"

interface NewNodeGraphModalProps {
    open: boolean
    onClose: () => void
}

const createProjectId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return `graph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function NewNodeGraphModal({ open, onClose }: NewNodeGraphModalProps) {
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
        navigate(`/editor/project/${id}/nodegraph`)
    }

    const nameError = showErrors && !name.trim()

    return (
        <div className="NewNodeGraphModalOverlay" onClick={onClose}>
            <div className="NewNodeGraphModalContainer" onClick={(event) => event.stopPropagation()}>
                <header className="NewNodeGraphModalHeader">
                    <div>
                        <h2>{t('modals.newNodeGraph.title')}</h2>
                        <p>{t('modals.newNodeGraph.subtitle')}</p>
                    </div>
                    <button className="NewNodeGraphModalClose" onClick={onClose} aria-label={t('modals.close')}>
                        ✕
                    </button>
                </header>

                <div className="NewNodeGraphModalBody">
                    <div className="NewNodeGraphModalField">
                        <label className="NewNodeGraphModalLabel" htmlFor="new-nodegraph-name">
                            <span>{t('modals.newNodeGraph.nameLabel')}</span>
                            <span className="NewNodeGraphModalRequired">{t('modals.newNodeGraph.required')}</span>
                        </label>
                        <MdrInput
                            id="new-nodegraph-name"
                            placeholder={t('modals.newNodeGraph.namePlaceholder')}
                            value={name}
                            onChange={setName}
                            required
                            state={nameError ? "Error" : "Default"}
                        />
                        {nameError && (
                            <span className="NewNodeGraphModalError">{t('modals.newNodeGraph.nameRequired')}</span>
                        )}
                    </div>
                    <div className="NewNodeGraphModalField">
                        <label className="NewNodeGraphModalLabel">{t('modals.newNodeGraph.descriptionLabel')}</label>
                        <MdrTextarea placeholder={t('modals.newNodeGraph.descriptionPlaceholder')} value={description} onChange={setDescription} />
                    </div>
                </div>

                <footer className="NewNodeGraphModalFooter">
                    <MdrButton text={t('modals.actions.cancel')} category="Ghost" onClick={onClose} />
                    <MdrButton text={t('modals.newNodeGraph.create')} category="Primary" onClick={handleCreate} />
                </footer>
            </div>
        </div>
    )
}

export default NewNodeGraphModal
