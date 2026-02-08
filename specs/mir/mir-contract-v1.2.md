# MIR Contract v1.2 草案（Data Scope + List Render）

## 文档状态

- Draft
- 日期：2026-02-08
- 关联 ADR：
    - `specs/decisions/10.mir-contract-validation.md`
    - `specs/decisions/15.mir-data-scope-and-list-render.md`

## 1. 目标

在 v1.1 基础上，为“数据驱动渲染”补齐两项能力：

1. 节点级数据模型继承（`data`）
2. 节点级列表模板渲染（`list`）

## 2. 与 v1.1 的差异

新增：

1. 引用类型：`$data`、`$item`、`$index`
2. 节点字段：`ComponentNode.data`
3. 节点字段：`ComponentNode.list`

保留：

1. `ui.root`、`logic.props`、`logic.state`、`logic.graphs`
2. `$param/$state` 原有语义

## 3. 核心结构（Draft）

```ts
type DataReference = { $data: string };
type ItemReference = { $item: string };
type IndexReference = { $index: true };

type ValueOrRef =
    | string
    | number
    | boolean
    | null
    | Record<string, unknown>
    | unknown[]
    | { $param: string }
    | { $state: string }
    | DataReference
    | ItemReference
    | IndexReference;

type NodeDataScope = {
    source?:
        | { $param: string }
        | { $state: string }
        | DataReference
        | ItemReference;
    pick?: string;
    extend?: Record<string, ValueOrRef>;
};

type NodeListRender = {
    source:
        | { $param: string }
        | { $state: string }
        | DataReference
        | ItemReference;
    itemAs?: string; // default: item
    indexAs?: string; // default: index
    keyBy?: string;
    emptyNodeId?: string;
};

type ComponentNodeV12 = {
    id: string;
    type: string;
    text?:
        | string
        | { $param: string }
        | { $state: string }
        | DataReference
        | ItemReference
        | IndexReference;
    style?: Record<string, ValueOrRef>;
    props?: Record<string, ValueOrRef>;
    data?: NodeDataScope;
    list?: NodeListRender;
    events?: Record<
        string,
        {
            trigger: string;
            action?: string;
            params?: Record<string, ValueOrRef>;
        }
    >;
    children?: ComponentNodeV12[];
};
```

## 4. 关键约束

1. `list.source` 必填，且运行时必须解析为数组
2. `itemAs/indexAs` 需满足标识符命名规则
3. `list` 与 `data` 可同时存在，`list` 迭代上下文优先于继承上下文
4. `emptyNodeId` 若声明，必须可解析为同文档节点
5. 非核心扩展字段继续使用 `x-<namespace>` 前缀

## 5. 作用域继承语义

1. 根节点初始 scope 为 `{}`（可由运行时注入）
2. 子节点默认继承父 scope
3. 执行 `data.source` 后替换 scope 根
4. 执行 `data.pick` 后下钻子路径
5. 执行 `data.extend` 后合并派生字段（同名覆盖）

## 6. List 渲染语义

1. `list` 节点视为模板节点
2. 每个数组元素生成一份模板实例
3. 当前项通过 `$item` 读取，索引通过 `$index` 读取
4. 子节点可继续声明 `data` 或嵌套 `list`

## 7. 错误模型（建议）

```json
{
    "error": "invalid_mir",
    "message": "MIR validation failed.",
    "details": [
        {
            "code": "MIR_LIST_SOURCE_NOT_ARRAY",
            "path": "/ui/root/children/0/list/source",
            "message": "list.source must resolve to an array"
        }
    ]
}
```

建议错误码：

1. `MIR_DATA_SOURCE_INVALID`
2. `MIR_DATA_PICK_INVALID`
3. `MIR_LIST_SOURCE_REQUIRED`
4. `MIR_LIST_SOURCE_NOT_ARRAY`
5. `MIR_LIST_ALIAS_INVALID`
6. `MIR_LIST_EMPTY_NODE_NOT_FOUND`

## 8. 落地顺序（建议）

1. 先冻结 `specs/mir/MIR-v1.2.json`
2. 渲染器支持 `data/list` 与新引用
3. Inspector 增加“绑定数据模型/提升为列表”面板
4. 代码生成器支持 list 输出（如 React `.map()`）
5. 校验器与导出链路完成一致性回归
