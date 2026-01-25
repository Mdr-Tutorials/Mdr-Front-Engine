export const createGlobalDefaults = () => ({
    language: 'zh-CN',
    theme: 'system',
    density: 'comfortable',
    fontScale: 100,
    autosaveInterval: 20,
    undoSteps: '80',
    confirmPrompts: ['delete', 'reset', 'leave'],
    panelLayout: 'balanced',
    viewportWidth: '1440',
    viewportHeight: '900',
    zoomStep: 5,
    assist: ['grid', 'align', 'snap'],
    panInertia: 30,
    resolverOrder: 'custom>mdr>native',
    customNamespaces: 'acme, design-system',
    renderMode: 'strict',
    allowExternalProps: 'enabled',
    defaultFramework: 'react',
    formatting: 'prettier',
    outputPath: 'src/generated',
    importStyle: 'auto',
    metadata: 'enabled',
    shortcutPreset: 'default',
    diagnostics: ['selection', 'performance'],
    logLevel: 'info',
    telemetry: 'off',
});

export const createProjectDefaults = () => ({
    ...createGlobalDefaults(),
    viewportWidth: '1280',
    viewportHeight: '720',
    outputPath: 'apps/web/generated',
    customNamespaces: 'project-ui, acme',
});

export type GlobalSettingsState = ReturnType<typeof createGlobalDefaults>;
export type SettingsMode = 'global' | 'project';
export type OverrideState = Record<string, boolean>;
