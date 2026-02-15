import { ApiError } from '@/auth/authApi';
import type { MIRDocument } from '@/core/types/engine.types';

export type CommunityResourceType = 'project' | 'component' | 'nodegraph';

export type CommunityProjectSummary = {
  id: string;
  resourceType: CommunityResourceType;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  starsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CommunityProjectDetail = {
  id: string;
  ownerId: string;
  resourceType: CommunityResourceType;
  name: string;
  description: string;
  mir: MIRDocument;
  isPublic: boolean;
  starsCount: number;
  createdAt: string;
  updatedAt: string;
  authorName: string;
};

type ListProjectsOptions = {
  keyword?: string;
  resourceType?: CommunityResourceType | 'all';
  sort?: 'latest' | 'popular';
  page?: number;
  pageSize?: number;
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

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

const buildListQuery = (options: ListProjectsOptions) => {
  const params = new URLSearchParams();
  if (options.keyword?.trim()) {
    params.set('keyword', options.keyword.trim());
  }
  if (options.resourceType && options.resourceType !== 'all') {
    params.set('resourceType', options.resourceType);
  }
  if (options.sort) {
    params.set('sort', options.sort);
  }
  if (typeof options.page === 'number' && options.page > 0) {
    params.set('page', String(options.page));
  }
  if (typeof options.pageSize === 'number' && options.pageSize > 0) {
    params.set('pageSize', String(options.pageSize));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const communityApi = {
  listProjects: async (options: ListProjectsOptions = {}) =>
    request<{
      projects: CommunityProjectSummary[];
      page: number;
      pageSize: number;
      sort: 'latest' | 'popular' | string;
    }>(`/community/projects${buildListQuery(options)}`),

  getProject: async (projectId: string) =>
    request<{ project: CommunityProjectDetail }>(
      `/community/projects/${encodeURIComponent(projectId)}`
    ),
};
