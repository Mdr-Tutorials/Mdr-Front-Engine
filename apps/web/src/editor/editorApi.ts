import type { MIRDocument } from '@/core/types/engine.types';
import { apiRequest } from '@/infra/api';

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

const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const;

const request = async <T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> =>
  apiRequest<T>(path, {
    ...options,
    token,
    defaultHeaders: JSON_HEADERS,
  });

export const editorApi = {
  listProjects: async (token: string, options: RequestInit = {}) =>
    request<{ projects: ProjectSummary[] }>(token, '/projects', options),

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

  getProject: async (
    token: string,
    projectId: string,
    options: RequestInit = {}
  ) =>
    request<{ project: ProjectDetail }>(
      token,
      `/projects/${encodeURIComponent(projectId)}`,
      options
    ),

  updateProject: async (
    token: string,
    projectId: string,
    data: {
      name?: string;
      description?: string;
    }
  ) =>
    request<{ project: ProjectDetail }>(
      token,
      `/projects/${encodeURIComponent(projectId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  getWorkspace: async (
    token: string,
    workspaceId: string,
    options: RequestInit = {}
  ) =>
    request<{ workspace: WorkspaceSnapshot }>(
      token,
      `/workspaces/${encodeURIComponent(workspaceId)}`,
      options
    ),

  getWorkspaceCapabilities: async (
    token: string,
    workspaceId: string,
    options: RequestInit = {}
  ) =>
    request<WorkspaceCapabilitiesResponse>(
      token,
      `/workspaces/${encodeURIComponent(workspaceId)}/capabilities`,
      options
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
