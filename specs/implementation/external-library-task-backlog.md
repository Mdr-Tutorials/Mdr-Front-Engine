# 外部组件库执行任务清单（Backlog v0）

## 状态

- In Progress
- 日期：2026-02-17
- 关联：
  - `specs/implementation/external-library-execution-plan.md`
  - `specs/decisions/17.external-library-runtime-and-adapter.md`
  - `specs/codegen/react-production-policy-v1.md`
  - `specs/external/canonical-external-ir-v1.md`
  - `specs/diagnostics/external-library-diagnostic-codes.md`

## 0. 已落地基线（2026-02-17）

- [x] `ELIB-BASE-001` 通用 runtime 主链路已建立（loader/scanner/engine/registry）。
  - 结果：`apps/web/src/editor/features/design/blueprint/external/runtime/*`
- [x] `ELIB-BASE-002` 已实现 `antd` / `mui` profile 与 manifest 注册。
  - 结果：`apps/web/src/editor/features/design/blueprint/external/libraries/*`
- [x] `ELIB-BASE-003` Blueprint 启动阶段已预加载 external libraries。
  - 结果：`apps/web/src/editor/features/design/BlueprintEditor.tsx`
- [x] `ELIB-BASE-004` Palette 创建节点已支持 registry item 的 `runtimeType` 生成。
  - 结果：`apps/web/src/editor/features/design/BlueprintEditor.palette.ts`
- [x] `ELIB-BASE-005` runtime 基础单测已覆盖 scanner/manifest/profileRegistry。
  - 结果：`apps/web/src/editor/features/design/blueprint/external/runtime/__tests__/*`

## 1. 可执行任务（按阶段）

### A. 契约与术语冻结（Gate A）

- [x] `ELIB-001` 冻结 Canonical External IR v1（字段、版本、兼容策略）。
  - 产出：字段清单与版本约束说明
  - 依赖：无
  - 验收：字段命名在 runtime/render/codegen 三侧一致
  - 结果：`specs/external/canonical-external-ir-v1.md`

- [x] `ELIB-002` 冻结 Diagnostics 编码策略与阶段映射。
  - 产出：`ELIB-*` 错误码段定义
  - 依赖：无
  - 验收：新增诊断码必须落在已定义分段
  - 结果：`specs/diagnostics/external-library-diagnostic-codes.md`

- [x] `ELIB-003` 落地 `Codegen Policy` 术语，生成侧不再使用 “generator adapter” 对外命名。
  - 产出：术语规范说明
  - 依赖：无
  - 验收：文档与 PR 描述统一用词
  - 结果：`specs/decisions/17.external-library-runtime-and-adapter.md`、`specs/codegen/react-production-policy-v1.md`

### B. Runtime 内核闭环（Gate B）

- [x] `ELIB-101` Loader 强化：失败重试 + 详细错误上下文。
  - 产出：loader 错误分层与重试策略
  - 依赖：`ELIB-001`、`ELIB-002`
  - 验收：加载失败可见且可重试
  - 结果：`apps/web/src/editor/features/design/blueprint/external/runtime/loader.ts`

- [x] `ELIB-102` Scanner 强化：嵌套导出、误判过滤、include/exclude 边界。
  - 产出：scanner 规则扩展 + 单测
  - 依赖：`ELIB-001`
  - 验收：导出扫描结果稳定可复现
  - 结果：`apps/web/src/editor/features/design/blueprint/external/runtime/scanner.ts`、`apps/web/src/editor/features/design/blueprint/external/runtime/__tests__/scanner.test.ts`

- [x] `ELIB-103` Registry 强化：重复注册覆盖策略与幂等保护。
  - 产出：注册冲突处理逻辑
  - 依赖：`ELIB-101`
  - 验收：重复加载不造成面板组件重复
  - 结果：`apps/web/src/editor/features/design/blueprint/external/runtime/registry.ts`

- [x] `ELIB-104` 诊断可见性：Blueprint 面板显示统一诊断对象。
  - 产出：UI 展示链路
  - 依赖：`ELIB-101`、`ELIB-103`
  - 验收：非 console-only，用户可见错误阶段和建议
  - 结果：`apps/web/src/editor/features/design/blueprint/external/index.ts`、`apps/web/src/editor/features/design/BlueprintEditor.tsx`、`apps/web/src/editor/features/design/BlueprintEditorSidebar.tsx`

### C. Blueprint 交互闭环（Gate C）

- [ ] `ELIB-201` external 分组状态完善（loading/empty/error）。
  - 产出：侧边栏状态 UX
  - 依赖：`ELIB-104`
  - 验收：状态切换可见且文案清晰

- [ ] `ELIB-202` external 节点拖拽与创建链路稳定化。
  - 产出：拖拽->节点创建一致性修复
  - 依赖：`ELIB-103`
  - 验收：节点类型与 defaultProps 不漂移

