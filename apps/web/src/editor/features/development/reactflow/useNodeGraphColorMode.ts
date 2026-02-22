import { useEffect, useState } from 'react';
import { resolveColorModeFromDocument } from './nodeGraphEditorModel';

export const useNodeGraphColorMode = () => {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() =>
    resolveColorModeFromDocument()
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const syncColorMode = () => {
      setColorMode(resolveColorModeFromDocument());
    };
    syncColorMode();
    const observer = new MutationObserver((mutations) => {
      if (
        mutations.some((mutation) => mutation.attributeName === 'data-theme')
      ) {
        syncColorMode();
      }
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    let mediaQuery: MediaQueryList | undefined;
    const handleMediaChange = () => {
      const explicitTheme = root.getAttribute('data-theme');
      if (explicitTheme === 'light' || explicitTheme === 'dark') return;
      syncColorMode();
    };
    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleMediaChange);
      } else {
        mediaQuery.addListener(handleMediaChange);
      }
    }
    return () => {
      observer.disconnect();
      if (!mediaQuery) return;
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  return colorMode;
};
