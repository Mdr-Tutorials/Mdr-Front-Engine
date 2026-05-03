# MIR 中间表示

MIR（Modular Intermediate Representation）是 MdrFrontEngine 的核心创新，它是一种框架无关的组件描述格式，使得"一次设计，多端运行"成为可能。

::: warning 版本说明
本页示例使用当前写入格式：**v1.3 graph** 形态。
`ui.graph = { version, rootId, nodesById, childIdsById }` 是 UI 层唯一保存真相源。

- 权威 Schema：`specs/mir/MIR-v1.3.json`
- 契约说明：`specs/mir/mir-contract-v1.3.md`
- 迁移记录：`specs/implementation/mir-v1.3-graph-patch-migration-plan.md`
- 数据作用域与列表渲染：`specs/decisions/15.mir-data-scope-and-list-render.md`

读取链路对 v1.0 ~ v1.3 向下兼容；写入链路统一输出 v1.3，且 v1.3 文档不保存 `ui.root`。
:::

## 什么是 MIR？

MIR 是一种 JSON 格式的组件描述语言，它抽象了不同前端框架的差异，提供统一的组件表示方式。

```json
{
  "version": "1.3",
  "metadata": {
    "name": "HomePage",
    "description": "应用首页"
  },
  "ui": {
    "graph": {
      "version": 1,
      "rootId": "root",
      "nodesById": {
        "root": {
          "id": "root",
          "type": "div",
          "style": { "padding": 16 }
        },
        "title": {
          "id": "title",
          "type": "MdrText",
          "text": "Hello, MdrFrontEngine!"
        },
        "button": {
          "id": "button",
          "type": "MdrButton",
          "props": {
            "variant": "primary",
            "size": "medium"
          },
          "text": "点击我",
          "events": {
            "click": {
              "trigger": "onClick",
              "action": "navigate",
              "params": { "to": "/about" }
            }
          }
        }
      },
      "childIdsById": {
        "root": ["title", "button"],
        "title": [],
        "button": []
      },
      "order": {
        "strategy": "childIdsById"
      }
    }
  },
  "logic": {
    "props": {
      "title": {
        "type": "string",
        "description": "页面标题",
        "default": "Welcome"
      }
    },
    "state": {
      "count": {
        "type": "number",
        "initial": 0
      }
    }
  }
}
```

## MIR 的设计目标

1. **框架无关** - 不绑定任何特定前端框架
2. **可读性强** - JSON 格式，人机皆可读
3. **类型安全** - TypeScript 类型定义，避免运行时错误
4. **可扩展性** - 支持自定义组件和属性
5. **双向转换** - 支持与各框架代码相互转换

## MIR 文档结构

### 顶层结构

```typescript
interface MIRDocument {
  version: '1.3';
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
    createdAt?: string;
  };
  ui: {
    graph: UiGraph;
  };
  logic?: LogicDefinition;
}

interface UiGraph {
  version: 1;
  rootId: string;
  nodesById: Record<string, ComponentNodeData>;
  childIdsById: Record<string, string[]>;
  regionsById?: Record<string, Record<string, string[]>>;
}
```

### 必需字段

| 字段                    | 类型   | 描述                          |
| ----------------------- | ------ | ----------------------------- |
| `version`               | string | MIR 版本号，v1.3 固定为 `1.3` |
| `ui`                    | object | UI 层容器                     |
| `ui.graph`              | object | 规范化 UI 图                  |
| `ui.graph.rootId`       | string | 根节点 ID                     |
| `ui.graph.nodesById`    | object | 节点身份与节点字段            |
| `ui.graph.childIdsById` | object | 默认 children 区域的有序关系  |

### 可选字段

| 字段       | 类型   | 描述       |
| ---------- | ------ | ---------- |
| `metadata` | object | 元信息     |
| `logic`    | object | 逻辑层定义 |

### 元信息 (metadata)

```json
{
  "metadata": {
    "name": "HomePage",
    "description": "应用首页",
    "author": "MFE Team",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## UI Graph 结构

v1.3 将节点数据与结构顺序拆开：

- `nodesById` 保存每个节点的字段，不表达顺序
- `childIdsById` 保存默认 children 区域的父子顺序
- `regionsById` 可选，用于 slot、layout region、fallback 等具名区域

每个节点数据包含以下字段：

```typescript
interface ComponentNodeData {
  id: string;
  type: string;
  text?: string | ParamReference | StateReference;
  style?: Record<string, string | number | ParamReference | StateReference>;
  props?: Record<string, unknown | ParamReference | StateReference>;
  events?: Record<
    string,
    {
      trigger: string;
      action?: string;
      params?: Record<string, unknown>;
    }
  >;
}
```

### 字段说明

| 字段     | 类型   | 必需 | 描述                                 |
| -------- | ------ | ---- | ------------------------------------ |
| `id`     | string | 是   | 唯一标识符                           |
| `type`   | string | 是   | 组件类型（如 `div`, `MdrButton` 等） |
| `text`   | mixed  | 否   | 文本内容，支持状态/参数引用          |
| `style`  | object | 否   | 内联样式                             |
| `props`  | object | 否   | 组件属性                             |
| `events` | object | 否   | 事件处理定义                         |

子节点不写在节点内部，而是写入 `childIdsById`：

```json
{
  "rootId": "page",
  "nodesById": {
    "page": { "id": "page", "type": "main" },
    "header": { "id": "header", "type": "header" },
    "content": { "id": "content", "type": "section" }
  },
  "childIdsById": {
    "page": ["header", "content"],
    "header": [],
    "content": []
  }
}
```

### 数据引用

MIR 支持两种数据引用方式：

```typescript
// 参数引用
type ParamReference = { $param: string };

