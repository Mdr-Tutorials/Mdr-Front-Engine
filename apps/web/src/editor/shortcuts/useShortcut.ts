import { useEffect, useId, useMemo, useRef } from 'react';
import { parseShortcut } from './matchShortcut';
import {
  registerEditorShortcut,
  unregisterEditorShortcut,
} from './shortcutRegistry';
import { useEditorShortcutScope } from './ShortcutProvider';
import type { EditorShortcutOptions } from './shortcutTypes';

export const useEditorShortcut = (
  combo: string,
  handler: (event: KeyboardEvent) => void,
  options: EditorShortcutOptions = {}
) => {
  const {
    enabled = true,
    scope,
    priority = 0,
    preventDefault = true,
    allowInEditable = false,
    allowRepeat = false,
  } = options;
  const shortcutId = useId();
  const handlerRef = useRef(handler);
  const { activeScopes } = useEditorShortcutScope();
  const parsedShortcut = useMemo(() => parseShortcut(combo), [combo]);
  const resolvedScope =
    scope ?? activeScopes[activeScopes.length - 1] ?? 'global';
  const scopeDepth = scope ? activeScopes.length + 1 : activeScopes.length;

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    registerEditorShortcut({
      id: shortcutId,
      combo,
      parsed: parsedShortcut,
      handler: (event) => handlerRef.current(event),
      enabled,
      scope: resolvedScope,
      scopeDepth,
      priority,
      preventDefault,
      allowInEditable,
      allowRepeat,
    });

    return () => {
      unregisterEditorShortcut(shortcutId);
    };
  }, [
    allowInEditable,
    allowRepeat,
    combo,
    enabled,
    parsedShortcut,
    preventDefault,
    priority,
    resolvedScope,
    scopeDepth,
    shortcutId,
  ]);
};
