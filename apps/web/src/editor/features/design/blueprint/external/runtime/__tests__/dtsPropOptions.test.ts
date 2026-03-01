import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDtsCacheKey,
  enrichCanonicalPropOptionsFromDts,
} from '@/editor/features/design/blueprint/external/runtime/dtsPropOptions';
import type { CanonicalExternalComponent } from '@/editor/features/design/blueprint/external/runtime/types';

const createComponent = (path: string): CanonicalExternalComponent => ({
  libraryId: 'mui',
  componentName: path,
  component: 'button',
  runtimeType: `Mui${path}`,
  itemId: `mui-${path.toLowerCase()}`,
  path,
  adapter: { kind: 'custom' },
  preview: null,
  defaultProps: { variant: 'contained', size: 'medium' },
  behaviorTags: [],
  codegenHints: {},
  propsSchema: {},
  slots: [],
});

describe('dts prop options parser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('extracts union literals from d.ts and enriches canonical component options', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        `
          export interface ButtonProps {
            variant?: 'text' | 'outlined' | 'contained';
            size?: 'small' | 'medium' | 'large';
          }
        `,
    } as Response);

    const next = await enrichCanonicalPropOptionsFromDts(
      {
        libraryId: 'mui',
        packageName: '@mui/material',
        version: '7.3.2',
        source: 'esm.sh',
        entryCandidates: [],
      },
      [createComponent('Button')]
    );

    expect(next[0]?.propOptions?.variant).toEqual([
      'text',
      'outlined',
      'contained',
    ]);
    expect(next[0]?.propOptions?.size).toEqual(['small', 'medium', 'large']);
  });

  it('uses localStorage cache when available', async () => {
    const url =
      'https://cdn.jsdelivr.net/npm/@mui/material@7.3.2/Button/Button.d.ts';
    window.localStorage.setItem(
      createDtsCacheKey(url),
      JSON.stringify({
        content:
          "export interface ButtonProps { variant?: 'text' | 'outlined' | 'contained'; }",
        cachedAt: Date.now(),
      })
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      text: async () => '',
    } as Response);

    const next = await enrichCanonicalPropOptionsFromDts(
      {
        libraryId: 'mui',
        packageName: '@mui/material',
        version: '7.3.2',
        source: 'esm.sh',
        entryCandidates: [],
      },
      [createComponent('Button')]
    );

    expect(next[0]?.propOptions?.variant).toEqual([
      'text',
      'outlined',
      'contained',
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