// 状态引用
type StateReference = { $state: string };
```

**示例**：

```json
{
  "id": "greeting",
  "type": "MdrText",
  "text": { "$state": "userName" },
  "props": {
    "title": { "$param": "pageTitle" }
  }
}
```

## 逻辑层定义

逻辑层定义组件的行为和数据：

```typescript
interface LogicDefinition {
  props?: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array' | string;
      description?: string;
      default?: unknown;
    }
  >;
  state?: Record<
    string,
    {
      type?: string;
      initial: unknown;
    }
  >;
  graphs?: unknown[];
}
```

### Props 定义

定义组件对外暴露的属性：

```json
{
  "logic": {
    "props": {
      "title": {
        "type": "string",
        "description": "页面标题",
        "default": "Welcome"
      },
      "items": {
        "type": "array",
        "description": "数据列表"
      }
    }
  }
}
```

### State 定义

定义组件内部状态：

```json
{
  "logic": {
    "state": {
      "count": {
        "type": "number",
        "initial": 0
      },
      "isLoading": {
        "type": "boolean",
        "initial": false
      },
      "user": {
        "type": "object",
        "initial": null
      }
    }
  }
}
```

## 事件系统

MIR 支持内置动作和自定义事件处理。

### 内置动作

| 动作           | 描述       | 参数                                |
| -------------- | ---------- | ----------------------------------- |
| `navigate`     | 页面导航   | `to`, `target`, `replace`, `state`  |
| `executeGraph` | 执行节点图 | `graphMode`, `graphName`, `graphId` |

### 事件定义

```json
{
  "version": 1,
  "rootId": "root",
  "nodesById": {
    "root": {
      "id": "root",
      "type": "div"
    },
    "button": {
      "id": "button",
      "type": "MdrButton",
      "events": {
        "click": {
          "trigger": "onClick",
          "action": "navigate",
          "params": {
            "to": "/about",
            "target": "_self"
          }
        }
      }
    }
  },
  "childIdsById": {
    "root": ["button"],
    "button": []
  }
}
```

### DOM 事件触发器

支持的标准 DOM 事件：

| 触发器          | 说明     |
| --------------- | -------- |
| `onClick`       | 点击     |
| `onDoubleClick` | 双击     |
| `onMouseEnter`  | 鼠标进入 |
| `onMouseLeave`  | 鼠标离开 |
| `onFocus`       | 获得焦点 |
| `onBlur`        | 失去焦点 |
| `onChange`      | 值变化   |
| `onInput`       | 输入     |
| `onSubmit`      | 表单提交 |
| `onKeyDown`     | 按键按下 |
| `onKeyUp`       | 按键抬起 |

## 代码生成

MIR 可以转换为多种框架代码。当前主要支持 React 代码生成。

### React (JSX)

```jsx
// 从 MIR 生成的 React 代码
import React from 'react';

interface HomePageProps {
  title?: string;
}

export default function HomePage({ title = "Welcome" }: HomePageProps) {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: 16 }}>
      <span>Hello, MdrFrontEngine!</span>
      <button
        variant="primary"
        size="medium"
        onClick={() => { window.location.assign('/about'); }}
      >
        点击我
      </button>
    </div>
  );
}
```

### 代码生成流程

```
MIR Document → Canonical IR → React Component Code
```

1. **解析 MIR** - 将 JSON 解析为内部表示
2. **构建 IR** - 转换为规范的中间表示
3. **代码生成** - 根据目标框架生成代码
4. **依赖解析** - 自动解析和声明依赖包

## 最佳实践

### 1. 使用有意义的 ID

```json
{
  "nodesById": {
    "hero-title": { "id": "hero-title", "type": "MdrText" },
    "node-123": { "id": "node-123", "type": "MdrText" }
  }
}
```

优先选择 `hero-title` 这样的语义化 ID，避免 `node-123` 这类难以理解的自动编号。

### 2. 保持结构清晰

```json
{
  "rootId": "page",
  "nodesById": {
    "page": { "id": "page", "type": "div" },
    "header": { "id": "header", "type": "header" },
    "main": { "id": "main", "type": "main" },
    "footer": { "id": "footer", "type": "footer" }
  },
  "childIdsById": {
    "page": ["header", "main", "footer"],
    "header": [],
    "main": [],
    "footer": []
  }
}
```

v1.3 通过 `childIdsById` 表达顺序。编辑器、同步、Undo/Redo 和 AI patch 都应修改 `ui.graph`，需要树形结构时再临时 materialize。

### 3. 合理使用状态

- 将 UI 状态（如 loading、isOpen）与业务状态分开
- 使用有意义的初始值
- 避免冗余状态

### 4. 事件处理

- 优先使用内置动作（navigate、executeGraph）
- 为复杂逻辑使用节点图
- 保持事件参数简洁

## 下一步

- [组件系统](/guide/components) - 深入了解组件设计
- [蓝图编辑器](/guide/blueprint-editor) - 可视化编辑 MIR
- [代码导出](/guide/export) - 导出为框架代码
