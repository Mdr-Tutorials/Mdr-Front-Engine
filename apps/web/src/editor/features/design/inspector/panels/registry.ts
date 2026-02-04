import type { InspectorPanelDefinition } from './types';
import { layoutPanel } from './LayoutPanel';
import { textPanel } from './TextPanel';

export const INSPECTOR_PANELS: InspectorPanelDefinition[] = [
  textPanel,
  layoutPanel,
];
