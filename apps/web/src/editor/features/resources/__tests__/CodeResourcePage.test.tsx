import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeResourcePage } from '@/editor/features/resources/CodeResourcePage';

vi.mock('@uiw/react-codemirror', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="code-resource-codemirror"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

describe('CodeResourcePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/editor/project/project-001/resources']}>
        <Routes>
          <Route
            path="/editor/project/:projectId/resources"
            element={<CodeResourcePage embedded />}
          />
        </Routes>
      </MemoryRouter>
    );

  it('edits and saves selected code file content with Ctrl+S', () => {
    localStorage.setItem(
      'mdr.codeTree.project-001',
      JSON.stringify({
        id: 'code-root',
        name: 'code',
        type: 'folder',
        path: 'code',
        parentId: null,
        updatedAt: new Date().toISOString(),
        children: [
          {
            id: 'code-scripts',
            name: 'scripts',
            type: 'folder',
            path: 'code/scripts',
            parentId: 'code-root',
            updatedAt: new Date().toISOString(),
            children: [
              {
                id: 'file-main',
                name: 'main.ts',
                type: 'file',
                path: 'code/scripts/main.ts',
                parentId: 'code-scripts',
                category: 'document',
                mime: 'text/typescript',
                size: 20,
                textContent: 'export const a = 1;\n',
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        ],
      })
    );
    localStorage.setItem(
      'mdr.resourceManager.code.selection.project-001',
      'file-main'
    );

    renderWithRouter();

    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: 'export const a = 2;\n' } });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    const raw = localStorage.getItem('mdr.codeTree.project-001') ?? '{}';
    expect(raw).toContain('export const a = 2;');
  });

  it('creates default code extension by folder category', () => {
    renderWithRouter();

    fireEvent.click(screen.getByTitle('code/styles'));
    fireEvent.click(screen.getByLabelText('toolbar-create-code-file'));
    expect(localStorage.getItem('mdr.codeTree.project-001')).toContain(
      'untitled.css'
    );

    fireEvent.click(screen.getByTitle('code/shaders'));
    fireEvent.click(screen.getByLabelText('toolbar-create-code-file'));
    expect(localStorage.getItem('mdr.codeTree.project-001')).toContain(
      'untitled.glsl'
    );

    fireEvent.click(screen.getByTitle('code/scripts'));
    fireEvent.click(screen.getByLabelText('toolbar-create-code-file'));
    expect(localStorage.getItem('mdr.codeTree.project-001')).toContain(
      'untitled.ts'
    );
  });
});
