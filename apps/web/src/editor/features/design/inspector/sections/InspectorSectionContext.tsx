import { createContext, useContext } from 'react';
import type { InspectorSectionContextValue } from './InspectorSectionContext.types';

export const InspectorSectionContext = createContext<InspectorSectionContextValue | null>(null);

export const useInspectorSectionContext = (): InspectorSectionContextValue => {
  const value = useContext(InspectorSectionContext);
  if (!value) {
    throw new Error('InspectorSectionContext is missing');
  }
  return value;
};