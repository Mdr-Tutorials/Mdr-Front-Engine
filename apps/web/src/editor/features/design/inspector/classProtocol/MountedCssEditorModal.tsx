import { useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { css } from '@codemirror/lang-css';
import { X } from 'lucide-react';

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
    const extensions = useMemo(() => [css()], []);
    const editorRef = useRef<EditorView | null>(null);

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
            const pattern = new RegExp(
                `\\.${escapedClassName}(?![_a-zA-Z0-9-])`
            );
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
                            Mounted CSS
                        </div>
                        <div className="truncate text-[11px] text-(--color-6)">
                            {path || 'untitled.css'}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
                        onClick={onClose}
                        aria-label="Close mounted CSS editor"
                    >
                        <X size={14} />
                    </button>
                </header>
                <div className="min-h-0 overflow-hidden px-3 py-2">
                    {highlightedClassName ? (
                        <div className="mb-2 text-[11px] text-(--color-6)">
                            Focus class: <code>.{highlightedClassName}</code>
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
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="h-7 rounded-md bg-black px-3 text-xs text-white"
                        onClick={onSave}
                        data-testid="mounted-css-save"
                    >
                        Save CSS
                    </button>
                </footer>
            </div>
        </div>
    );
}
