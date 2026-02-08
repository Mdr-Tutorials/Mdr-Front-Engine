# API-001 评审记录：Workspace 字段冻结

## 状态

- Completed
- 日期：2026-02-08
- 关联任务：`API-001`
- 关联文档：`specs/workspace/workspace-model.md`

## 评审目标

冻结 workspace 并发与文档版本的最小字段集合，避免后续开发期间协议漂移。

## 冻结字段清单（Final for Gate A）

### WorkspaceState

1. `workspaceRev`：工作区结构版本
2. `routeRev`：路由清单版本
3. `opSeq`：全局单调操作序号

### WorkspaceDocument

1. `contentRev`：文档内容版本
2. `metaRev`：文档元信息版本

## 字段职责结论

1. `workspaceRev` 不承载文档内容增量
2. `routeRev` 与路由编辑事务绑定
3. `contentRev/metaRev` 维持文档级分区并发
4. `opSeq` 用于审计与重放顺序锚点

## 变更约束（冻结窗口）

允许：

1. 注释、示例、描述性文本修订
2. 新增可选字段（不改变既有字段语义）

禁止：

1. 删除、重命名冻结字段
2. 修改冻结字段语义
3. 回退为单一 rev 并发模型

## 评审结论

1. 通过：进入 `Draft-Frozen（API-001）`
2. 通过条件：后续任务不得引入破坏性字段变更
3. 追踪动作：若需破坏性变更，必须先提交 ADR 修订并重新 Gate A 评审
