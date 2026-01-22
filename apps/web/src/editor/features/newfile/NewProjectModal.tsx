import { useState } from "react"
import { useNavigate } from "react-router"
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
    const navigate = useNavigate()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    if (!open) return null

    const handleCreate = () => {
        if (!name.trim()) return
        const id = createProjectId()
        onClose()
        navigate(`/editor/project/${id}/blueprint`)
    }

    return (
        <div className="NewProjectModalOverlay" onClick={onClose}>
            <div className="NewProjectModalContainer" onClick={(event) => event.stopPropagation()}>
                <header className="NewProjectModalHeader">
                    <div>
                        <h2>新建项目</h2>
                        <p>创建一个包含蓝图与页面的完整项目</p>
                    </div>
                    <button className="NewProjectModalClose" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </header>

                <div className="NewProjectModalBody">
                    <div className="NewProjectModalField">
                        <label>项目名称</label>
                        <MdrInput placeholder="例如：Mdr Starter" value={name} onChange={setName} />
                    </div>
                    <div className="NewProjectModalField">
                        <label>描述</label>
                        <MdrTextarea placeholder="可选，描述该项目用途" value={description} onChange={setDescription} />
                    </div>
                </div>

                <footer className="NewProjectModalFooter">
                    <MdrButton text="取消" category="Ghost" onClick={onClose} />
                    <MdrButton text="创建项目" category="Primary" onClick={handleCreate} />
                </footer>
            </div>
        </div>
    )
}

export default NewProjectModal
