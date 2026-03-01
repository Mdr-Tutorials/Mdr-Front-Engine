import { useEffect, useRef, useState } from 'react';
import type {
  ExternalLibraryDiagnostic,
  ExternalLibraryRuntimeState,
} from './blueprint/external';
import { externalLibraryConfigUpdatedEvent } from './blueprint/external';
import { isAbortError } from '@/infra/api';

type RetryExternalLibrary = (libraryId: string) => Promise<void>;
type ExternalModule = typeof import('./blueprint/external');

export const useExternalLibraryRuntime = () => {
  const [externalDiagnostics, setExternalDiagnostics] = useState<
    ExternalLibraryDiagnostic[]
  >([]);
  const [externalLibraryStates, setExternalLibraryStates] = useState<
    ExternalLibraryRuntimeState[]
  >([]);
  const [externalLibraryOptions, setExternalLibraryOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [isExternalLibraryLoading, setExternalLibraryLoading] = useState(false);
  const [retryExternalLibrary, setRetryExternalLibrary] = useState<
    RetryExternalLibrary | undefined
  >(undefined);
  const externalModuleRef = useRef<ExternalModule | null>(null);
  const reloadControllerRef = useRef<AbortController | null>(null);
  const configUpdateControllerRef = useRef<AbortController | null>(null);
  const createAbortController = () =>
    typeof AbortController === 'function' ? new AbortController() : null;
  const reloadExternalLibraries = async () => {
    const ensureWithModule = async (mod: ExternalModule) => {
      setExternalLibraryOptions(mod.getConfiguredExternalLibraries());
      reloadControllerRef.current?.abort();
      const controller = createAbortController();
      reloadControllerRef.current = controller;
      try {
        await mod.ensureConfiguredExternalLibraries(
          undefined,
          controller ? { signal: controller.signal } : {}
        );
      } finally {
        if (reloadControllerRef.current === controller) {
          reloadControllerRef.current = null;
        }
      }
    };

    if (externalModuleRef.current) {
      await ensureWithModule(externalModuleRef.current);
      return;
    }

    try {
      const mod = await import('./blueprint/external');
      externalModuleRef.current = mod;
      await ensureWithModule(mod);
    } catch (error) {
      if (isAbortError(error)) return;
      console.warn('[blueprint] failed to reload external runtime', error);
    }
  };

  useEffect(() => {
    let disposed = false;
    const controller = createAbortController();
    let unsubscribeDiagnostics: (() => void) | undefined;
    let unsubscribeLoading: (() => void) | undefined;
    let unsubscribeStates: (() => void) | undefined;

    void import('./blueprint/external')
      .then((mod) => {
        externalModuleRef.current = mod;
        unsubscribeDiagnostics = mod.subscribeExternalLibraryDiagnostics(
          (diagnostics) => {
            if (disposed) return;
            setExternalDiagnostics(diagnostics);
          }
        );
        unsubscribeLoading = mod.subscribeExternalLibraryLoading(
          (isLoading) => {
            if (disposed) return;
            setExternalLibraryLoading(isLoading);
          }
        );
        unsubscribeStates = mod.subscribeExternalLibraryState((states) => {
          if (disposed) return;
          setExternalLibraryStates(states);
        });
        setRetryExternalLibrary(() => async (libraryId: string) => {
          await mod.retryExternalLibraryById(libraryId);
        });
        setExternalLibraryOptions(mod.getConfiguredExternalLibraries());
        setExternalDiagnostics(mod.getExternalLibraryDiagnostics());
        setExternalLibraryLoading(mod.getExternalLibraryLoadingState());
        setExternalLibraryStates(mod.getExternalLibraryStates());
        void mod
          .ensureConfiguredExternalLibraries(
            undefined,
            controller ? { signal: controller.signal } : {}
          )
          .catch((error) => {
            if (isAbortError(error)) return;
            console.warn(
              '[blueprint] failed to preload configured external runtime',
              error
            );
          });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        console.warn('[blueprint] failed to preload external runtime', error);
      });

    return () => {
      disposed = true;
      controller?.abort();
      reloadControllerRef.current?.abort();
      reloadControllerRef.current = null;
      configUpdateControllerRef.current?.abort();
      configUpdateControllerRef.current = null;
      unsubscribeDiagnostics?.();
      unsubscribeLoading?.();
      unsubscribeStates?.();
    };
  }, []);

  useEffect(() => {
    const handleConfigUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ libraryIds?: string[] }>;
      const nextIds = customEvent.detail?.libraryIds ?? [];
      if (externalModuleRef.current) {
        setExternalLibraryOptions(
          externalModuleRef.current.getConfiguredExternalLibraries()
        );
        configUpdateControllerRef.current?.abort();
        const controller = createAbortController();
        configUpdateControllerRef.current = controller;
        void externalModuleRef.current
          .ensureConfiguredExternalLibraries(
            nextIds,
            controller ? { signal: controller.signal } : {}
          )
          .catch((error) => {
            if (isAbortError(error)) return;
            console.warn('[blueprint] failed to sync external runtime', error);
          })
          .finally(() => {
            if (configUpdateControllerRef.current === controller) {
              configUpdateControllerRef.current = null;
            }
          });
        return;
      }
      setExternalLibraryOptions(
        nextIds.map((libraryId) => ({
          id: libraryId,
          label: libraryId,
        }))
      );
    };
    if (typeof window === 'undefined') return;
    window.addEventListener(
      externalLibraryConfigUpdatedEvent,
      handleConfigUpdated
    );
    return () => {
      configUpdateControllerRef.current?.abort();
      configUpdateControllerRef.current = null;
      window.removeEventListener(
        externalLibraryConfigUpdatedEvent,
        handleConfigUpdated
      );
    };
  }, []);

  return {
    externalDiagnostics,
    externalLibraryStates,
    externalLibraryOptions,
    isExternalLibraryLoading,
    reloadExternalLibraries,
    retryExternalLibrary,
  };
};
