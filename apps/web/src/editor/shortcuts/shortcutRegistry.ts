import type { EditorShortcutRegistration } from './shortcutTypes';

const shortcutRegistry = new Map<string, EditorShortcutRegistration>();

export const registerEditorShortcut = (
  registration: EditorShortcutRegistration
) => {
  shortcutRegistry.set(registration.id, registration);
};

export const unregisterEditorShortcut = (id: string) => {
  shortcutRegistry.delete(id);
};

export const getEditorShortcuts = () => Array.from(shortcutRegistry.values());
