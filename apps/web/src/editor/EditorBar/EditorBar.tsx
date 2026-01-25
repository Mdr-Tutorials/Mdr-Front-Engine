import "./EditorBar.scss";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdrButton, MdrIcon, MdrIconLink } from "@mdr/ui";
import { useNavigate, useParams } from "react-router";
import { LogIn, LayoutGrid, GitBranch, Box, Sparkles, TestTube, FileCode, Rocket, Settings } from "lucide-react";

function EditorBar() {
    const { t } = useTranslation('editor');
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [isExitOpen, setExitOpen] = useState(false);
    const basePath = projectId ? `/editor/project/${projectId}` : "/editor";
    const exitTarget = projectId ? "/editor" : "/";
    const exitLabel = projectId ? t('bar.exitToEditor') : t('bar.exitToHome');

    return (
        <nav className="EditorBar">
            <section className="EditorBarTop">
                <button
                    className="EditorBarExitButton"
                    aria-label={t('bar.exitAria')}
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
                            <h3>{t('bar.exitTitle')}</h3>
                            <p>{exitLabel}</p>
                        </div>
                        <div className="EditorBarExitActions">
                            <MdrButton text={t('bar.cancel')} category="Ghost" size="Small" onClick={() => setExitOpen(false)} />
                            <MdrButton
                                text={t('bar.exit')}
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
