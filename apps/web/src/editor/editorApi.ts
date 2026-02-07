import type { MIRDocument } from '@/core/types/engine.types';
import { ApiError } from '@/auth/authApi';

export type ProjectResourceType = 'project' | 'component' | 'nodegraph';

export type ProjectSummary = {
  id: string;
  resourceType: ProjectResourceType;
  name: string;
  description?: string;
  isPublic: boolean;
  starsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  ownerId: string;
  mir: MIRDocument;
};

const resolveBaseUrl = () => {
  const base = (import.meta as ImportMeta & { env?: Record<string, string> })
    .env?.VITE_API_BASE;
  if (base && base.trim()) {
    return base.replace(/\/+$/, '');
  }
  return 'http://localhost:8080';
};

const API_ROOT = `${resolveBaseUrl()}/api`;

const request = async <T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message || '')
        : response.statusText || 'Request failed.';
    const code =
      typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error?: string }).error || '')
        : undefined;
    throw new ApiError(message || 'Request failed.', response.status, code);
  }

  return payload as T;
};

export const editorApi = {
  listProjects: async (token: string) =>
    request<{ projects: ProjectSummary[] }>(token, '/projects'),

  createProject: async (
    token: string,
    data: {
      name: string;
      description?: string;
      resourceType: ProjectResourceType;
      isPublic?: boolean;
      mir?: MIRDocument;
    }
  ) =>
    request<{ project: ProjectSummary }>(token, '/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProject: async (token: string, projectId: string) =>
    request<{ project: ProjectDetail }>(
      token,
      `/projects/${encodeURIComponent(projectId)}`
    ),

  saveProjectMir: async (token: string, projectId: string, mir: MIRDocument) =>
    request<{ project: ProjectDetail }>(
      token,
      `/projects/${encodeURIComponent(projectId)}/mir`,
      {
        method: 'PUT',
        body: JSON.stringify({ mir }),
      }
    ),

  publishProject: async (token: string, projectId: string) =>
    request<{ project: ProjectDetail }>(
      token,
      `/projects/${encodeURIComponent(projectId)}/publish`,
      {
        method: 'POST',
      }
    ),

  deleteProject: async (token: string, projectId: string) =>
    request<void>(token, `/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
    }),
};
