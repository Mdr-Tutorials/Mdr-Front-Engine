import { useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {
  Compartment,
  EditorSelection,
  RangeSetBuilder,
  type Extension,
} from '@codemirror/state';
import {
  EditorView,
  GutterMarker,
  gutter,
  type ViewUpdate,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { css } from '@codemirror/lang-css';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type MountedCssEditorModalProps = {
  isOpen: boolean;
  path: string;
  value: string;
  highlightedClassName?: string;
  highlightedLine?: number;
  highlightedColumn?: number;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

const DEFAULT_CSS_CONTENT = `/* Mounted CSS */\n`;
const DEFAULT_INVALID_CSS_MESSAGE = 'Invalid CSS syntax';
const COLOR_TOKEN_MATCHER =
  /(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:transparent|black|white|red|green|blue|yellow|orange|purple|pink|gray|grey|brown|cyan|magenta)\b)/;

const isRenderableColor = (value: string) => {
  const color = value.trim();
  if (!color) return false;
  if (
    /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color) ||
    /^rgba?\([^)]*\)$/.test(color) ||
    /^hsla?\([^)]*\)$/.test(color)
  ) {
    return true;
  }
  return /^(transparent|black|white|red|green|blue|yellow|orange|purple|pink|gray|grey|brown|cyan|magenta)$/.test(
    color.toLowerCase()
  );
};

class ColorSwatchMarker extends GutterMarker {
  constructor(private readonly color: string) {
    super();
  }

  toDOM() {
    const element = document.createElement('span');
    element.className = 'MountedCssColorGutterSwatch';
    element.style.backgroundColor = this.color;
    element.title = this.color;
    return element;
  }
}

const createSyntaxLinterExtension = (message: string): Extension =>
  linter((view): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];
    syntaxTree(view.state).iterate({
      enter(node) {
        if (!node.type.isError) return;
        diagnostics.push({
          from: node.from,
          to: Math.max(node.to, node.from + 1),
          severity: 'error',
          message,
        });
      },
    });
    return diagnostics;
  });

