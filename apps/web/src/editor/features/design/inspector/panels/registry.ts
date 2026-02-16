import type { InspectorPanelDefinition } from './types';
import { layoutPanel } from './LayoutPanel';

/**
 * 样式面板注册入口 / Style panel registry entry:
 * - InspectorStyleSection 通过该数组决定渲染哪些 panel。
 */
export const INSPECTOR_PANELS: InspectorPanelDefinition[] = [layoutPanel];