- [ ] `ELIB-203` Inspector external 属性编辑首批支持。
  - 产出：可编辑属性 schema 映射
  - 依赖：`ELIB-001`
  - 验收：首批属性可编辑并实时渲染

- [ ] `ELIB-204` 保存/恢复一致性验证。
  - 产出：恢复回归用例
  - 依赖：`ELIB-202`
  - 验收：reload 后 external 节点一致

### D. MUI 首批运行时稳定（Gate D）

- [ ] `ELIB-301` 冻结 MUI 首批组件清单（建议 20 个）。
  - 产出：组件清单与优先级
  - 依赖：`ELIB-201`
  - 验收：清单冻结后本期不随意追加

- [ ] `ELIB-302` 完善 MUI manifest 默认 props 与分组覆盖。
  - 产出：manifest 增量规则
  - 依赖：`ELIB-301`
  - 验收：首批组件拖拽后默认可见

- [ ] `ELIB-303` 复杂组件预览安全策略（Dialog/Popover 等）。
  - 产出：portal 安全模式
  - 依赖：`ELIB-302`
  - 验收：编辑器不被外部组件全屏遮挡或锁死

- [ ] `ELIB-304` MUI 运行时专项回归测试。
  - 产出：MUI 运行时测试集
  - 依赖：`ELIB-302`
  - 验收：首批组件渲染回归稳定

### E. 生产级代码生成策略 v1（Gate E）

- [ ] `ELIB-401` 实现 Codegen Policy 核心接口与策略分发。
  - 产出：policy resolver 与最小实现
  - 依赖：`ELIB-003`
  - 验收：生成链路不再依赖运行时对象结构

- [ ] `ELIB-402` MUI 首批组件导出映射（type/import/props）。
  - 产出：MUI policy pack（首批）
  - 依赖：`ELIB-301`、`ELIB-401`
  - 验收：导出后可直接构建

- [ ] `ELIB-403` 导出诊断统一（未知组件、非法 props、不可序列化值）。
  - 产出：Codegen 诊断策略
  - 依赖：`ELIB-002`、`ELIB-401`
  - 验收：生成失败有明确定位和建议

- [ ] `ELIB-404` Golden tests + build smoke（导出产物）。
  - 产出：代码快照与构建冒烟
  - 依赖：`ELIB-402`
  - 验收：生成结果稳定可回归

### F. 质量门与复杂组件强化（Gate F/G）

- [ ] `ELIB-501` E2E：拖拽 -> 保存 -> 导出 -> 构建 全链路。
  - 产出：E2E 测试脚本
  - 依赖：`ELIB-404`
  - 验收：关键链路通过率达标

- [ ] `ELIB-502` 复杂组件策略完善（Form.Item/Dialog/Drawer）。
  - 产出：复杂组件生成与渲染规则
  - 依赖：`ELIB-303`、`ELIB-402`
  - 验收：编辑态与导出态语义一致

- [ ] `ELIB-503` 样式污染治理（禁止默认 reset 接管）。
  - 产出：样式隔离规范与校验
  - 依赖：`ELIB-302`
  - 验收：外部库不破坏全局样式基线

### G. 生态开放与收尾（Gate H）

- [ ] `ELIB-701` 用户注册任意 esm.sh 库最小流程。
  - 产出：library descriptor 配置入口
  - 依赖：`ELIB-104`
  - 验收：新增库接入无需改核心代码

- [ ] `ELIB-702` 发布接入模板（profile/manifest/codegen policy）。
  - 产出：模板文档与示例
  - 依赖：`ELIB-701`
  - 验收：社区可按模板独立接入

- [ ] `ELIB-703` 可观测指标接入（加载/渲染/导出成功率）。
  - 产出：指标定义与采集点
  - 依赖：`ELIB-501`
  - 验收：可通过指标评估接入质量

- [ ] `ELIB-704` ADR 17 验收收口与评审记录。
  - 产出：验收勾选结果 + 风险结论
  - 依赖：`ELIB-702`、`ELIB-703`
  - 验收：ADR 17 达到可关闭条件

## 2. 关键依赖图（简化）

```txt
ELIB-001/002/003 -> ELIB-101/102/103/104
ELIB-104 -> ELIB-201/202/203/204 -> ELIB-301/302/303/304
ELIB-003 -> ELIB-401 -> ELIB-402/403/404
ELIB-404 -> ELIB-501 -> ELIB-502/503 -> ELIB-701/702/703 -> ELIB-704
```

## 3. Ready / Done 标准

### Ready（可开工）

1. 输入/输出字段已冻结并可追踪。
2. 依赖任务状态明确（已完成或可并行）。
3. 验收口径可自动化验证或可复现实测。

### Done（可关闭）

1. 功能链路通过单测或 E2E 覆盖。
2. 文档与诊断同步更新。
3. 不引入协议漂移与跨模块隐式耦合。
