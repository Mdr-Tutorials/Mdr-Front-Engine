import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  LayoutGrid,
  PenLine,
  Sparkles,
  Tags,
  Type,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { classProtocolEngine } from './engineRegistry';
import { resolveClassTokenColorSwatch } from './colorSwatch';
import type { MountedCssEntry } from './mountedCss';
import { resolveMountedCssTokenTarget } from './mountedCss';
import type { ClassSuggestion } from './types';
import { parseClassTokens, toClassNameValue } from './tokenizer';
import { useSettingsStore } from '@/editor/store/useSettingsStore';

type ClassProtocolEditorProps = {
  projectId?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputTestId?: string;
  mountedCssEntries?: MountedCssEntry[];
  onOpenMountedCss?: (target: {
    path: string;
    className: string;
    line?: number;
    column?: number;
  }) => void;
};

type EditMode = 'token' | 'inline';

const getSuggestionIcon = (token: string) => {
  if (token.startsWith('text-') || token.startsWith('font-')) return Type;
  if (
    token.startsWith('grid') ||
    token.startsWith('flex') ||
    token.startsWith('items-') ||
    token.startsWith('justify-')
  ) {
    return LayoutGrid;
  }
  return Sparkles;
};

export function ClassProtocolEditor({
  projectId,
  value,
  onChange,
  placeholder,
  inputTestId,
  mountedCssEntries = [],
  onOpenMountedCss,
}: ClassProtocolEditorProps) {
  const { i18n, t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [mode, setMode] = useState<EditMode>('token');

  const tokens = useMemo(() => parseClassTokens(value), [value]);
  const resolveOverrideTarget = (index: number) => {
    const source = tokens[index];
    if (!source) return undefined;
    for (let pointer = index + 1; pointer < tokens.length; pointer += 1) {
      const candidate = tokens[pointer];
      if (!candidate) continue;
      const mergedPair = classProtocolEngine.resolveConflict([
        source,
        candidate,
      ]);
      if (mergedPair.includes(candidate) && !mergedPair.includes(source)) {
        return candidate;
      }
    }
    return undefined;
  };
  const retainedTokenIndexes = useMemo(() => {
    const resolved = classProtocolEngine.resolveConflict(tokens);
    const retained = new Set<number>();
    let resolvedIndex = resolved.length - 1;
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      if (resolvedIndex < 0) break;
      if (tokens[index] !== resolved[resolvedIndex]) continue;
      retained.add(index);
      resolvedIndex -= 1;
    }
    return retained;
  }, [tokens]);
  const classPxTransformMode = useSettingsStore((state) =>
    state.getEffectiveGlobalValue(projectId, 'classPxTransformMode')
  );
  const preferScaleToken = classPxTransformMode === 'prefer-scale-token';
  const engineSuggestions = useMemo(
    () =>
      classProtocolEngine.suggest({
        query: draft,
        tokens,
        limit: 12,
      }),
    [draft, tokens]
  );
  const suggestions = useMemo(() => {
    if (!preferScaleToken) return engineSuggestions;

    const inferredIndex = engineSuggestions.findIndex((item) =>
      item.detail?.startsWith('Inferred from ')
    );
    if (inferredIndex <= 0) return engineSuggestions;

    const inferred = engineSuggestions[inferredIndex];
    if (!inferred) return engineSuggestions;
    const next = [...engineSuggestions];
    next.splice(inferredIndex, 1);
    next.unshift(inferred);
    return next;
  }, [engineSuggestions, preferScaleToken]);

  const getSuggestionLabel = (suggestion: ClassSuggestion) => {
    if (suggestion.kind === 'hint' && suggestion.hint) {
      if (suggestion.hint.type === 'arbitrary-length-template') {
        const templateText = i18n.resolvedLanguage?.startsWith('zh')
          ? '带单位长度'
          : 'length with unit';
        return `${suggestion.hint.prefix}-[${templateText}]`;
      }
      if (suggestion.hint.type === 'color-shade-template') {
        const templateText = i18n.resolvedLanguage?.startsWith('zh')
          ? '颜色深度'
          : 'color shade';
        return `${suggestion.hint.prefix}-[${templateText}]`;
      }
    }
    return suggestion.label ?? suggestion.token;
  };

  const getSuggestionDetail = (suggestion: ClassSuggestion) => {
    if (suggestion.kind === 'hint' && suggestion.hint) {
      if (suggestion.hint.type === 'arbitrary-length-template') {
        const defaultValue = i18n.resolvedLanguage?.startsWith('zh')
          ? '例如 {{exampleA}}, {{exampleB}}'
          : 'Example: {{exampleA}}, {{exampleB}}';
        return t(
          'blueprint.inspector.fields.className.hints.arbitraryLengthTemplate',
          {
            defaultValue,
            exampleA: `${suggestion.hint.prefix}-[12px]`,
            exampleB: `${suggestion.hint.prefix}-[1rem]`,
          }
        );
      }
      if (suggestion.hint.type === 'color-shade-template') {
        const defaultValue = i18n.resolvedLanguage?.startsWith('zh')
          ? '例如 {{example}}'
          : 'Example: {{example}}';
        return t('blueprint.inspector.fields.className.hints.colorShade', {
          defaultValue,
          example: suggestion.hint.example,
        });
      }
    }
    return suggestion.detail;
  };

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [draft, suggestions.length]);

  const emitTokens = (nextTokens: string[]) => {
    onChange(toClassNameValue(nextTokens));
  };

  const commitToken = (rawToken: string) => {
    const token = rawToken.trim();
    if (!token) return;
    emitTokens([...tokens, token]);
    setDraft('');
  };

  const commitMany = (rawInput: string) => {
    const nextTokens = parseClassTokens(rawInput);
    if (!nextTokens.length) return;
    emitTokens([...tokens, ...nextTokens]);
    setDraft('');
  };

  const removeTokenAt = (index: number) => {
    emitTokens(tokens.filter((_, current) => current !== index));
  };

  const ModeIcon = mode === 'token' ? Tags : PenLine;
  const nextMode: EditMode = mode === 'token' ? 'inline' : 'token';

  const tokenEditor = (
    <div className="InspectorClassProtocol relative grid gap-1.5">
      <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-black/10 px-1.5 py-1 pr-7 dark:border-white/16">
        {tokens.map((token, index) => {
          const tokenSwatch = resolveClassTokenColorSwatch(token);
          const mountedCssTarget = resolveMountedCssTokenTarget(
            mountedCssEntries,
            token
          );
          const isOverridden = !retainedTokenIndexes.has(index);
          const overriddenBy = isOverridden
            ? resolveOverrideTarget(index)
            : undefined;
          return (
            <span
              key={`${token}-${index}`}
              className={`inline-flex min-h-6 items-center gap-1 rounded-md border border-black/10 bg-black/[0.03] py-[2px] pl-1.5 pr-1 text-[11px] leading-[1.25] text-(--color-8) dark:border-white/16 dark:bg-white/6 ${
                isOverridden ? 'opacity-60' : ''
              }`}
              data-testid={
                isOverridden
                  ? `inspector-classname-token-overridden-${index}`
                  : undefined
              }
              title={
                isOverridden
                  ? overriddenBy
                    ? `Overridden by "${overriddenBy}"`
                    : 'Overridden by another class'
                  : undefined
              }
            >
              {tokenSwatch ? (
                <span
                  className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${
                    tokenSwatch.kind === 'background'
                      ? 'ring-[1px] ring-black/35'
                      : ''
                  } ${
                    tokenSwatch.kind === 'border'
                      ? 'bg-transparent ring-[1px] ring-current'
                      : ''
                  } ${tokenSwatch.kind === 'vector' ? 'rounded-[2px]' : ''}`}
                  style={{
                    backgroundColor:
                      tokenSwatch.kind === 'border'
                        ? 'transparent'
                        : tokenSwatch.color,
                    color: tokenSwatch.color,
                  }}
                  data-testid={`inspector-classname-color-dot-${index}`}
                  data-color-kind={tokenSwatch.kind}
                  aria-hidden="true"
                />
              ) : null}
              <span className="inline-flex max-w-32 flex-col leading-[1.25]">
                <span className="relative truncate">
                  {token}
                  {isOverridden ? (
                    <span
                      className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-current/50"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
              </span>
              {mountedCssTarget ? (
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-sm border-0 bg-transparent p-0 text-(--color-6) hover:text-(--color-9)"
                  onClick={() =>
                    onOpenMountedCss?.({
                      path: mountedCssTarget.path,
                      className: token,
                      line: mountedCssTarget.line,
                      column: mountedCssTarget.column,
                    })
                  }
                  data-testid={`inspector-classname-open-mounted-css-${index}`}
                  aria-label={`Open mounted CSS for ${token}`}
                  title={`Open mounted CSS (${mountedCssTarget.path})`}
                >
                  <ExternalLink size={11} />
                </button>
              ) : null}
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm border-0 bg-transparent p-0 text-(--color-6) hover:text-(--color-9)"
                onClick={() => removeTokenAt(index)}
                data-testid={`inspector-classname-token-remove-${index}`}
                aria-label={`Remove ${token}`}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        <input
          className="h-6 min-w-24 flex-1 border-0 bg-transparent px-1 text-xs text-(--color-9) outline-none placeholder:text-(--color-5)"
          value={draft}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (/\s/.test(nextValue.trim())) {
              commitMany(nextValue);
              return;
            }
            setDraft(nextValue);
          }}
          onBlur={() => commitToken(draft)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text');
            if (!pasted.trim()) return;
            event.preventDefault();
            commitMany(pasted);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (!suggestions.length) return;
              setActiveSuggestionIndex((current) =>
                current >= suggestions.length - 1 ? 0 : current + 1
              );
              return;
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              if (!suggestions.length) return;
              setActiveSuggestionIndex((current) =>
                current <= 0 ? suggestions.length - 1 : current - 1
              );
              return;
            }
            if (
              event.key === 'Enter' ||
              event.key === 'Tab' ||
              event.key === ','
            ) {
              if (!draft.trim()) return;
              event.preventDefault();
              const picked = suggestions[activeSuggestionIndex];
              if (picked?.kind === 'hint') {
                setDraft(picked.insertText ?? picked.token);
                return;
              }
              commitToken(picked?.insertText ?? picked?.token ?? draft);
              return;
            }
            if (event.key === 'Backspace' && !draft && !event.repeat) {
              if (!tokens.length) return;
              event.preventDefault();
              removeTokenAt(tokens.length - 1);
            }
          }}
          placeholder={placeholder}
          data-testid={inputTestId}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
          onClick={() => setMode(nextMode)}
          data-testid="inspector-classname-mode-toggle"
          aria-label={`Switch to ${nextMode} mode`}
          title={`Switch to ${nextMode} mode`}
        >
          <ModeIcon size={12} />
        </button>
      </div>
      {draft.trim() && suggestions.length ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+2px)] z-10 grid gap-0.5 rounded-md border border-black/10 bg-(--color-0) p-1 shadow-[0_10px_20px_rgba(0,0,0,0.12)] dark:border-white/16"
          role="listbox"
          data-testid="inspector-classname-suggestions"
        >
          {suggestions.map((suggestion, index) => {
            const Icon = getSuggestionIcon(suggestion.token);
            return (
              <button
                key={suggestion.token}
                type="button"
                className={`flex min-h-6 items-center gap-1.5 rounded-md border-0 px-2 py-0.5 text-left text-xs leading-[1.25] ${
                  activeSuggestionIndex === index
                    ? 'bg-black/8 text-(--color-9) dark:bg-white/14'
                    : 'bg-transparent text-(--color-7) hover:bg-black/5 hover:text-(--color-9) dark:hover:bg-white/10'
                }`}
                role="option"
                aria-selected={activeSuggestionIndex === index}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (suggestion.kind === 'hint') {
                    setDraft(suggestion.insertText ?? suggestion.token);
                    return;
                  }
                  commitToken(suggestion.insertText ?? suggestion.token);
                }}
                data-testid={`inspector-classname-suggestion-${suggestion.token}`}
                title={getSuggestionDetail(suggestion)}
              >
                <Icon size={12} />
                <span className="truncate">
                  {getSuggestionLabel(suggestion)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-1">
      {mode === 'token' ? (
        tokenEditor
      ) : (
        <div className="relative">
          <input
            className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 pr-7 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
            value={value}
            onChange={(event) =>
              onChange(toClassNameValue(parseClassTokens(event.target.value)))
            }
            placeholder={placeholder}
            data-testid={inputTestId}
          />
          <button
            type="button"
            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
            onClick={() => setMode(nextMode)}
            data-testid="inspector-classname-mode-toggle"
            aria-label={`Switch to ${nextMode} mode`}
            title={`Switch to ${nextMode} mode`}
          >
            <ModeIcon size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
