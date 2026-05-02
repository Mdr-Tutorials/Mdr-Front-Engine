export type ProjectFileKind = 'gitignore' | 'license' | 'readme' | 'env';

export type ProjectFile = {
  id: string;
  path: string;
  kind: ProjectFileKind;
  mime: string;
  content: string;
  enabled: boolean;
  updatedAt: string;
};

export type ProjectFileTemplateId =
  | 'gitignore-vite-react'
  | 'license-mit'
  | 'license-apache-2'
  | 'readme-basic'
  | 'env-example';

export type ProjectFileTemplate = {
  id: ProjectFileTemplateId;
  targetPath: string;
  label: string;
  content: string;
};

const nowIso = () => new Date().toISOString();

const currentYear = new Date().getFullYear();

export const PROJECT_FILE_TEMPLATES: ProjectFileTemplate[] = [
  {
    id: 'gitignore-vite-react',
    targetPath: '.gitignore',
    label: 'Vite + React',
    content: `# dependencies
node_modules

# production
dist
build

# local env
.env
.env.*
!.env.example

# logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# editor
.DS_Store
.idea
.vscode

# test and cache
coverage
.turbo
.vite
`,
  },
  {
    id: 'license-mit',
    targetPath: 'LICENSE',
    label: 'MIT',
    content: `MIT License

Copyright (c) ${currentYear} MdrFrontEngine User

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  },
  {
    id: 'license-apache-2',
    targetPath: 'LICENSE',
    label: 'Apache-2.0',
    content: `Apache License
Version 2.0, January 2004
https://www.apache.org/licenses/

Copyright ${currentYear} MdrFrontEngine User

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
`,
  },
  {
    id: 'readme-basic',
    targetPath: 'README.md',
    label: 'Basic README',
    content: `# MdrFrontEngine Export

Generated from MdrFrontEngine.

## Scripts

\`\`\`bash
pnpm install
pnpm dev
pnpm build
\`\`\`
`,
  },
  {
    id: 'env-example',
    targetPath: '.env.example',
    label: 'Environment example',
    content: `VITE_API_BASE_URL=
`,
  },
];

const createProjectFile = (
  path: string,
  kind: ProjectFileKind,
  mime: string,
  content: string,
  enabled: boolean
): ProjectFile => ({
  id: `project-file-${path.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
  path,
  kind,
  mime,
  content,
  enabled,
  updatedAt: nowIso(),
});

export const createDefaultProjectFiles = (): ProjectFile[] => [
  createProjectFile(
    '.gitignore',
    'gitignore',
    'text/plain',
    PROJECT_FILE_TEMPLATES[0].content,
    true
  ),
  createProjectFile(
    'LICENSE',
    'license',
    'text/plain',
    PROJECT_FILE_TEMPLATES[1].content,
    false
  ),
  createProjectFile(
    'README.md',
    'readme',
    'text/markdown',
    PROJECT_FILE_TEMPLATES[3].content,
    false
  ),
  createProjectFile(
    '.env.example',
    'env',
    'text/plain',
    PROJECT_FILE_TEMPLATES[4].content,
    false
  ),
];

const getProjectFilesStorageKey = (projectId?: string) =>
  `mdr.projectFiles.${projectId?.trim() || 'default'}`;

const withDefaultProjectFiles = (files: ProjectFile[]) => {
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const defaults = createDefaultProjectFiles();
  defaults.forEach((file) => {
    if (!filesByPath.has(file.path)) filesByPath.set(file.path, file);
  });
  return Array.from(filesByPath.values()).map((file) => ({
    ...file,
    updatedAt: file.updatedAt || nowIso(),
  }));
};

export const readProjectFiles = (projectId?: string): ProjectFile[] => {
  if (typeof window === 'undefined') return createDefaultProjectFiles();
  try {
    const raw = window.localStorage.getItem(
      getProjectFilesStorageKey(projectId)
    );
    if (!raw) return createDefaultProjectFiles();
    const parsed = JSON.parse(raw) as ProjectFile[];
    if (!Array.isArray(parsed)) return createDefaultProjectFiles();
    const validFiles = parsed.filter(
      (file): file is ProjectFile =>
        Boolean(file) &&
        typeof file.path === 'string' &&
        typeof file.content === 'string' &&
        typeof file.enabled === 'boolean'
    );
    return withDefaultProjectFiles(validFiles);
  } catch {
    return createDefaultProjectFiles();
  }
};

export const writeProjectFiles = (
  projectId: string | undefined,
  files: ProjectFile[]
) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    getProjectFilesStorageKey(projectId),
    JSON.stringify(withDefaultProjectFiles(files))
  );
};

export const updateProjectFile = (
  files: ProjectFile[],
  path: string,
  patch: Partial<Pick<ProjectFile, 'content' | 'enabled'>>
): ProjectFile[] =>
  withDefaultProjectFiles(files).map((file) =>
    file.path === path
      ? {
          ...file,
          ...patch,
          updatedAt: nowIso(),
        }
      : file
  );

export const applyProjectFileTemplate = (
  files: ProjectFile[],
  templateId: ProjectFileTemplateId
): ProjectFile[] => {
  const template = PROJECT_FILE_TEMPLATES.find(
    (item) => item.id === templateId
  );
  if (!template) return withDefaultProjectFiles(files);
  return updateProjectFile(files, template.targetPath, {
    content: template.content,
    enabled: true,
  });
};

export const flattenEnabledProjectFiles = (
  files: ProjectFile[]
): Array<ProjectFile & { path: string }> =>
  withDefaultProjectFiles(files).filter((file) => file.enabled);
