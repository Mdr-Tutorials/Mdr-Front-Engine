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

export type WorkspaceDocumentType =
  | 'mir-page'
  | 'mir-layout'
  | 'mir-component'
  | 'mir-graph'
  | 'mir-animation';

export type WorkspacePatchOperation = {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  from?: string;
  value?: unknown;
};

export type WorkspaceCommandEnvelope = {
  id: string;
  namespace: string;
  type: string;
  version: string;
  issuedAt: string;
  forwardOps: WorkspacePatchOperation[];
  reverseOps: WorkspacePatchOperation[];
  target: {
    workspaceId: string;
    documentId?: string;
  };
  mergeKey?: string;
};

export type WorkspaceIntentEnvelope = {
  id: string;
  namespace: string;
  type: string;
  version: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  actor?: {
    userId?: string;
    clientId?: string;
  };
  issuedAt: string;
};

export type WorkspaceDocumentRecord = {
  id: string;
  type: WorkspaceDocumentType;
  path: string;
  contentRev: number;
  metaRev: number;
  content: MIRDocument;
  updatedAt?: string;
};

export type WorkspaceSnapshot = {
  id: string;
  workspaceRev: number;
  routeRev: number;
  opSeq: number;
  tree: Record<string, unknown>;
  documents: WorkspaceDocumentRecord[];
  routeManifest: Record<string, unknown>;
  settings?: Record<string, unknown>;
  activeRouteNodeId?: string;
};

export type WorkspaceMutationDocumentRevision = {
  id: string;
  contentRev: number;
  metaRev: number;
};

export type WorkspaceMutationResponse = {
  workspaceId: string;
  workspaceRev: number;
  routeRev: number;
  opSeq: number;
  updatedDocuments?: WorkspaceMutationDocumentRevision[];
  acceptedMutationId?: string;
};

export type WorkspaceCapabilitiesResponse = {
  workspaceId: string;
  capabilities: Record<string, boolean>;
};

export type SaveWorkspaceDocumentRequest = {
  expectedContentRev: number;
  expectedWorkspaceRev?: number;
  expectedRouteRev?: number;
  content: MIRDocument;
  command?: WorkspaceCommandEnvelope;
  clientMutationId?: string;
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
      typeof payload === 'object' && payload && 'code' in payload
        ? String((payload as { code?: string }).code || '')
        : typeof payload === 'object' && payload && 'error' in payload
          ? String((payload as { error?: string }).error || '')
          : undefined;
    const details =
      typeof payload === 'object' && payload && 'details' in payload
        ? (payload as { details?: unknown }).details
        : undefined;
    throw new ApiError(
      message || 'Request failed.',
      response.status,
      code,
      details
    );
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

  getWorkspace: async (token: string, workspaceId: string) =>
    request<{ workspace: WorkspaceSnapshot }>(
      token,
      `/workspaces/${encodeURIComponent(workspaceId)}`
    ),

  getWorkspaceCapabilities: async (token: string, workspaceId: string) =>
    request<WorkspaceCapabilitiesResponse>(
      token,
      `/workspaces/${encodeURIComponent(workspaceId)}/capabilities`
    ),

  saveWorkspaceDocument: async (
    token: string,
    workspaceId: string,
    documentId: string,
    data: SaveWorkspaceDocumentRequest
  ) =>
    request<WorkspaceMutationResponse>(
      token,
      `/workspaces/${encodeURIComponent(workspaceId)}/documents/${encodeURIComponent(documentId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  applyWorkspaceIntent: async (
    token: string,
    workspaceId: string,
    data: {
      expectedWorkspaceRev: number;
      expectedRouteRev?: number;
      intent: WorkspaceIntentEnvelope;
      clientMutationId?: string;
    }
  ) =>
    request<WorkspaceMutationResponse>(
      token,
      `/workspaces/${encodeURIComponent(workspaceId)}/intents`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  applyWorkspaceBatch: async (
    token: string,
    workspaceId: string,
    data: {
      expectedWorkspaceRev: number;
      expectedRouteRev?: number;
      operations: Array<
        | {
            op: 'saveDocument';
            documentId: string;
            expectedContentRev: number;
            content: MIRDocument;
            command?: WorkspaceCommandEnvelope;
          }
        | {
            op: 'intent';
            intent: WorkspaceIntentEnvelope;
          }
      >;
      clientBatchId?: string;
    }
  ) =>
    request<WorkspaceMutationResponse>(
      token,
      `/workspaces/${encodeURIComponent(workspaceId)}/batch`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
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
