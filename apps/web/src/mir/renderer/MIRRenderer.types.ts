import type React from 'react';
import type { ComponentNode } from '@/core/types/engine.types';
import type { ComponentRegistry } from './registry';

export type RenderState = Record<string, unknown>;
export type RenderParams = Record<string, unknown>;

export type ActionContext = {
  state: RenderState;
  setState: React.Dispatch<React.SetStateAction<RenderState>>;
  params: RenderParams;
  event?: React.SyntheticEvent;
  payload?: unknown;
};

export type ActionHandlers = Record<string, (context: ActionContext) => void>;

export type UnsafeRecord = Record<string, unknown>;

export type BuiltInActionDispatchOptions = {
  params?: Record<string, unknown>;
  nodeId: string;
  trigger: string;
  eventKey: string;
  payload?: unknown;
};

export type RenderContext = {
  state: RenderState;
  params: RenderParams;
  data?: unknown;
  item?: unknown;
  index?: number;
  nodesById: Record<string, ComponentNode>;
  dispatchAction: (actionName?: string, payload?: unknown) => void;
  dispatchBuiltInAction: (
    actionName: string,
    options: BuiltInActionDispatchOptions
  ) => boolean;
  onNodeSelect?: (nodeId: string, event: React.SyntheticEvent) => void;
  selectedId?: string;
  requireSelectionForEvents: boolean;
  renderMode: 'strict' | 'tolerant';
  outletContentNode?: ComponentNode | null;
  outletTargetNodeId?: string;
};

export interface MIRRendererProps {
  node?: ComponentNode;
  mirDoc: import('@/core/types/engine.types').MIRDocument;
  overrides?: Record<string, unknown>;
  runtimeState?: Record<string, unknown>;
  actions?: ActionHandlers;
  selectedId?: string;
  onNodeSelect?: (nodeId: string, event: React.SyntheticEvent) => void;
  registry?: ComponentRegistry;
  renderMode?: 'strict' | 'tolerant';
  allowExternalProps?: boolean;
  builtInActions?: Record<
    string,
    (options: BuiltInActionDispatchOptions) => void
  >;
  requireSelectionForEvents?: boolean;
  outletContentNode?: ComponentNode | null;
  outletTargetNodeId?: string;
}
