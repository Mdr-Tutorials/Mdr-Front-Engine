export type EditorShortcutScope =
  | 'global'
  | 'blueprint'
  | 'nodegraph'
  | 'animation'
  | 'resources'
  | 'modal'
  | (string & {});

export type ParsedShortcut = {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
};

export type EditorShortcutOptions = {
  enabled?: boolean;
  scope?: EditorShortcutScope;
  priority?: number;
  preventDefault?: boolean;
  allowInEditable?: boolean;
  allowRepeat?: boolean;
};

export type EditorShortcutRegistration = {
  id: string;
  combo: string;
  parsed: ParsedShortcut;
  handler: (event: KeyboardEvent) => void;
  enabled: boolean;
  scope: EditorShortcutScope;
  scopeDepth: number;
  priority: number;
  preventDefault: boolean;
  allowInEditable: boolean;
  allowRepeat: boolean;
};
