import { useEffect, useRef } from 'react';

type UseWindowKeydownOptions = {
  enabled?: boolean;
};

/**
 * Registers a stable `window.keydown` listener for the current component scope.
 */
export const useWindowKeydown = (
  handler: (event: KeyboardEvent) => void,
  options: UseWindowKeydownOptions = {}
) => {
  const { enabled = true } = options;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      handlerRef.current(event);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
};
