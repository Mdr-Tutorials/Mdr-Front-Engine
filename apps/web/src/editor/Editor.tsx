import { Outlet } from "react-router"
import EditorBar from "./EditorBar/EditorBar"
import "./Editor.scss";
import { SettingsEffects } from "./features/settings/SettingsEffects";

function Editor() {
    return (
        <div className="Editor">
            <SettingsEffects />
            <EditorBar />
            <div className="EditorContent">
                <Outlet />
            </div>
        </div>
    )
}

export default Editor
