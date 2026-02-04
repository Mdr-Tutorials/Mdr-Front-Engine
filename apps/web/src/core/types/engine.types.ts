/**
 * MIR 核心类型定义 v1.1
 */

// 1. 定义引用类型 (用于绑定)
export type ParamReference = { $param: string };
export type StateReference = { $state: string };

// 2. 组件节点定义
export interface ComponentNode {
  id: string;
  type: string;
  // text 可以是普通字符串，也可以是状态或参数引用
  text?: string | ParamReference | StateReference;
  // style 的每个值都可以是引用
  style?: Record<string, string | number | ParamReference | StateReference>;
  // props 的每个值也可以是引用
  props?: Record<string, any | ParamReference | StateReference>;
  children?: ComponentNode[];
  events?: Record<
    string,
    {
      trigger: string;
      action?: string; // 关联到 logic.graphs 中的 id
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
