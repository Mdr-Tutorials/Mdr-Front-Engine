import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectResources } from '@/editor/features/resources/ProjectResources';

vi.mock('@uiw/react-codemirror', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="project-resources-codemirror"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock('../../design/blueprint/external', () => {
  const getConfiguredExternalLibraryIds = () => {
    const raw = localStorage.getItem('mdr.externalLibraryIds');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  };
  return {
    getRegisteredExternalLibraries: () => [
      { id: 'mui', label: 'Material UI' },
      { id: 'antd', label: 'Ant Design' },
    ],
    getConfiguredExternalLibraryIds,
    setConfiguredExternalLibraryIds: (libraryIds: string[]) => {
      localStorage.setItem(
        'mdr.externalLibraryIds',
        JSON.stringify([...new Set(libraryIds)])
      );
      return libraryIds;
    },
  };
});

vi.mock('@/mir/renderer/iconRegistry', () => {
  const getConfiguredIconLibraryIds = () => {
    const raw = localStorage.getItem('mdr.iconLibraryIds');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  };

  return {
    getRegisteredIconLibraries: () => [
      { id: 'fontawesome', label: 'Font Awesome' },
      { id: 'mui-icons', label: 'Material Icons' },
      { id: 'ant-design-icons', label: 'Ant Design Icons' },
      { id: 'heroicons', label: 'Heroicons' },
    ],
    getConfiguredIconLibraryIds,
    setConfiguredIconLibraryIds: (libraryIds: string[]) => {
      localStorage.setItem(
        'mdr.iconLibraryIds',
        JSON.stringify([...new Set(libraryIds)])
      );
      return libraryIds;
    },
  };
});

describe('ProjectResources', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/editor/project/project-001/resources']}>
        <Routes>
          <Route
            path="/editor/project/:projectId/resources"
            element={<ProjectResources />}
          />
        </Routes>
      </MemoryRouter>
    );

  it('renders resource manager tabs', () => {
    renderWithRouter();
    expect(screen.getByText('resourceManager.header.title')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'resourceManager.tabs.overview' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'resourceManager.tabs.public' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'resourceManager.tabs.code' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'resourceManager.tabs.i18n' })
    ).toBeTruthy();
  });

  it('switches to public tab inside same route', () => {
    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.public' })
    );
    expect(
      screen.getByText('resourceManager.tree.publicEditable')
    ).toBeTruthy();
    expect(screen.queryByText('resourceManager.public.hints.title')).toBeNull();
  });

  it('switches to code tab and renders code workspace', () => {
    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.code' })
    );
    expect(screen.getByText('resourceManager.code.header.title')).toBeTruthy();
    expect(screen.queryByText('Code assets tab is reserved.')).toBeNull();
  });

  it('keeps unique code file names when using overview quick actions', () => {
    renderWithRouter();

    fireEvent.click(
      screen.getByRole('button', {
        name: /resourceManager\.overview\.quickActions\.newScript/,
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.overview' })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /resourceManager\.overview\.quickActions\.newScript/,
      })
    );

    const rawTree = localStorage.getItem('mdr.codeTree.project-001');
    expect(rawTree).toBeTruthy();
    const parsedTree = JSON.parse(rawTree ?? '{}');
    const scriptsFolder = parsedTree.children.find(
      (node: { id: string }) => node.id === 'code-scripts'
    );
    const names = scriptsFolder.children.map(
      (node: { name: string }) => node.name
    );
    expect(names).toContain('untitled.ts');
    expect(names).toContain('untitled-1.ts');
    const firstScript = scriptsFolder.children.find(
      (node: { name: string }) => node.name === 'untitled.ts'
    );
    expect(firstScript.textContent).toBe('export const hello = "mdr";\n');
  });

  it('switches to i18n tab and renders i18n workspace', () => {
    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.i18n' })
    );
    expect(screen.getByText('resourceManager.i18n.header.title')).toBeTruthy();
    expect(screen.queryByText('i18n assets tab is reserved.')).toBeNull();
  });

  it('restores last opened resource tab', () => {
    localStorage.setItem('mdr.resourceManager.view.project-001', 'public');
    renderWithRouter();
    expect(
      screen.getByText('resourceManager.tree.publicEditable')
    ).toBeTruthy();
  });

  it('restores last selected public file', () => {
    localStorage.setItem('mdr.resourceManager.view.project-001', 'public');
    localStorage.setItem(
      'mdr.publicTree.project-001',
      JSON.stringify({
        id: 'public-root',
        name: 'public',
        type: 'folder',
        path: 'public',
        parentId: null,
        updatedAt: new Date().toISOString(),
        children: [
          {
            id: 'asset-file',
            name: 'logo.svg',
            type: 'file',
            path: 'public/logo.svg',
            parentId: 'public-root',
            mime: 'image/svg+xml',
            textContent: '<svg/>',
            updatedAt: new Date().toISOString(),
          },
        ],
      })
    );
    localStorage.setItem(
      'mdr.resourceManager.public.selection.project-001',
      'asset-file'
    );
    renderWithRouter();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'logo.svg',
      })
    ).toBeTruthy();
  });

  it('imports external libraries from external tab', async () => {
    localStorage.setItem(
      'mdr.resourceManager.external.selection.project-001',
      JSON.stringify([])
    );
    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.external' })
    );
    expect(
      await screen.findByText('resourceManager.external.header.title')
    ).toBeTruthy();

    fireEvent.click(
      screen.getByTestId('external-library-category-trigger-component')
    );
    fireEvent.click(
      screen.getByTestId('external-library-category-option-component-mui')
    );

    await waitFor(() => {
      expect(localStorage.getItem('mdr.externalLibraryIds')).toContain('mui');
    });
    expect(
      localStorage.getItem('mdr.resourceManager.external.selection.project-001')
    ).toContain('mui');
  });

  it('loads npm metadata and caches it for library details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        description: 'Fallback description',
        license: 'MIT',
        'dist-tags': { latest: '19.2.0' },
        versions: {
          '19.2.0': {
            description: 'React lets you build user interfaces.',
            license: { type: 'MIT' },
          },
        },
      }),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.external' })
    );
    expect(
      await screen.findByText('resourceManager.external.header.title')
    ).toBeTruthy();

    fireEvent.click(
      screen.getByTestId('external-library-category-trigger-other')
    );
    fireEvent.click(
      screen.getByTestId('external-library-category-option-other-react')
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(
        localStorage.getItem(
          'mdr.resourceManager.external.metadata.project-001'
        )
      ).toContain('react');
    });

    const licenseLink = await screen.findByRole('link', { name: 'MIT' });
    expect(licenseLink.getAttribute('href')).toBe(
      'https://spdx.org/licenses/MIT.html'
    );

    vi.unstubAllGlobals();
  });

  it('supports removing imported external libraries', async () => {
    localStorage.setItem(
      'mdr.resourceManager.external.selection.project-001',
      JSON.stringify(['antd'])
    );
    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.external' })
    );
    expect(
      await screen.findByText('resourceManager.external.header.title')
    ).toBeTruthy();

    fireEvent.click(screen.getByTestId('external-library-remove-antd'));

    await waitFor(() => {
      expect(localStorage.getItem('mdr.externalLibraryIds')).toBe('[]');
    });
    expect(
      localStorage.getItem('mdr.resourceManager.external.selection.project-001')
    ).toBe('[]');
  });

  it('supports manual external library id import', async () => {
    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.external' })
    );
    expect(
      await screen.findByText('resourceManager.external.header.title')
    ).toBeTruthy();

    fireEvent.click(screen.getByTestId('external-library-open-add-modal'));
    fireEvent.change(screen.getByTestId('external-library-modal-name-input'), {
      target: { value: 'antd' },
    });
    fireEvent.change(
      screen.getByTestId('external-library-modal-version-input'),
      {
        target: { value: '5.27.6' },
      }
    );
    fireEvent.click(screen.getByTestId('external-library-modal-submit'));

    await waitFor(() => {
      expect(localStorage.getItem('mdr.externalLibraryIds')).toContain('antd');
    });
  });

  it('imports icon library presets from external tab', async () => {
    renderWithRouter();
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.tabs.external' })
    );
    expect(
      await screen.findByText('resourceManager.external.header.title')
    ).toBeTruthy();

    fireEvent.click(
      screen.getByTestId('external-library-category-trigger-icon')
    );
    fireEvent.click(
      screen.getByTestId('external-library-category-option-icon-heroicons')
    );

    await waitFor(() => {
      expect(localStorage.getItem('mdr.iconLibraryIds')).toContain('heroicons');
    });
    expect(
      localStorage.getItem('mdr.resourceManager.icon.selection.project-001')
    ).toContain('heroicons');
  });
});
