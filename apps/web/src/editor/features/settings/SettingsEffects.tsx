import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useAuthStore } from '@/auth/useAuthStore';
import { editorApi } from '@/editor/editorApi';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { useSettingsStore } from '@/editor/store/useSettingsStore';

const SETTINGS_INTENT_CAPABILITY = 'core.settings.global.update@1.0';

const createIntentId = () => {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `intent_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const SettingsEffects = () => {
  const { i18n } = useTranslation();
  const { projectId } = useParams();
  const token = useAuthStore((state) => state.token);
  const workspaceId = useEditorStore((state) => state.workspaceId);
  const workspaceRev = useEditorStore((state) => state.workspaceRev);
  const routeRev = useEditorStore((state) => state.routeRev);
  const workspaceCapabilitiesLoaded = useEditorStore(
    (state) => state.workspaceCapabilitiesLoaded
  );
  const canUpdateWorkspaceSettings = useEditorStore(
    (state) => state.workspaceCapabilities[SETTINGS_INTENT_CAPABILITY] === true
  );
  const applyWorkspaceMutation = useEditorStore(
    (state) => state.applyWorkspaceMutation
  );
  const globalSettings = useSettingsStore((state) => state.global);
  const projectGlobalById = useSettingsStore(
    (state) => state.projectGlobalById
  );
  const language = useSettingsStore((state) => {
    const projectSettings = projectId
      ? state.projectGlobalById[projectId]
      : undefined;
    return projectSettings?.overrides.language
      ? projectSettings.values.language
      : state.global.language;
  });
  const theme = useSettingsStore((state) => {
    const projectSettings = projectId
      ? state.projectGlobalById[projectId]
      : undefined;
    return projectSettings?.overrides.theme
      ? projectSettings.values.theme
      : state.global.theme;
  });
  const density = useSettingsStore((state) => {
    const projectSettings = projectId
      ? state.projectGlobalById[projectId]
      : undefined;
    return projectSettings?.overrides.density
      ? projectSettings.values.density
      : state.global.density;
  });
  const fontScale = useSettingsStore((state) => {
    const projectSettings = projectId
      ? state.projectGlobalById[projectId]
      : undefined;
    return projectSettings?.overrides.fontScale
      ? projectSettings.values.fontScale
      : state.global.fontScale;
  });
  const ensureProjectGlobal = useSettingsStore(
    (state) => state.ensureProjectGlobal
  );
  const settingsPayload = useMemo(
    () => ({
      global: globalSettings,
      projectGlobalById,
    }),
    [globalSettings, projectGlobalById]
  );
  const serializedSettingsPayload = useMemo(
    () => JSON.stringify(settingsPayload),
    [settingsPayload]
  );
  const settingsSyncRequestSeqRef = useRef(0);
  const syncedSettingsPayloadRef = useRef(serializedSettingsPayload);
  const syncedWorkspaceRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!projectId) return;
    ensureProjectGlobal(projectId);
  }, [ensureProjectGlobal, projectId]);

  useEffect(() => {
    if (!workspaceId) {
      syncedWorkspaceRef.current = undefined;
      return;
    }
    if (syncedWorkspaceRef.current === workspaceId) return;
    syncedWorkspaceRef.current = workspaceId;
    syncedSettingsPayloadRef.current = serializedSettingsPayload;
  }, [workspaceId, serializedSettingsPayload]);

  useEffect(() => {
    if (!token) return;
    if (!workspaceId) return;
    if (!workspaceCapabilitiesLoaded || !canUpdateWorkspaceSettings) return;
    if (typeof workspaceRev !== 'number' || workspaceRev <= 0) return;
    if (serializedSettingsPayload === syncedSettingsPayloadRef.current) return;

    let disposed = false;
    const requestSeq = settingsSyncRequestSeqRef.current + 1;
    settingsSyncRequestSeqRef.current = requestSeq;
    const timeoutId = window.setTimeout(() => {
      void editorApi
        .applyWorkspaceIntent(token, workspaceId, {
          expectedWorkspaceRev: workspaceRev,
          ...(typeof routeRev === 'number' && routeRev > 0
            ? { expectedRouteRev: routeRev }
            : {}),
          intent: {
            id: createIntentId(),
            namespace: 'core.settings',
            type: 'global.update',
            version: '1.0',
            payload: { settings: settingsPayload },
            issuedAt: new Date().toISOString(),
          },
        })
        .then((mutation) => {
          if (disposed || settingsSyncRequestSeqRef.current !== requestSeq) {
            return;
          }
          applyWorkspaceMutation(mutation);
          syncedSettingsPayloadRef.current = serializedSettingsPayload;
        })
        .catch((error) => {
          if (disposed || settingsSyncRequestSeqRef.current !== requestSeq) {
            return;
          }
          console.warn('[settings] workspace settings sync failed', error);
        });
    }, 500);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    applyWorkspaceMutation,
    canUpdateWorkspaceSettings,
    routeRev,
    serializedSettingsPayload,
    settingsPayload,
    token,
    workspaceCapabilitiesLoaded,
    workspaceId,
    workspaceRev,
  ]);

  useEffect(() => {
    if (!language) return;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    const applyTheme = (value: 'light' | 'dark') => {
      if (root.getAttribute('data-theme') === value) return;
      root.setAttribute('data-theme', value);
    };

    if (theme === 'light' || theme === 'dark') {
      applyTheme(theme);
      return;
    }

    if (theme !== 'home') return;

    const resolveHomeTheme = () => {
      const storedTheme = root.getAttribute('data-theme');
      if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'light';
    };

    applyTheme(resolveHomeTheme());

    const observer = new MutationObserver((mutations) => {
      if (
        !mutations.some((mutation) => mutation.attributeName === 'data-theme')
      )
        return;
      const nextTheme = resolveHomeTheme();
      applyTheme(nextTheme);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (density === 'comfortable') {
      delete document.body.dataset.density;
      return;
    }
    document.body.dataset.density = density;
  }, [density]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const scale = Number(fontScale) ? Number(fontScale) / 100 : 1;
    document.documentElement.style.setProperty(
      '--app-font-scale',
      String(scale)
    );
  }, [fontScale]);

  return null;
};
