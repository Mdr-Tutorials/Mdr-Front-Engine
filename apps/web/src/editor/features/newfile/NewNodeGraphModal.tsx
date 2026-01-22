import { useState } from "react"
import { useNavigate } from "react-router"
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
    const navigate = useNavigate()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    if (!open) return null

    const handleCreate = () => {
        if (!name.trim()) return
        const id = createProjectId()
        onClose()
        navigate(`/editor/project/${id}/nodegraph`)
    }

    return (
        <div className="NewNodeGraphModalOverlay" onClick={onClose}>
            <div className="NewNodeGraphModalContainer" onClick={(event) => event.stopPropagation()}>
                <header className="NewNodeGraphModalHeader">
                    <div>
                        <h2>新建独立节点图</h2>
                        <p>创建一个节点流程图并进入节点编辑器</p>
                    </div>
                    <button className="NewNodeGraphModalClose" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </header>

                <div className="NewNodeGraphModalBody">
                    <div className="NewNodeGraphModalField">
                        <label>节点图名称</label>
                        <MdrInput placeholder="例如：CheckoutGraph" value={name} onChange={setName} />
                    </div>
                    <div className="NewNodeGraphModalField">
                        <label>描述</label>
                        <MdrTextarea placeholder="可选，描述该节点图用途" value={description} onChange={setDescription} />
                    </div>
                </div>

                <footer className="NewNodeGraphModalFooter">
                    <MdrButton text="取消" category="Ghost" onClick={onClose} />
                    <MdrButton text="创建节点图" category="Primary" onClick={handleCreate} />
                </footer>
            </div>
        </div>
    )
}

export default NewNodeGraphModal