export function MountedCssEditorModal({
  isOpen,
  path,
  value,
  highlightedClassName,
  highlightedLine,
  highlightedColumn,
  onChange,
  onClose,
  onSave,
}: MountedCssEditorModalProps) {
  const { t } = useTranslation('blueprint');
  const invalidSyntaxMessage = t(
    'inspector.classProtocol.mountedCss.invalidSyntax',
    {
      defaultValue: DEFAULT_INVALID_CSS_MESSAGE,
    }
  );
  const lintCompartmentRef = useRef(new Compartment());
  const extensions = useMemo(() => {
    const lintCompartment = lintCompartmentRef.current;
    const colorGutter = gutter({
      class: 'MountedCssColorGutter',
      markers(view) {
        const builder = new RangeSetBuilder<GutterMarker>();
        for (let lineNo = 1; lineNo <= view.state.doc.lines; lineNo += 1) {
          const line = view.state.doc.line(lineNo);
          const matched = COLOR_TOKEN_MATCHER.exec(line.text);
          if (!matched) continue;
          const token = matched[1];
          if (!isRenderableColor(token)) continue;
          builder.add(line.from, line.from, new ColorSwatchMarker(token));
        }
        return builder.finish();
      },
      lineMarkerChange(update: ViewUpdate) {
        return update.docChanged || update.viewportChanged;
      },
    });
    const lintTheme = EditorView.theme({
      '.cm-lintRange-error': {
        textDecoration: 'underline wavy rgba(220,74,74,0.95)',
        textDecorationThickness: '1px',
      },
      '.cm-diagnostic-error': {
        borderLeftColor: 'rgba(220,74,74,0.95)',
      },
      '.cm-gutters .MountedCssColorGutter': {
        width: '14px',
      },
      '.MountedCssColorGutterSwatch': {
        display: 'inline-flex',
        width: '8px',
        height: '8px',
        marginLeft: '3px',
        borderRadius: '999px',
        border: '1px solid rgba(0,0,0,0.18)',
        boxSizing: 'border-box',
      },
    });
    return [
      css(),
      colorGutter,
      lintCompartment.of(
        createSyntaxLinterExtension(DEFAULT_INVALID_CSS_MESSAGE)
      ),
      lintGutter(),
      lintTheme,
    ];
  }, []);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.dispatch({
      effects: lintCompartmentRef.current.reconfigure(
        createSyntaxLinterExtension(invalidSyntaxMessage)
      ),
    });
  }, [invalidSyntaxMessage]);

  useEffect(() => {
    if (!isOpen) return;
    const editor = editorRef.current;
    if (!editor) return;
    const docLength = editor.state.doc.length;
    let anchor = 0;
    if (highlightedLine && highlightedLine > 0) {
      const targetLine =
        highlightedLine > editor.state.doc.lines
          ? editor.state.doc.lines
          : highlightedLine;
      const line = editor.state.doc.line(targetLine);
      const column = Math.max((highlightedColumn ?? 1) - 1, 0);
      anchor = Math.min(line.from + column, line.to);
    } else if (highlightedClassName) {
      const escapedClassName = highlightedClassName.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      const pattern = new RegExp(`\\.${escapedClassName}(?![_a-zA-Z0-9-])`);
      const matched = pattern.exec(editor.state.doc.toString());
      if (matched?.index !== undefined) {
        anchor = matched.index + 1;
      }
    }
    anchor = Math.min(Math.max(anchor, 0), docLength);
    editor.dispatch({
      selection: EditorSelection.cursor(anchor),
      effects: EditorView.scrollIntoView(anchor, { y: 'center' }),
    });
    editor.focus();
  }, [isOpen, highlightedClassName, highlightedLine, highlightedColumn]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      data-testid="mounted-css-modal"
    >
      <div className="grid h-[min(80vh,720px)] w-[min(880px,96vw)] grid-rows-[auto_1fr_auto] rounded-xl border border-black/10 bg-(--color-0) shadow-[0_26px_48px_rgba(0,0,0,0.3)] dark:border-white/12">
        <header className="flex items-center justify-between border-b border-black/8 px-3 py-2 dark:border-white/12">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-(--color-9)">
              {t('inspector.classProtocol.mountedCss.title', {
                defaultValue: 'Mounted CSS',
              })}
            </div>
            <div className="truncate text-[11px] text-(--color-6)">
              {path ||
                t('inspector.classProtocol.mountedCss.untitled', {
                  defaultValue: 'untitled.css',
                })}
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
            onClick={onClose}
            aria-label={t('inspector.classProtocol.mountedCss.close', {
              defaultValue: 'Close mounted CSS editor',
            })}
          >
            <X size={14} />
          </button>
        </header>
        <div className="min-h-0 overflow-hidden px-3 py-2">
          {highlightedClassName ? (
            <div className="mb-2 text-[11px] text-(--color-6)">
              {t('inspector.classProtocol.mountedCss.focusClass', {
                defaultValue: 'Focus class',
              })}
              : <code>.{highlightedClassName}</code>
            </div>
          ) : null}
          <div className="h-[calc(100%-2px)] overflow-hidden rounded-md border border-black/10 dark:border-white/14">
            <CodeMirror
              value={value || DEFAULT_CSS_CONTENT}
              height="100%"
              extensions={extensions}
              theme="light"
              onChange={(next) => onChange(next)}
              onCreateEditor={(view) => {
                editorRef.current = view;
                view.dispatch({
                  effects: lintCompartmentRef.current.reconfigure(
                    createSyntaxLinterExtension(invalidSyntaxMessage)
                  ),
                });
              }}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
              }}
            />
          </div>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-black/8 px-3 py-2 dark:border-white/12">
          <button
            type="button"
            className="h-7 rounded-md border border-black/12 px-3 text-xs text-(--color-7) hover:text-(--color-9)"
            onClick={onClose}
          >
            {t('inspector.classProtocol.mountedCss.cancel', {
              defaultValue: 'Cancel',
            })}
          </button>
          <button
            type="button"
            className="h-7 rounded-md bg-black px-3 text-xs text-white"
            onClick={onSave}
            data-testid="mounted-css-save"
          >
            {t('inspector.classProtocol.mountedCss.save', {
              defaultValue: 'Save CSS',
            })}
          </button>
        </footer>
      </div>
    </div>
  );
}
