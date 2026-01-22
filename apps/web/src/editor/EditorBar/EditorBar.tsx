import "./EditorBar.scss";
import { useState } from "react";
import { MdrButton, MdrIcon, MdrIconLink } from "@mdr/ui";
import { useNavigate, useParams } from "react-router";
import { LogIn, LayoutGrid, GitBranch, Box, Sparkles, TestTube, FileCode, Rocket, Settings } from "lucide-react";

function EditorBar() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [isExitOpen, setExitOpen] = useState(false);
    const basePath = projectId ? `/editor/project/${projectId}` : "/editor";
    const exitTarget = projectId ? "/editor" : "/";
    const exitLabel = projectId ? "返回编辑器主页" : "返回主页";

    return (
        <nav className="EditorBar">
            <section className="EditorBarTop">
                <button
                    className="EditorBarExitButton"
                    aria-label="Exit editor"
                    onClick={() => setExitOpen(true)}
                >
                    <MdrIcon icon={<LogIn size={26} />} size={26} />
                </button>
            </section>
            <section className="EditorBarCenter">
                <MdrIconLink icon={<LayoutGrid size={22} />} size={22} to={`${basePath}/blueprint`} />
                <MdrIconLink icon={<Box size={22} />} size={22} to={`${basePath}/component`} />
                {projectId && (
                    <>
                        <MdrIconLink icon={<GitBranch size={22} />} size={22} to={`${basePath}/nodegraph`} />
                        <MdrIconLink icon={<Sparkles size={22} />} size={22} to={`${basePath}/animation`} />
                        <MdrIconLink icon={<TestTube size={22} />} size={22} to={`${basePath}/test`} />
                        <MdrIconLink icon={<FileCode size={22} />} size={22} to={`${basePath}/export`} />
                        <MdrIconLink icon={<Rocket size={22} />} size={22} to={`${basePath}/deployment`} />
                    </>
                )}
            </section>
            <section className="EditorBarBottom">
                <MdrIconLink icon={<Settings size={22} />} size={22} to="/editor/settings" />
            </section>

            {isExitOpen && (
                <div className="EditorBarExitOverlay" onClick={() => setExitOpen(false)}>
                    <div className="EditorBarExitModal" onClick={(event) => event.stopPropagation()}>
                        <div className="EditorBarExitTitle">
                            <h3>退出编辑器？</h3>
                            <p>{exitLabel}</p>
                        </div>
                        <div className="EditorBarExitActions">
                            <MdrButton text="取消" category="Ghost" size="Small" onClick={() => setExitOpen(false)} />
                            <MdrButton
                                text="退出"
                                category="Primary"
                                size="Small"
                                onClick={() => {
                                    setExitOpen(false);
                                    navigate(exitTarget);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default EditorBar;
