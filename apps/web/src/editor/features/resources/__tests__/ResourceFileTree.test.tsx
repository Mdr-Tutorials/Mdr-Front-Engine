import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResourceFileTree } from '../ResourceFileTree';
import type { PublicResourceNode } from '../publicTree';

const buildTree = (): PublicResourceNode => ({
  id: 'public-root',
  name: 'public',
  type: 'folder',
  path: 'public',
  parentId: null,
  updatedAt: new Date().toISOString(),
  children: [
    {
      id: 'public-images',
      name: 'images',
      type: 'folder',
      path: 'public/images',
      parentId: 'public-root',
      updatedAt: new Date().toISOString(),
      children: [],
    },
    {
      id: 'logo-file',
      name: 'logo.svg',
      type: 'file',
      path: 'public/logo.svg',
      parentId: 'public-root',
      mime: 'image/svg+xml',
      updatedAt: new Date().toISOString(),
    },
  ],
});

describe('ResourceFileTree', () => {
  it('starts in-place rename on slow second click', () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(
      <ResourceFileTree
        tree={buildTree()}
        mode="editable"
        selectedId="logo-file"
        onSelect={onSelect}
      />
    );

    const fileButton = screen.getByRole('button', { name: /logo\.svg/i });
    fireEvent.click(fileButton);
    vi.advanceTimersByTime(320);
    fireEvent.click(fileButton);

    const input = screen.getByDisplayValue('logo.svg');
    expect(input).toBeTruthy();
    vi.useRealTimers();
  });

  it('does not start rename when reclick interval is too long', () => {
    vi.useFakeTimers();
    render(
      <ResourceFileTree
        tree={buildTree()}
        mode="editable"
        selectedId="logo-file"
      />
    );

    const fileButton = screen.getByRole('button', { name: /logo\.svg/i });
    fireEvent.click(fileButton);
    vi.advanceTimersByTime(2500);
    fireEvent.click(fileButton);

    expect(screen.queryByDisplayValue('logo.svg')).toBeNull();
    vi.useRealTimers();
  });

  it('commits rename with Enter key', () => {
    const onRename = vi.fn();
    render(
      <ResourceFileTree
        tree={buildTree()}
        mode="editable"
        selectedId="logo-file"
        requestRenameNodeId="logo-file"
        onRename={onRename}
      />
    );

    const input = screen.getByDisplayValue('logo.svg');
    fireEvent.change(input, { target: { value: 'hero.svg' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('logo-file', 'hero.svg');
  });

  it('opens context menu without changing selection and hides duplicate import action', () => {
    const onSelect = vi.fn();
    render(
      <ResourceFileTree
        tree={buildTree()}
        mode="editable"
        selectedId="public-images"
        onSelect={onSelect}
      />
    );

    const folderButton = screen.getByTitle('public/images');
    fireEvent.contextMenu(folderButton);

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByText('Import files')).toBeTruthy();
    expect(screen.getByText('Import image')).toBeTruthy();
    expect(screen.getByText('Import font')).toBeTruthy();
    expect(screen.getByText('New file (JSON)')).toBeTruthy();
    expect(screen.getByText('New file (SVG)')).toBeTruthy();
    expect(screen.queryByText('Import other')).toBeNull();
  });
});
