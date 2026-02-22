import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nResourcePage } from '../I18nResourcePage';

describe('I18nResourcePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/editor/project/project-001/resources']}>
        <Routes>
          <Route
            path="/editor/project/:projectId/resources"
            element={<I18nResourcePage embedded />}
          />
        </Routes>
      </MemoryRouter>
    );

  it('supports adding locale and translation key', () => {
    renderWithRouter();

    fireEvent.change(screen.getByPlaceholderText('new locale'), {
      target: { value: 'fr' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add locale' }));

    fireEvent.change(screen.getByPlaceholderText('new.translation.key'), {
      target: { value: 'common.greeting' },
    });
    fireEvent.change(screen.getByPlaceholderText('default value (en)'), {
      target: { value: 'Hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const keyCell = screen.getAllByRole('button', {
      name: 'common.greeting',
    })[0];
    const row = keyCell.closest('tr');
    if (!row) throw new Error('missing translation row');
    fireEvent.change(screen.getByLabelText('translation-common.greeting-fr'), {
      target: { value: 'Bonjour' },
    });

    expect(screen.getAllByText('common.greeting').length).toBeGreaterThan(0);
    expect(localStorage.getItem('mdr.i18nStore.project-001')).toContain(
      'Bonjour'
    );
  });

  it('supports deleting key across locales', () => {
    renderWithRouter();

    fireEvent.change(screen.getByPlaceholderText('new.translation.key'), {
      target: { value: 'common.toDelete' },
    });
    fireEvent.change(screen.getByPlaceholderText('default value (en)'), {
      target: { value: 'Delete me' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const keyButton = screen.getAllByRole('button', {
      name: 'common.toDelete',
    })[0];
    const row = keyButton.closest('tr');
    if (!row) throw new Error('missing delete row');
    const deleteButton = Array.from(row.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete'
    );
    if (!deleteButton) throw new Error('missing delete button');
    fireEvent.click(deleteButton);

    expect(
      screen.queryByRole('button', { name: 'common.toDelete' })
    ).toBeNull();
    expect(localStorage.getItem('mdr.i18nStore.project-001')).not.toContain(
      'common.toDelete'
    );
  });
});
