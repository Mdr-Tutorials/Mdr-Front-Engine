/**
 * MIR 核心类型定义 v1.2
 */

export type ParamReference = { $param: string };
export type StateReference = { $state: string };
export type DataReference = { $data: string };
export type ItemReference = { $item: string };
export type IndexReference = { $index: true };
export type ScopeSourceReference =
  | ParamReference
  | StateReference
  | DataReference
  | ItemReference;

export type ValueOrRef =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[]
  | ParamReference
  | StateReference
  | DataReference
  | ItemReference
  | IndexReference;

export type NodeDataScope = {
  source?: ScopeSourceReference;
  pick?: string;
  value?: ValueOrRef;
  mock?: ValueOrRef;
  extend?: Record<string, ValueOrRef>;
};

export type NodeListRender = {
  source?: ScopeSourceReference;
  arrayField?: string;
  itemAs?: string;
  indexAs?: string;
  keyBy?: string;
  emptyNodeId?: string;
};

export interface ComponentNode {
  id: string;
  type: string;
  text?: ValueOrRef;
  style?: Record<string, ValueOrRef>;
  props?: Record<string, ValueOrRef>;
  data?: NodeDataScope;
  list?: NodeListRender;
  children?: ComponentNode[];
  events?: Record<
    string,
    {
      trigger: string;
      action?: string;
      params?: Record<string, ValueOrRef>;
    }
  >;
}

// 3. 逻辑层定义 (State & Props)
export interface LogicDefinition {
  props?: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array' | string;
      description?: string;
      default?: any;
    }
  >;

  // 组件内部状态
  state?: Record<
    string,
    {
      type?: string;
      initial: any;
    }
  >;

  // 节点图逻辑
  graphs?: any[];
}

// 4. 根文档结构
export interface MIRDocument {
  version: string;
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
    createdAt?: string;
  };
  ui: {
    root: ComponentNode;
  };
  logic?: LogicDefinition; // 👈 挂载逻辑定义
}
