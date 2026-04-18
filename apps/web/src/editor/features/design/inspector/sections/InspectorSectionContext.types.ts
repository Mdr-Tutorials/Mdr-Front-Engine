import type { TFunction } from 'i18next';
import type React from 'react';
import type { ComponentNode } from '@/core/types/engine.types';
import type { IconRef } from '@/mir/renderer/iconRegistry';
import type { InspectorUpdateNode, InspectorPanelDefinition } from '@/editor/features/design/inspector/panels/types';
import type { MountedCssEntry } from '@/editor/features/design/inspector/classProtocol/mountedCss';

export type InspectorTab = 'basic' | 'style' | 'data' | 'code';

type ExpandedSectionsState = {
  basic: boolean;
  style: boolean;
  animation: boolean;
  triggers: boolean;
};

export type InspectorCoreContext = {
  t: TFunction;
  projectId?: string;
  selectedNode: ComponentNode | null;
  updateSelectedNode: InspectorUpdateNode;
  expandedSections: ExpandedSectionsState;
  toggleSection: (key: keyof ExpandedSectionsState) => void;
  expandedPanels: Record<string, boolean>;
  togglePanel: (key: string) => void;
};

export type InspectorIdentityContext = {
  draftId: string;
  setDraftId: (value: string) => void;
  applyRename: () => void;
  isDirty: boolean;
  canApply: boolean;
  isDuplicate: boolean;
  allNodeIds: string[];
  primaryTextField: { key: string; value: string } | null;
};

export type InspectorCapabilitiesContext = {
  supportsClassProtocol: boolean;
  classNameValue: string;
  mountedCssEntries: MountedCssEntry[];
  openMountedCssEditor: (target?: {
    path?: string;
    className?: string;
    line?: number;
    column?: number;
  }) => void;
  isIconNode: boolean;
  SelectedIconComponent: React.ComponentType<{ size: number; width: number; height: number }> | null;
  selectedIconRef: IconRef | null;
  setIconPickerOpen: (open: boolean) => void;
  linkPropKey: string | null;
  linkDestination: string;
  linkTarget: '_self' | '_blank';
  linkRel: string;
  linkTitle: string;
  targetPropKey: string;
  relPropKey: string;
  titlePropKey: string;
  routeOptions: Array<{ id: string; path: string }>;
  outletRouteNodeId: string;
  activeRouteNodeId?: string;
  bindOutletToRoute: (
    routeNodeId: string,
    outletNodeId: string | undefined
  ) => void;
  selectedParentNode: ComponentNode | null;
  externalComponentItem: unknown | null;
  dataModelFieldPaths: string[];
};

export type InspectorStyleContext = {
  matchedPanels: InspectorPanelDefinition[];
  hasAnimationDefinition: boolean;
  isAnimationMounted: boolean;
  mountedAnimationBindingCount: number;
  mountSelectedNodeToAnimation: () => void;
  unmountSelectedNodeFromAnimation: () => void;
  openAnimationEditor: () => void;
  canOpenAnimationEditor: boolean;
};

export type InspectorDataContext = {
  dataModelFieldPaths: string[];
};

export type TriggerEntry = {
  key: string;
  trigger: string;
  action?: string;
  params: Record<string, unknown>;
};

export type InspectorCodeContext = {
  addTrigger: () => void;
  updateTrigger: (
    triggerKey: string,
    updater: (event: TriggerEntry) => TriggerEntry
  ) => void;
  removeTrigger: (triggerKey: string) => void;
  hasLinkTriggerConflict: boolean;
  triggerEntries: TriggerEntry[];
  graphOptions: Array<{ id: string; label: string }>;
};

export type InspectorSectionContextValue = InspectorCoreContext &
  InspectorIdentityContext &
  InspectorCapabilitiesContext &
  InspectorStyleContext &
  InspectorDataContext &
  InspectorCodeContext;