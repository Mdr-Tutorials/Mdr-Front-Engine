import "./EditorBar.scss";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdrIcon, MdrIconLink } from "@mdr/ui";
import { useNavigate, useParams } from "react-router";
import { useSettingsStore } from "@/editor/store/useSettingsStore";
import { LogIn, LayoutGrid, GitBranch, Box, Sparkles, TestTube, FileCode, Rocket, Settings, Folder, Home } from "lucide-react";
import { EditorBarExitModal } from "./EditorBarExitModal";

function EditorBar() {
    const { t } = useTranslation(['editor', 'routes']);
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [isExitOpen, setExitOpen] = useState(false);
    const confirmPrompts = useSettingsStore((state) => state.global.confirmPrompts);
    const basePath = projectId ? `/editor/project/${projectId}` : "/editor";
    const exitTarget = projectId ? "/editor" : "/";
    const exitLabel = projectId ? t('bar.exitToEditor') : t('bar.exitToHome');
    const settingsLabel = projectId
      ? t('projectHome.actions.settings.label')
      : t('editorSettings', { ns: 'routes' });

    return (
      <>
        <nav className="EditorBar" data-theme="dark">
          <section className="EditorBarTop">
            <button
              className="EditorBarExitButton"
              aria-label={t('bar.exitAria')}
              title={t('bar.exitAria')}
              onClick={() => {
                if (confirmPrompts.includes("leave")) {
                  setExitOpen(true);
                  return;
                }
                navigate(exitTarget);
              }}
            >
              <MdrIcon icon={<LogIn size={26} />} size={26} />
            </button>
          </section>
          <section className="EditorBarCenter">
            {projectId && (
              <>
                <MdrIconLink
                  icon={<Home size={22} />}
                  size={22}
                  title={t('bar.projectHome')}
                  to={`/editor/project/${projectId}`}
                />
                <MdrIconLink
                  icon={<LayoutGrid size={22} />}
                  size={22}
                  title={t('projectHome.actions.blueprint.label')}
                  to={`${basePath}/blueprint`}
                />
                <MdrIconLink
                  icon={<Box size={22} />}
                  size={22}
                  title={t('projectHome.actions.component.label')}
                  to={`${basePath}/component`}
                />
                <MdrIconLink
                  icon={<Folder size={22} />}
                  size={22}
                  title={t('projectHome.actions.resources.label')}
                  to={`${basePath}/resources`}
                />
                <MdrIconLink
                  icon={<GitBranch size={22} />}
                  size={22}
                  title={t('projectHome.actions.nodegraph.label')}
                  to={`${basePath}/nodegraph`}
                />
                <MdrIconLink
                  icon={<Sparkles size={22} />}
                  size={22}
                  title={t('projectHome.actions.animation.label')}
                  to={`${basePath}/animation`}
                />
                <MdrIconLink
                  icon={<TestTube size={22} />}
                  size={22}
                  title={t('projectHome.actions.testing.label')}
                  to={`${basePath}/test`}
                />
                <MdrIconLink
                  icon={<FileCode size={22} />}
                  size={22}
                  title={t('projectHome.actions.export.label')}
                  to={`${basePath}/export`}
                />
                <MdrIconLink
                  icon={<Rocket size={22} />}
                  size={22}
                  title={t('projectHome.actions.deployment.label')}
                  to={`${basePath}/deployment`}
                />
              </>
            )}
          </section>
          <section className="EditorBarBottom">
            <MdrIconLink
              icon={<Settings size={22} />}
              size={22}
              title={settingsLabel}
              to={`${basePath}/settings`}
            />
          </section>
        </nav>
        <EditorBarExitModal
          isOpen={isExitOpen}
          exitLabel={exitLabel}
          cancelLabel={t('bar.cancel')}
          exitText={t('bar.exit')}
          title={t('bar.exitTitle')}
          onClose={() => setExitOpen(false)}
          onConfirm={() => {
            setExitOpen(false);
            navigate(exitTarget);
          }}
        />
      </>
    );
}

export default EditorBar;
