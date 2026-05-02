import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyProjectFileTemplate,
  flattenEnabledProjectFiles,
  readProjectFiles,
  updateProjectFile,
  writeProjectFiles,
} from '@/editor/features/resources/projectFileStore';

describe('projectFileStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates default project root files', () => {
    const files = readProjectFiles('project-001');
    expect(files.map((file) => file.path)).toEqual([
      '.gitignore',
      'LICENSE',
      'README.md',
      '.env.example',
    ]);
    expect(flattenEnabledProjectFiles(files).map((file) => file.path)).toEqual([
      '.gitignore',
    ]);
  });

  it('updates and persists project root files', () => {
    const files = readProjectFiles('project-001');
    const nextFiles = updateProjectFile(files, 'LICENSE', {
      enabled: true,
      content: 'Custom license',
    });
    writeProjectFiles('project-001', nextFiles);

    const restored = readProjectFiles('project-001');
    const license = restored.find((file) => file.path === 'LICENSE');
    expect(license?.enabled).toBe(true);
    expect(license?.content).toBe('Custom license');
  });

  it('applies templates and enables the target file', () => {
    const files = readProjectFiles('project-001');
    const nextFiles = applyProjectFileTemplate(files, 'license-apache-2');
    const license = nextFiles.find((file) => file.path === 'LICENSE');
    expect(license?.enabled).toBe(true);
    expect(license?.content).toContain('Apache License');
  });
});
