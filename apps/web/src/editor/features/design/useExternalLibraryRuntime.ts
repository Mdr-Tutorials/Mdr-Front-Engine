import { useEffect, useRef, useState } from 'react';
import type {
  ExternalLibraryDiagnostic,
  ExternalLibraryRuntimeState,
} from './blueprint/external';
import { externalLibraryConfigUpdatedEvent } from './blueprint/external';

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

  useEffect(() => {
    let disposed = false;
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
        setRetryExternalLibrary(() => mod.retryExternalLibraryById);
        setExternalLibraryOptions(mod.getConfiguredExternalLibraries());
        setExternalDiagnostics(mod.getExternalLibraryDiagnostics());
        setExternalLibraryLoading(mod.getExternalLibraryLoadingState());
        setExternalLibraryStates(mod.getExternalLibraryStates());
        void mod.ensureConfiguredExternalLibraries();
      })
      .catch((error) => {
        console.warn('[blueprint] failed to preload external runtime', error);
      });

    return () => {
      disposed = true;
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
        void externalModuleRef.current.ensureConfiguredExternalLibraries(
          nextIds
        );
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
    retryExternalLibrary,
  };
};
