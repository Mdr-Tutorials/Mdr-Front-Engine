# Route Manifest 草案

## 文档状态

- Draft
- 日期：2026-02-08
- 关联 ADR：`specs/decisions/08.route-manifest-outlet.md`、`specs/decisions/09.component-route-composition.md`

## 1. 目标

定义编辑器项目中的路由结构、布局链、Outlet 规则与组件路由模块挂载方式。

补充：用户只在 Blueprint 中操作“路由与页面”，不直接操作内部 VFS 文件树。
补充：本规范不包含 NodeGraph/动画编辑器实现，仅定义路由与页面契约。

## 2. 数据结构

```ts
type DocId = string;

type RouteNode = {
  id: string;
  segment?: string; // "product" | ":id" | "*"
  index?: boolean;
  layoutDocId?: DocId;
  pageDocId?: DocId;
  runtime?: RouteRuntime;
  children?: RouteNode[];
};

type RouteManifest = {
  version: "1";
  root: RouteNode;
};

type RouteRuntime = {
  loaderRef?: string;
  actionRef?: string;
  guardRef?: string;
  errorBoundaryDocId?: DocId;
  suspenseDocId?: DocId;
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    noIndex?: boolean;
  };
  experiment?: {
    key: string;
    variantMap?: Record<string, DocId>;
  };
};
```

## 3. 语义规则

1. `index=true` 节点不得声明 `segment`
2. 根节点可无 `segment`
3. 任一节点可声明 `layoutDocId` 或 `pageDocId`，至少一个推荐存在
4. 有 `children` 的节点若声明 `layoutDocId`，其 layout 文档应包含 Outlet
5. 若声明 `runtime.experiment`，`variantMap` 的目标文档必须存在

## 4. Outlet 渲染链

对目标 URL 匹配后得到 `matchChain`（从根到叶）：

1. 先按链装配 layout 组件树
2. 将下一层视图注入上层 Outlet
3. 最终叶子 `pageDocId` 作为内容终点
4. 在渲染前按链路执行 `guardRef` 与 `loaderRef`
5. 运行时错误由最近的 `errorBoundaryDocId` 兜底

示意：

```txt
RootLayout(Outlet)
  -> ProductLayout(Outlet)
      -> ProductDetailPage
```

## 5. 示例

```json
{
  "version": "1",
  "root": {
    "id": "root",
    "layoutDocId": "layout-root",
    "children": [
      { "id": "home", "index": true, "pageDocId": "page-home" },
      {
        "id": "product",
        "segment": "product",
        "layoutDocId": "layout-product",
        "children": [
          { "id": "product-detail", "segment": ":id", "pageDocId": "page-product-detail" }
        ]
      }
    ]
  }
}
```

## 6. 与 VFS 的关系

1. `RouteManifest` 不强制等于目录结构
2. `pageDocId/layoutDocId` 引用 `docsById` 中的文档
3. 文件树调整后仅需修复 doc 引用，不改路由语义

## 7. 组件路由模块挂载

```ts
type RouteModuleMount = {
  mountId: string;
  mountPath: string; // "/account"
  moduleRef: string; // component-route-module-id
};
```

合成规则：

1. 将 `mountPath` 与模块相对路由拼接
2. 检测冲突并在编辑期报错
3. 生成调试映射：`source(module, nodeId) -> finalPath`
4. 参数冲突按“宿主优先、模块重命名别名”规则处理

## 8. 诊断规则（Draft）

1. `OUTLET_MISSING`：有子路由但布局无 Outlet
2. `PATH_CONFLICT`：合成后路径冲突
3. `INVALID_INDEX_ROUTE`：index 与 segment 同时存在
4. `BROKEN_DOC_REF`：路由引用文档不存在
5. `RUNTIME_REF_MISSING`：loader/action/guard 引用不存在
6. `EXPERIMENT_VARIANT_INVALID`：实验变体文档非法
