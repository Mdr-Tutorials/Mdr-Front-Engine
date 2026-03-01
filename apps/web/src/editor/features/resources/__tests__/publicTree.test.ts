import { describe, expect, it } from 'vitest';
import {
  collectBestPracticeHints,
  createDefaultPublicTree,
  createFile,
  createFolder,
  findNodeById,
  removeNodeById,
  renameNode,
} from '@/editor/features/resources/publicTree';

describe('publicTree commands', () => {
  it('creates folder and file nodes with hydrated path', () => {
    const initial = createDefaultPublicTree();
    const withFolder = createFolder(initial, 'public-images', 'landing');
    const withFile = createFile(withFolder, 'public-images', {
      name: 'hero.png',
      category: 'image',
      mime: 'image/png',
      size: 4096,
    });
    const folder = findNodeById(withFile, 'public-images');
    const file = folder?.children?.find((node) => node.name === 'hero.png');
    expect(folder?.path).toBe('public/images');
    expect(file?.path).toBe('public/images/hero.png');
  });

  it('renames and removes nodes', () => {
    const initial = createDefaultPublicTree();
    const withFile = createFile(initial, 'public-images', {
      name: 'hero.png',
      category: 'image',
      mime: 'image/png',
      size: 2048,
    });
    const fileId =
      findNodeById(withFile, 'public-images')?.children?.[0]?.id ?? '';
    const renamed = renameNode(withFile, fileId, 'banner.png');
    const deleted = removeNodeById(renamed, fileId);
    expect(findNodeById(renamed, fileId)?.name).toBe('banner.png');
    expect(findNodeById(deleted, fileId)).toBeUndefined();
  });

  it('collects hints for naming, path and svg risks', () => {
    const initial = createDefaultPublicTree();
    const withFile = createFile(initial, 'public-images', {
      name: 'Hero Image.svg',
      category: 'image',
      mime: 'image/svg+xml',
      size: 700 * 1024,
      textContent:
        '<svg><script>alert(1)</script><image href="https://demo"/></svg>',
    });
    const fileId =
      findNodeById(withFile, 'public-images')?.children?.[0]?.id ?? '';
    const hints = collectBestPracticeHints(findNodeById(withFile, fileId)!);
    expect(hints.some((hint) => hint.code === 'name.kebab-case')).toBe(true);
    expect(hints.some((hint) => hint.code === 'size.image')).toBe(true);
    expect(hints.some((hint) => hint.code === 'svg.script')).toBe(true);
    expect(hints.some((hint) => hint.code === 'svg.external-link')).toBe(true);
  });
});
