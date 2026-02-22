import { describe, expect, it } from 'vitest';
import {
  createCodeFile,
  renameCodeNode,
  type CodeResourceNode,
} from '../codeTree';

describe('codeTree', () => {
  it('updates mime when file extension changes on rename', () => {
    const tree: CodeResourceNode = {
      id: 'code-root',
      name: 'code',
      type: 'folder',
      path: 'code',
      parentId: null,
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: 'scripts',
          name: 'scripts',
          type: 'folder',
          path: 'code/scripts',
          parentId: 'code-root',
          updatedAt: new Date().toISOString(),
          children: [
            {
              id: 'entry',
              name: 'main.ts',
              type: 'file',
              path: 'code/scripts/main.ts',
              parentId: 'scripts',
              mime: 'text/typescript',
              textContent: 'export const a = 1;\n',
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    };

    const renamed = renameCodeNode(tree, 'entry', 'main.css');
    const file = renamed.children?.[0]?.children?.[0];
    expect(file?.name).toBe('main.css');
    expect(file?.mime).toBe('text/css');
  });

  it('ensures created files are unique under the same folder', () => {
    const tree: CodeResourceNode = {
      id: 'code-root',
      name: 'code',
      type: 'folder',
      path: 'code',
      parentId: null,
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: 'scripts',
          name: 'scripts',
          type: 'folder',
          path: 'code/scripts',
          parentId: 'code-root',
          updatedAt: new Date().toISOString(),
          children: [],
        },
      ],
    };

    const first = createCodeFile(tree, 'scripts', {
      name: 'untitled.ts',
      mime: 'text/typescript',
      size: 0,
      textContent: '',
    });
    const second = createCodeFile(first, 'scripts', {
      name: 'untitled.ts',
      mime: 'text/typescript',
      size: 0,
      textContent: '',
    });
    const names = second.children?.[0]?.children?.map((child) => child.name);
    expect(names).toEqual(['untitled.ts', 'untitled-1.ts']);
  });

  it('ensures renamed files keep unique names in the same folder', () => {
    const tree: CodeResourceNode = {
      id: 'code-root',
      name: 'code',
      type: 'folder',
      path: 'code',
      parentId: null,
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: 'scripts',
          name: 'scripts',
          type: 'folder',
          path: 'code/scripts',
          parentId: 'code-root',
          updatedAt: new Date().toISOString(),
          children: [
            {
              id: 'main-file',
              name: 'main.css',
              type: 'file',
              path: 'code/scripts/main.css',
              parentId: 'scripts',
              mime: 'text/css',
              textContent: '.main {}\n',
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'helper-file',
              name: 'helper.ts',
              type: 'file',
              path: 'code/scripts/helper.ts',
              parentId: 'scripts',
              mime: 'text/typescript',
              textContent: 'export const b = 2;\n',
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    };

    const renamed = renameCodeNode(tree, 'helper-file', 'main.css');
    const file = renamed.children?.[0]?.children?.find(
      (child) => child.id === 'helper-file'
    );
    expect(file?.name).toBe('main-1.css');
    expect(file?.mime).toBe('text/css');
  });
});
