import { Outlet } from "react-router"
import EditorBar from "./EditorBar/EditorBar"
import { SettingsEffects } from "./features/settings/SettingsEffects";

function Editor() {
    return (
        <div className="flex min-h-screen max-h-screen flex-row bg-[linear-gradient(120deg,var(--color-0)_20%,var(--color-1)_100%)]">
            <SettingsEffects />
            <EditorBar />
            <div className="min-h-screen flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    )
}

export default Editor
