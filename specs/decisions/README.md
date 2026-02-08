# Workspace Refactor 决策索引（Draft）

## 目的

为当前编辑器从单 `mirDoc` 迁移到 workspace 架构提供统一决策入口，避免规范分散。

## 核心决策（按主题）

1. **Workspace 与数据模型**
    - `specs/decisions/05.workspace-vfs.md`
    - `specs/workspace/workspace-model.md`
2. **Undo/Redo 与命令协议**
    - `specs/decisions/06.command-history.md`
    - `specs/decisions/12.intent-command-extension.md`
3. **同步与并发控制**
    - `specs/decisions/07.workspace-sync.md`
    - `specs/decisions/11.revision-partitioning.md`
    - `specs/api/workspace-sync.openapi.yaml`
4. **路由体系与模块组合**
    - `specs/decisions/08.route-manifest-outlet.md`
    - `specs/decisions/09.component-route-composition.md`
    - `specs/decisions/13.route-runtime-contract.md`
    - `specs/router/route-manifest.md`
5. **MIR 契约与校验**
    - `specs/decisions/10.mir-contract-validation.md`
    - `specs/decisions/15.mir-data-scope-and-list-render.md`
    - `specs/mir/mir-contract-v1.1.md`
    - `specs/mir/MIR-v1.1.json`
    - `specs/mir/mir-contract-v1.2.md`
    - `specs/mir/MIR-v1.2.json`
6. **插件与安全扩展**
    - `specs/decisions/14.plugin-sandbox-and-capability.md`

## 实施主计划

- `specs/implementation/workspace-refactor-plan.md`
- `specs/implementation/workspace-task-backlog.md`

## 范围边界（必须遵守）

1. 本期不实现 NodeGraph/动画编辑器 UI。
2. 仅预留其协议能力（文档类型、capability、command namespace、错误码）。
3. 用户只操作 Blueprint 可见对象，不暴露 VFS 文件级操作 UI。
4. 目标是移除旧 `mirDoc` 兼容层；当前过渡期允许 capability 控制的回退写入，迁移完成后收敛为 workspace-only。
