import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { createPortal } from 'react-dom';
import { estimateStickyNoteSize, type GraphNodeData } from '../graphNodeShared';
import type { NodeI18n } from './nodeI18n';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

const parseSize = (
  value: string | number | undefined,
  fallback: number,
  min: number,
  max: number
) => {
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(typeof value === 'string' ? value : '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const clampSize = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const STICKY_NOTE_SIZE = {
  minWidth: 24,
  minHeight: 30,
  maxWidth: 1200,
  maxHeight: 1200,
} as const;

const GROUP_COLOR_THEMES: Record<
  string,
  { border: string; bg: string; headerBg: string; text: string }
> = {
  minimal: {
    border: 'border-slate-300',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-slate-700',
  },
  mono: {
    border: 'border-slate-200',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-slate-900',
  },
  slate: {
    border: 'border-slate-500/55',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-slate-800',
  },
  cyan: {
    border: 'border-cyan-500/55',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-cyan-900',
  },
  amber: {
    border: 'border-amber-500/55',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-amber-900',
  },
  rose: {
    border: 'border-rose-500/55',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-rose-900',
  },
};

const NOTE_COLOR_THEMES: Record<
  string,
  { border: string; bg: string; text: string }
> = {
  minimal: {
    border: '',
    bg: 'bg-transparent',
    text: 'text-slate-800',
  },
  mono: {
    border: 'border-slate-200',
    bg: 'bg-transparent',
    text: 'text-slate-800',
  },
  amber: {
    border: 'border-amber-300',
    bg: 'bg-transparent',
    text: 'text-amber-900',
  },
  lime: {
    border: 'border-lime-300',
    bg: 'bg-transparent',
    text: 'text-lime-900',
  },
  sky: {
    border: 'border-sky-300',
    bg: 'bg-transparent',
    text: 'text-sky-900',
  },
  rose: {
    border: 'border-rose-300',
    bg: 'bg-transparent',
    text: 'text-rose-900',
  },
};

const INLINE_MARKDOWN_PATTERN =
  /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\[[^\]]+\]\(([^)\s]+)\)|\*[^*]+\*|_[^_]+_)/g;

const sanitizeHref = (href: string) => {
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(href)) return href;
  return '#';
};

