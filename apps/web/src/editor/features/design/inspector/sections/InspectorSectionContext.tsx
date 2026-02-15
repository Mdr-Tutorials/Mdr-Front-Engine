import { createContext, useContext } from 'react';

export const InspectorSectionContext = createContext<any>(null);

export const useInspectorSectionContext = () => {
  const value = useContext(InspectorSectionContext);
  if (!value) {
    throw new Error('InspectorSectionContext is missing');
  }
  return value;
};
