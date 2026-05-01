import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/auth/authApi';
import { editorApi, type WorkspaceCommandEnvelope } from '@/editor/editorApi';
import type { MIRDocument } from '@/core/types/engine.types';
import { validateMirDocument } from '@/mir/validator/validator';

export type AutosaveMode = 'manual' | 'on-change' | 'interval';
export type SaveTransport = 'workspace' | 'project' | null;
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type SaveIndicatorTone = 'error' | 'warning' | 'success' | 'neutral';

type WorkspaceMutation = Awaited<
  ReturnType<typeof editorApi.saveWorkspaceDocument>
>;

type UseBlueprintAutosaveOptions = {
  token: string | null;
  projectId?: string;
  mirDoc: MIRDocument;
  mirDocRevision: number;
  autosaveMode: AutosaveMode;
  autosaveIntervalMs: number;
  workspaceId?: string;
  activeDocumentId?: string;
  activeDocumentContentRev?: number;
  canUpdateWorkspaceDocument: boolean;
  workspaceCapabilitiesLoaded: boolean;
  applyWorkspaceMutation: (mutation: WorkspaceMutation) => void;
};

type UseBlueprintAutosaveResult = {
  saveStatus: SaveStatus;
  saveTransport: SaveTransport;
  saveIndicatorTone: SaveIndicatorTone;
  saveIndicatorLabel: string;
  isWorkspaceSaveDisabled: boolean;
  hasPendingChanges: boolean;
  saveNow: () => void;
};

const ON_CHANGE_AUTOSAVE_DELAY_MS = 1000;

const createCommandId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cmd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const createDocumentUpdateCommand = (
  workspaceId: string,
  documentId: string
): WorkspaceCommandEnvelope => ({
  id: createCommandId(),
  namespace: 'core.mir',
  type: 'document.update',
  version: '1.0',
  issuedAt: new Date().toISOString(),
  forwardOps: [],
  reverseOps: [],
  target: { workspaceId, documentId },
});

const resolveApiErrorMessage = (error: unknown): string | null => {
  if (!(error instanceof ApiError)) return null;
  if (Array.isArray(error.details) && error.details.length > 0) {
    const first = error.details[0] as {
      path?: string;
      message?: string;
    };
    if (first?.message) {
      return first.path ? `${first.path}: ${first.message}` : first.message;
    }
  }
  return error.message || null;
};