const renderInlineMarkdown = (text: string, keyPrefix: string): ReactNode[] => {
  const chunks: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  for (const token of text.matchAll(INLINE_MARKDOWN_PATTERN)) {
    const match = token[0];
    const start = token.index ?? 0;
    if (start > cursor) {
      chunks.push(
        <span key={`${keyPrefix}-text-${index}`}>
          {text.slice(cursor, start)}
        </span>
      );
      index += 1;
    }
    if (match.startsWith('`')) {
      chunks.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-black/10 px-1 py-0.5 text-[10px]"
        >
          {match.slice(1, -1)}
        </code>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (
      (match.startsWith('**') && match.endsWith('**')) ||
      (match.startsWith('__') && match.endsWith('__'))
    ) {
      chunks.push(
        <strong key={`${keyPrefix}-strong-${index}`}>
          {match.slice(2, -2)}
        </strong>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (match.startsWith('~~') && match.endsWith('~~')) {
      chunks.push(
        <del key={`${keyPrefix}-del-${index}`}>{match.slice(2, -2)}</del>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (match.startsWith('[') && match.includes('](') && match.endsWith(')')) {
      const linkMatch = match.match(/^\[(.*)\]\((.*)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = sanitizeHref(linkMatch[2]);
        chunks.push(
          <a
            key={`${keyPrefix}-link-${index}`}
            className="text-sky-700 underline decoration-sky-500/55 underline-offset-2"
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            {label}
          </a>
        );
      } else {
        chunks.push(<span key={`${keyPrefix}-text-${index}`}>{match}</span>);
      }
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (
      (match.startsWith('*') && match.endsWith('*')) ||
      (match.startsWith('_') && match.endsWith('_'))
    ) {
      chunks.push(
        <em key={`${keyPrefix}-em-${index}`}>{match.slice(1, -1)}</em>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    chunks.push(<span key={`${keyPrefix}-text-${index}`}>{match}</span>);
    index += 1;
    cursor = start + match.length;
  }
  if (cursor < text.length) {
    chunks.push(
      <span key={`${keyPrefix}-tail-${index}`}>
        {text.slice(cursor, text.length)}
      </span>
    );
  }
  return chunks;
};

const renderMarkdownBlocks = (
  markdown: string,
  keyPrefix: string
): ReactNode[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let keyIndex = 0;
  let listKind: 'ul' | 'ol' | null = null;
  let listItems: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushList = () => {
    if (!listKind || !listItems.length) return;
    if (listKind === 'ul') {
      blocks.push(
        <ul
          key={`${keyPrefix}-ul-${keyIndex}`}
          className="list-disc space-y-1 pl-4"
        >
          {listItems}
        </ul>
      );
    } else {
      blocks.push(
        <ol
          key={`${keyPrefix}-ol-${keyIndex}`}
          className="list-decimal space-y-1 pl-4"
        >
          {listItems}
        </ol>
      );
    }
    keyIndex += 1;
    listKind = null;
    listItems = [];
  };

  const flushCodeBlock = () => {
    if (!codeLines.length) return;
    flushList();
    blocks.push(
      <pre
        key={`${keyPrefix}-code-block-${keyIndex}`}
        className="overflow-x-auto rounded-md bg-black/80 px-2 py-2 text-[10px] leading-5 text-slate-100"
      >
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
    keyIndex += 1;
    codeLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    if (!trimmed) {
      flushList();
      blocks.push(
        <div key={`${keyPrefix}-space-${keyIndex}`} className="h-2" />
      );
      keyIndex += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const headingSizeMap = ['text-[16px]', 'text-[14px]', 'text-[13px]'];
      const headingClass =
        headingSizeMap[
          Math.min(headingMatch[1].length - 1, headingSizeMap.length - 1)
        ];
      blocks.push(
        <p
          key={`${keyPrefix}-heading-${keyIndex}`}
          className={`font-semibold leading-6 ${headingClass}`}
        >
          {renderInlineMarkdown(
            headingMatch[2],
            `${keyPrefix}-heading-${keyIndex}`
          )}
        </p>
      );
      keyIndex += 1;
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      if (listKind !== 'ul') {
        flushList();
        listKind = 'ul';
      }
      listItems.push(
        <li key={`${keyPrefix}-li-${keyIndex}`}>
          {renderInlineMarkdown(
            unorderedMatch[1],
            `${keyPrefix}-li-${keyIndex}`
          )}
        </li>
      );
      keyIndex += 1;
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (listKind !== 'ol') {
        flushList();
        listKind = 'ol';
      }
      listItems.push(
        <li key={`${keyPrefix}-li-${keyIndex}`}>
          {renderInlineMarkdown(orderedMatch[1], `${keyPrefix}-li-${keyIndex}`)}
        </li>
      );
      keyIndex += 1;
      continue;
    }

    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushList();
      blocks.push(
        <blockquote
          key={`${keyPrefix}-quote-${keyIndex}`}
          className="border-l-2 border-slate-400/60 pl-2 italic"
        >
          {renderInlineMarkdown(
            blockquoteMatch[1],
            `${keyPrefix}-quote-${keyIndex}`
          )}
        </blockquote>
      );
      keyIndex += 1;
      continue;
    }

    flushList();
    blocks.push(
      <p key={`${keyPrefix}-p-${keyIndex}`} className="leading-6">
        {renderInlineMarkdown(trimmed, `${keyPrefix}-p-${keyIndex}`)}
      </p>
    );
    keyIndex += 1;
  }

  if (inCodeBlock) {
    flushCodeBlock();
  }
  flushList();
  return blocks;
};

const StickyNoteEditor = ({ id, nodeData, selected, t }: Props) => {
  const themeKey = nodeData.color || 'minimal';
  const theme = NOTE_COLOR_THEMES[themeKey] || NOTE_COLOR_THEMES.minimal;
  const isMinimalTheme = themeKey === 'minimal';
  const content = nodeData.description ?? nodeData.value ?? '';
  const fallbackSize = useMemo(() => {
    const estimatedSize = estimateStickyNoteSize(content);
    return {
      width: parseSize(
        nodeData.autoNoteWidth,
        estimatedSize.width,
        STICKY_NOTE_SIZE.minWidth,
        STICKY_NOTE_SIZE.maxWidth
      ),
      height: parseSize(
        nodeData.autoNoteHeight,
        estimatedSize.height,
        STICKY_NOTE_SIZE.minHeight,
        STICKY_NOTE_SIZE.maxHeight
      ),
    };
  }, [content, nodeData.autoNoteHeight, nodeData.autoNoteWidth]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftContent, setDraftContent] = useState(content);
  const [displaySize, setDisplaySize] = useState(fallbackSize);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isModalOpen) return;
    setDraftContent(content);
  }, [content, isModalOpen]);

  useEffect(() => {
    setDisplaySize(fallbackSize);
  }, [fallbackSize.height, fallbackSize.width]);

  const renderNoteBody = useCallback(
    (keyPrefix: string) =>
      content.trim() ? (
        <div className={isMinimalTheme ? 'space-y-0.5' : 'space-y-1'}>
          {renderMarkdownBlocks(content, keyPrefix)}
        </div>
      ) : (
        <span className="text-[11px] text-slate-500/85">
          {tNode(t, 'annotation.stickyNote.emptyText', 'Click to edit note')}
        </span>
      ),
    [content, isMinimalTheme, t]
  );

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => {
      const measured = measureRef.current?.getBoundingClientRect();
      if (!measured) return;
      const nextWidth = clampSize(
        Math.ceil(measured.width),
        STICKY_NOTE_SIZE.minWidth,
        STICKY_NOTE_SIZE.maxWidth
      );
      const nextHeight = clampSize(
        Math.ceil(measured.height),
        STICKY_NOTE_SIZE.minHeight,
        STICKY_NOTE_SIZE.maxHeight
      );
      setDisplaySize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [content, isMinimalTheme, selected]);

  const openEditor = useCallback(() => {
    setDraftContent(content);
    setIsModalOpen(true);
  }, [content]);

  const closeEditor = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const saveEditor = useCallback(() => {
    const normalized = draftContent.replace(/\r\n/g, '\n');
    if (normalized !== content) {
      nodeData.onChangeField?.(id, 'description', normalized);
    }
    setIsModalOpen(false);
  }, [content, draftContent, id, nodeData]);

  useEffect(() => {
    if (!isModalOpen || typeof window === 'undefined') return;
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditor();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        saveEditor();
      }
    };
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [closeEditor, isModalOpen, saveEditor]);

  const noteContainerClass = isMinimalTheme
    ? `relative overflow-visible ${theme.text}`
    : `relative overflow-hidden rounded-xl border ${theme.border} ${theme.bg} ${
        selected ? 'ring-1 ring-slate-500/45' : ''
      }`;
  const noteMeasureClass = isMinimalTheme
    ? `inline-block overflow-visible ${theme.text}`
    : `inline-block overflow-hidden rounded-xl border ${theme.border} ${theme.bg} ${theme.text}`;
  const noteBodyClass = isMinimalTheme
    ? 'overflow-visible px-2 py-1 text-[12px] leading-5'
    : 'overflow-hidden px-3 py-3 text-[12px] leading-6';

  return (
    <>
      <div
        className={noteContainerClass}
        style={{ width: displaySize.width, height: displaySize.height }}
      >
        <button
          type="button"
          className={`nopan h-full w-full cursor-text border-none bg-transparent text-left ${theme.text} ${noteBodyClass}`}
          onClick={openEditor}
        >
          {renderNoteBody(`note-${id}`)}
        </button>
      </div>
      <div
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] opacity-0"
        aria-hidden
      >
        <div
          ref={measureRef}
          className={noteMeasureClass}
          style={{ maxWidth: `${STICKY_NOTE_SIZE.maxWidth}px` }}
        >
          <div className={noteBodyClass}>
            {renderNoteBody(`note-measure-${id}`)}
          </div>
        </div>
      </div>
      {isModalOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4"
              role="dialog"
              aria-modal="true"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeEditor();
                }
              }}
            >
              <div
                className="w-[min(980px,100%)] rounded-xl border border-slate-300 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.35)]"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    {tNode(
                      t,
                      'annotation.stickyNote.modalTitle',
                      'Edit markdown note'
                    )}
                  </div>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    onClick={closeEditor}
                  >
                    {tNode(t, 'annotation.stickyNote.close', 'Close')}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-2">
                  <section className="min-w-0">
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                      {tNode(
                        t,
                        'annotation.stickyNote.editorLabel',
                        'Markdown'
                      )}
                    </div>
                    <CodeMirror
                      value={draftContent}
                      onChange={setDraftContent}
                      basicSetup={{
                        lineNumbers: true,
                        foldGutter: false,
                        highlightActiveLine: false,
                      }}
                      height="320px"
                      className="nodrag nopan native-code-node__editor"
                    />
                    <div className="mt-1 text-[10px] text-slate-500">
                      {tNode(
                        t,
                        'annotation.stickyNote.shortcutHint',
                        'Tip: Ctrl/Cmd + Enter to save'
                      )}
                    </div>
                  </section>
                  <section className="min-w-0">
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                      {tNode(
                        t,
                        'annotation.stickyNote.previewLabel',
                        'Preview'
                      )}
                    </div>
                    <div className="h-[320px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] leading-6 text-slate-800">
                      {draftContent.trim() ? (
                        <div className="space-y-1">
                          {renderMarkdownBlocks(
                            draftContent,
                            `note-modal-${id}`
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500/85">
                          {tNode(
                            t,
                            'annotation.stickyNote.placeholder',
                            'Write markdown note...'
                          )}
                        </span>
                      )}
                    </div>
                  </section>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    onClick={closeEditor}
                  >
                    {tNode(t, 'annotation.stickyNote.cancel', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                    onClick={saveEditor}
                  >
                    {tNode(t, 'annotation.stickyNote.save', 'Save')}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export const renderAnnotationGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  if (nodeData.kind === 'groupBox') {
    const themeKey = nodeData.color || 'minimal';
    const width = parseSize(
      nodeData.autoBoxWidth ?? nodeData.boxWidth,
      360,
      220,
      1800
    );
    const height = parseSize(
      nodeData.autoBoxHeight ?? nodeData.boxHeight,
      220,
      140,
      1400
    );
    const theme = GROUP_COLOR_THEMES[themeKey] || GROUP_COLOR_THEMES.minimal;
    const isMinimalTheme = themeKey === 'minimal';
    return (
      <div
        className={
          isMinimalTheme
            ? `relative overflow-hidden rounded-xl border ${theme.border} ${theme.bg} ${
                selected ? 'ring-1 ring-slate-500/45' : ''
              }`
            : `relative overflow-hidden rounded-xl border-2 border-dashed ${theme.border} ${theme.bg} ${
                selected ? 'ring-1 ring-slate-500/45' : ''
              }`
        }
        style={{ width, height }}
      >
        <div
          className={`nodrag nopan flex items-center gap-1 px-2 py-1 ${theme.headerBg} ${
            isMinimalTheme
              ? 'border-b border-slate-300/90'
              : 'border-b border-dashed'
          }`}
        >
          <input
            className={`h-6 min-w-0 flex-1 px-2 text-[11px] font-medium outline-none ${
              isMinimalTheme
                ? 'rounded-none border-none bg-transparent text-slate-800'
                : 'rounded border border-black/10 bg-white/70 text-slate-800 focus:border-black/25'
            }`}
            value={nodeData.value ?? ''}
            onChange={(event) =>
              nodeData.onChangeField?.(id, 'value', event.target.value)
            }
            placeholder={tNode(
              t,
              'annotation.groupBox.titlePlaceholder',
              'Group title'
            )}
            spellCheck={false}
          />
        </div>
        {isMinimalTheme ? null : (
          <div
            className={`pointer-events-none px-3 py-2 text-xl font-semibold ${theme.text}`}
          >
            {nodeData.value?.trim() || ''}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'stickyNote')
    return (
      <StickyNoteEditor id={id} nodeData={nodeData} selected={selected} t={t} />
    );

  return null;
};
