import { useState } from "react"
import { useNavigate } from "react-router"
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
    const navigate = useNavigate()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    if (!open) return null

    const handleCreate = () => {
        if (!name.trim()) return
        const id = createProjectId()
        onClose()
        navigate(`/editor/project/${id}/component`)
    }

    return (
        <div className="NewComponentModalOverlay" onClick={onClose}>
            <div className="NewComponentModalContainer" onClick={(event) => event.stopPropagation()}>
                <header className="NewComponentModalHeader">
                    <div>
                        <h2>新建独立组件</h2>
                        <p>创建一个可复用组件并进入组件编辑器</p>
                    </div>
                    <button className="NewComponentModalClose" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </header>

                <div className="NewComponentModalBody">
                    <div className="NewComponentModalField">
                        <label>组件名称</label>
                        <MdrInput placeholder="例如：PrimaryButton" value={name} onChange={setName} />
                    </div>
                    <div className="NewComponentModalField">
                        <label>描述</label>
                        <MdrTextarea placeholder="可选，描述该组件用途" value={description} onChange={setDescription} />
                    </div>
                </div>

                <footer className="NewComponentModalFooter">
                    <MdrButton text="取消" category="Ghost" onClick={onClose} />
                    <MdrButton text="创建组件" category="Primary" onClick={handleCreate} />
                </footer>
            </div>
        </div>
    )
}

export default NewComponentModal