export const useBlueprintAutosave = ({
  token,
  projectId,
  mirDoc,
  mirDocRevision,
  autosaveMode,
  autosaveIntervalMs,
  workspaceId,
  activeDocumentId,
  activeDocumentContentRev,
  canUpdateWorkspaceDocument,
  workspaceCapabilitiesLoaded,
  applyWorkspaceMutation,
}: UseBlueprintAutosaveOptions): UseBlueprintAutosaveResult => {
  const { t } = useTranslation('blueprint');
  const saveRequestSeqRef = useRef(0);
  const isSavingRef = useRef(false);
  const [lastSavedRevision, setLastSavedRevision] = useState(mirDocRevision);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveTransport, setSaveTransport] = useState<SaveTransport>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const hasPendingChanges = mirDocRevision > lastSavedRevision;
  const normalizedAutosaveIntervalMs = Math.max(
    1000,
    Number.isFinite(autosaveIntervalMs) ? Math.round(autosaveIntervalMs) : 1000
  );

  const hasWorkspaceTarget =
    Boolean(workspaceId) &&
    Boolean(activeDocumentId) &&
    typeof activeDocumentContentRev === 'number' &&
    activeDocumentContentRev > 0;
  const isWorkspaceSaveDisabled =
    hasWorkspaceTarget &&
    workspaceCapabilitiesLoaded &&
    !canUpdateWorkspaceDocument;
  const saveIndicatorTone: SaveIndicatorTone =
    saveStatus === 'error'
      ? 'error'
      : saveStatus === 'saving'
        ? 'neutral'
        : isWorkspaceSaveDisabled
          ? 'warning'
          : saveStatus === 'saved'
            ? 'success'
            : autosaveMode === 'manual' && hasPendingChanges
              ? 'warning'
              : 'neutral';

  const saveIndicatorLabel = useMemo(() => {
    if (hasWorkspaceTarget && !workspaceCapabilitiesLoaded) {
      return t('autosave.capabilities.loading', {
        defaultValue: 'Checking workspace capabilities...',
      });
    }
    if (saveStatus === 'saving') {
      return t('autosave.status.saving', { defaultValue: 'Saving...' });
    }
    if (saveStatus === 'error') {
      return (
        saveMessage ||
        t('autosave.status.error', {
          defaultValue: 'Save failed. Retrying on next change.',
        })
      );
    }
    if (autosaveMode === 'manual' && hasPendingChanges) {
      return t('autosave.status.manualPending', {
        defaultValue: 'Unsaved changes. Click to save.',
      });
    }
    if (saveStatus === 'saved') {
      if (saveMessage) return saveMessage;
      if (saveTransport === 'workspace') {
        return t('autosave.status.workspaceSaved', {
          defaultValue: 'Saved to workspace.',
        });
      }
      return t('autosave.status.saved', { defaultValue: 'Saved.' });
    }
    return t('autosave.status.idle', { defaultValue: 'Ready' });
  }, [
    autosaveMode,
    hasPendingChanges,
    hasWorkspaceTarget,
    saveMessage,
    saveStatus,
    saveTransport,
    t,
    workspaceCapabilitiesLoaded,
  ]);
  const workspaceRetryMessage = t('autosave.messages.workspaceRetry', {
    defaultValue: 'Workspace save failed. Retrying on next change.',
  });
  const projectRetryMessage = t('autosave.messages.projectRetry', {
    defaultValue: 'Project save failed. Retrying on next change.',
  });
  const workspaceUnavailableMessage = t(
    'autosave.messages.workspaceUnavailableUsingProject',
    {
      defaultValue: 'Workspace document save unavailable. Using project save.',
    }
  );
  const projectSavedMessage = t('autosave.status.projectSaved', {
    defaultValue: 'Saved to project.',
  });
  const mirValidationFailedMessageKey = 'autosave.messages.mirValidationFailed';

  const flushSave = useCallback(() => {
    if (!token) return;
    if (!hasPendingChanges) return;
    if (hasWorkspaceTarget && !workspaceCapabilitiesLoaded) return;
    if (isSavingRef.current) return;

    const targetRevision = mirDocRevision;
    const validation = validateMirDocument(mirDoc);
    if (validation.hasError) {
      setSaveTransport(null);
      setSaveStatus('error');
      setSaveMessage(
        t(mirValidationFailedMessageKey, {
          defaultValue: 'MIR validation failed: {{message}}',
          message: validation.issues[0]?.message ?? 'Invalid MIR document.',
        })
      );
      return;
    }

    if (
      workspaceId &&
      activeDocumentId &&
      typeof activeDocumentContentRev === 'number' &&
      activeDocumentContentRev > 0 &&
      canUpdateWorkspaceDocument
    ) {
      const command = createDocumentUpdateCommand(
        workspaceId,
        activeDocumentId
      );
      const requestSeq = saveRequestSeqRef.current + 1;
      saveRequestSeqRef.current = requestSeq;
      isSavingRef.current = true;
      setSaveTransport('workspace');
      setSaveStatus('saving');
      setSaveMessage('');
      editorApi
        .saveWorkspaceDocument(token, workspaceId, activeDocumentId, {
          expectedContentRev: activeDocumentContentRev,
          content: mirDoc,
          command,
        })
        .then((mutation) => {
          if (saveRequestSeqRef.current !== requestSeq) {
            return;
          }
          applyWorkspaceMutation(mutation);
          setLastSavedRevision((previous) =>
            Math.max(previous, targetRevision)
          );
          setSaveStatus('saved');
          setSaveMessage('');
        })
        .catch((error: unknown) => {
          if (saveRequestSeqRef.current !== requestSeq) {
            return;
          }
          setSaveStatus('error');
          setSaveMessage(
            resolveApiErrorMessage(error) || workspaceRetryMessage
          );
        })
        .finally(() => {
          if (saveRequestSeqRef.current === requestSeq) {
            isSavingRef.current = false;
          }
        });
      return;
    }

    if (projectId) {
      const requestSeq = saveRequestSeqRef.current + 1;
      saveRequestSeqRef.current = requestSeq;
      isSavingRef.current = true;
      const fallbackMessage = isWorkspaceSaveDisabled
        ? workspaceUnavailableMessage
        : '';
      setSaveTransport('project');
      setSaveStatus('saving');
      setSaveMessage(fallbackMessage);
      editorApi
        .saveProjectMir(token, projectId, mirDoc)
        .then(() => {
          if (saveRequestSeqRef.current !== requestSeq) {
            return;
          }
          setLastSavedRevision((previous) =>
            Math.max(previous, targetRevision)
          );
          setSaveStatus('saved');
          setSaveMessage(fallbackMessage || projectSavedMessage);
        })
        .catch((error: unknown) => {
          if (saveRequestSeqRef.current !== requestSeq) {
            return;
          }
          setSaveStatus('error');
          setSaveMessage(resolveApiErrorMessage(error) || projectRetryMessage);
        })
        .finally(() => {
          if (saveRequestSeqRef.current === requestSeq) {
            isSavingRef.current = false;
          }
        });
    }
  }, [
    activeDocumentContentRev,
    activeDocumentId,
    applyWorkspaceMutation,
    canUpdateWorkspaceDocument,
    hasPendingChanges,
    hasWorkspaceTarget,
    isWorkspaceSaveDisabled,
    mirDoc,
    mirDocRevision,
    projectId,
    projectRetryMessage,
    projectSavedMessage,
    t,
    token,
    workspaceCapabilitiesLoaded,
    workspaceId,
    workspaceRetryMessage,
    workspaceUnavailableMessage,
  ]);

  useEffect(() => {
    if (autosaveMode !== 'on-change') return;
    if (!hasPendingChanges) return;
    let disposed = false;

    const timeoutId = window.setTimeout(() => {
      if (!disposed) flushSave();
    }, ON_CHANGE_AUTOSAVE_DELAY_MS);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [autosaveMode, flushSave, hasPendingChanges]);

  useEffect(() => {
    if (autosaveMode !== 'interval') return;
    const intervalId = window.setInterval(() => {
      flushSave();
    }, normalizedAutosaveIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [autosaveMode, flushSave, normalizedAutosaveIntervalMs]);

  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const timeoutId = window.setTimeout(() => {
      setSaveStatus('idle');
      setSaveTransport(null);
      setSaveMessage('');
    }, 1500);
    return () => window.clearTimeout(timeoutId);
  }, [saveStatus]);

  return {
    saveStatus,
    saveTransport,
    saveIndicatorTone,
    saveIndicatorLabel,
    isWorkspaceSaveDisabled,
    hasPendingChanges,
    saveNow: flushSave,
  };
};
