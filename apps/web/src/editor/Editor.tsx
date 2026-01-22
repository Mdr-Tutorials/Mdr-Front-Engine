import { Outlet } from "react-router"
import EditorBar from "./EditorBar/EditorBar"
import "./Editor.scss";

function Editor() {
    return (
        <div className="Editor">
            <EditorBar />
            <div className="EditorContent">
                <Outlet />
            </div>
        </div>
    )
}

export default Editor
