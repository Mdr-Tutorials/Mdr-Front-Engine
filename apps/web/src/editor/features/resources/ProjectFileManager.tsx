import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { Check, FileText, Save } from 'lucide-react';
import { useEditorShortcut } from '@/editor/shortcuts';
import {
  PROJECT_FILE_TEMPLATES,
  applyProjectFileTemplate,
  flattenEnabledProjectFiles,
  readProjectFiles,
  updateProjectFile,
  writeProjectFiles,
  type ProjectFile,
  type ProjectFileTemplateId,
} from './projectFileStore';

type ProjectFileManagerProps = {
  embedded?: boolean;
};

const getProjectFileSelectionStorageKey = (projectId?: string) =>
  `mdr.resourceManager.projectFiles.selection.${projectId?.trim() || 'default'}`;

const resolveLanguageExtensionByPath = (path: string) => {
  const lower = path.toLowerCase();
  if (lower.endsWith('.json')) return javascript({ typescript: true });
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return css();
  return javascript({ typescript: true, jsx: true });
};

const formatUpdatedAt = (value: string) => value.replace('T', ' ').slice(0, 16);

export function ProjectFileManager({
  embedded = false,
}: ProjectFileManagerProps) {
  const { t } = useTranslation('editor');
  const { projectId } = useParams();
  const [files, setFiles] = useState<ProjectFile[]>(() =>
    readProjectFiles(projectId)
  );
  const [selectedPath, setSelectedPath] = useState(() => {
    const initialFiles = readProjectFiles(projectId);
    const storedSelection =
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(
            getProjectFileSelectionStorageKey(projectId)
          );
    if (
      storedSelection &&
      initialFiles.some((file) => file.path === storedSelection)
    ) {
      return storedSelection;
    }
    return initialFiles[0]?.path ?? '.gitignore';
  });
  const [editorValue, setEditorValue] = useState('');

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedPath) ?? files[0],
    [files, selectedPath]
  );
  const enabledFiles = useMemo(
    () => flattenEnabledProjectFiles(files),
    [files]
  );
  const templateOptions = PROJECT_FILE_TEMPLATES.filter(
    (template) => template.targetPath === selectedFile?.path
  );
  const isDirty = Boolean(selectedFile && editorValue !== selectedFile.content);

  const persistFiles = (nextFiles: ProjectFile[]) => {
    setFiles(nextFiles);
    writeProjectFiles(projectId, nextFiles);
  };

  useEffect(() => {
    if (!selectedFile) return;
    setEditorValue(selectedFile.content);
  }, [selectedFile?.path]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!files.some((file) => file.path === selectedPath)) {
      setSelectedPath(files[0]?.path ?? '.gitignore');
      return;
    }
    window.localStorage.setItem(
      getProjectFileSelectionStorageKey(projectId),
      selectedPath
    );
  }, [files, projectId, selectedPath]);

  const handleSave = () => {
    if (!selectedFile) return;
    persistFiles(
      updateProjectFile(files, selectedFile.path, {
        content: editorValue,
      })
    );
  };

  useEditorShortcut(
    'Mod+S',
    () => {
      handleSave();
    },
    {
      allowInEditable: true,
    }
  );

  const shellClassName = embedded
    ? 'grid gap-4'
    : 'mx-auto grid w-full max-w-7xl gap-4 px-6 py-6';

  return (
    <section className={shellClassName}>
      <article className="rounded-2xl border border-black/8 bg-(--color-0) p-5">
        <h2 className="text-base font-semibold text-(--color-9)">
          {t('resourceManager.projectFiles.header.title')}
        </h2>
        <p className="mt-1 text-sm text-(--color-7)">
          {t('resourceManager.projectFiles.header.description')}
        </p>
      </article>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="grid content-start gap-3 rounded-xl border border-black/10 bg-(--color-0) p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-(--color-6) uppercase">
              {t('resourceManager.projectFiles.labels.rootFiles')}
            </p>
            <span className="rounded-full bg-black/[0.04] px-2 py-1 text-[11px] text-(--color-7)">
              {enabledFiles.length}/{files.length}
            </span>
          </div>
          <div className="grid gap-1">
            {files.map((file) => {
              const isActive = file.path === selectedFile?.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition-colors ${
                    isActive
                      ? 'border-black/16 bg-black/[0.04]'
                      : 'border-transparent hover:border-black/10 hover:bg-black/[0.02]'
                  }`}
                  onClick={() => setSelectedPath(file.path)}
                >
                  <FileText size={14} className="shrink-0 text-(--color-7)" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-(--color-9)">
                      {file.path}
                    </span>
                    <span className="block truncate text-(--color-6)">
                      {file.enabled
                        ? t('resourceManager.projectFiles.labels.enabled')
                        : t('resourceManager.projectFiles.labels.disabled')}
                    </span>
                  </span>
                  {file.enabled ? (
                    <Check size={13} className="shrink-0 text-(--color-8)" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <article className="grid gap-3 rounded-xl border border-black/10 bg-(--color-0) p-4">
          {selectedFile ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.08em] text-(--color-6) uppercase">
                    {t('resourceManager.projectFiles.labels.selected')}
                  </p>
                  <h3 className="text-sm font-semibold text-(--color-9)">
                    {selectedFile.path}
                  </h3>
                  <p className="text-xs text-(--color-7)">
                    {selectedFile.mime} |{' '}
                    {t('resourceManager.projectFiles.labels.updated')}:{' '}
                    {formatUpdatedAt(selectedFile.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      selectedFile.enabled
                        ? 'border-black/14 bg-black text-white'
                        : 'border-black/12 bg-transparent text-(--color-8) hover:border-black/20'
                    }`}
                    onClick={() =>
                      persistFiles(
                        updateProjectFile(files, selectedFile.path, {
                          enabled: !selectedFile.enabled,
                        })
                      )
                    }
                  >
                    {selectedFile.enabled
                      ? t('resourceManager.projectFiles.actions.included')
                      : t('resourceManager.projectFiles.actions.include')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-black/12 bg-black px-2.5 py-1.5 text-xs text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleSave}
                    disabled={!isDirty}
                  >
                    <Save size={12} />
                    {t('resourceManager.projectFiles.actions.save')}
                  </button>
                </div>
              </div>

              {templateOptions.length ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/8 bg-black/[0.015] p-2">
                  <span className="px-1 text-[11px] font-semibold tracking-[0.08em] text-(--color-6) uppercase">
                    {t('resourceManager.projectFiles.labels.templates')}
                  </span>
                  {templateOptions.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs text-(--color-8) hover:border-black/20 hover:text-(--color-10)"
                      onClick={() =>
                        persistFiles(
                          applyProjectFileTemplate(
                            files,
                            template.id as ProjectFileTemplateId
                          )
                        )
                      }
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <CodeMirror
                value={editorValue}
                onChange={(value) => setEditorValue(value)}
                extensions={[resolveLanguageExtensionByPath(selectedFile.path)]}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                }}
                className="rounded-lg border border-black/10 bg-black/[0.02] text-[12px] [&_.cm-editor]:min-h-[460px]"
              />
            </>
          ) : (
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm text-(--color-7)">
              {t('resourceManager.projectFiles.empty')}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
