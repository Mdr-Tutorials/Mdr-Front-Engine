import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsEffects } from '@/editor/features/settings/SettingsEffects';
import { useAuthStore } from '@/auth/useAuthStore';
import { editorApi } from '@/editor/editorApi';
import { useSettingsStore } from '@/editor/store/useSettingsStore';
import { resetEditorStore, resetSettingsStore } from '@/test-utils/editorStore';

const getChangeLanguage = () =>
  (globalThis as { __i18nChangeLanguage?: ReturnType<typeof vi.fn> })
    .__i18nChangeLanguage;

describe('SettingsEffects', () => {
  beforeEach(() => {
    getChangeLanguage()?.mockClear();
    resetEditorStore();
    useAuthStore.setState({ token: null, user: null, expiresAt: null });
    resetSettingsStore({
      language: 'zh-CN',
      theme: 'light',
      density: 'compact',
      fontScale: 120,
    });
  });

  it('syncs document attributes with settings', async () => {
    render(<SettingsEffects />);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('zh-CN');
      expect(getChangeLanguage()).toHaveBeenCalledWith('zh-CN');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.density).toBe('compact');
      expect(
        document.documentElement.style.getPropertyValue('--app-font-scale')
      ).toBe('1.2');
    });
  });

  it('syncs workspace settings via intent payloads', async () => {
    vi.useFakeTimers();
    const applyWorkspaceIntent = vi
      .spyOn(editorApi, 'applyWorkspaceIntent')
      .mockResolvedValue({
        workspaceId: 'ws-1',
        workspaceRev: 7,
        routeRev: 4,
        opSeq: 13,
      });

    useAuthStore.setState({
      token: 'token-1',
      user: null,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    resetEditorStore({
      workspaceId: 'ws-1',
      workspaceRev: 6,
      routeRev: 4,
      workspaceCapabilitiesLoaded: true,
      workspaceCapabilities: {
        'core.settings.global.update@1.0': true,
      },
    });

    render(<SettingsEffects />);

    act(() => {
      useSettingsStore.getState().setGlobalValue('eventTriggerMode', 'always');
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });
    expect(applyWorkspaceIntent).toHaveBeenCalledTimes(1);
    const request = applyWorkspaceIntent.mock.calls[0]?.[2];
    expect(request?.intent.namespace).toBe('core.settings');
    expect(request?.intent.type).toBe('global.update');
    expect(request?.intent.payload).toMatchObject({
      settings: {
        global: {
          eventTriggerMode: 'always',
        },
      },
    });

    vi.useRealTimers();
  });
});
