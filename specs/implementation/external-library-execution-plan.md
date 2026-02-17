# 外部组件库接入实施计划（External Library Program）

## 状态

- In Progress
- 日期：2026-02-17
- 关联：
  - `specs/decisions/17.external-library-runtime-and-adapter.md`
  - `specs/implementation/external-library-task-backlog.md`
  - `specs/codegen/react-production-policy-v1.md`
  - `specs/external/canonical-external-ir-v1.md`
  - `specs/diagnostics/external-library-diagnostic-codes.md`

## 当前基线（2026-02-17）

1. 已具备通用运行时链路：`LibraryDescriptor -> Loader -> Scanner -> Canonical IR -> Registry`。
2. 已接入 `antd` 与 `mui` profile + manifest，并支持 external 组件分组注册。
3. Blueprint 已在启动阶段预加载 external runtime，侧边栏已支持 external 视图过滤。
4. Palette 拖拽创建已支持 `runtimeType + defaultProps` 的注册项生成。
5. 外部 runtime 已有基础单测：`scanner/manifest/profileRegistry`。

## 0. 目标与边界

### 0.1 阶段目标

1. 在 Blueprint 中稳定拖拽 MUI 组件并渲染成功（首批组件）。
2. 导出 React 代码达到生产级标准：可读、可维护、可构建、可回归。
3. 将 ADR 17 从“概念 Draft”推进到“可评审执行态”。

### 0.2 里程碑日期（当前估算）

1. **2026-02-26**：完成 MUI 首批组件拖拽渲染闭环（蓝图侧）。
2. **2026-02-28**：完成 MUI 首批组件生产级代码生成（导出可运行）。
3. **2026-03-06**：复杂组件策略（Dialog/Form/Portal）生产强化完成。
4. **2026-03-12**：生态化与文档收口，ADR 17 进入验收评审。

### 0.4 Phase 0 落地进展（2026-02-17）

1. 已落地 `ELIB-001`：`specs/external/canonical-external-ir-v1.md`。
2. 已落地 `ELIB-002`：`specs/diagnostics/external-library-diagnostic-codes.md`。
3. 已落地 `ELIB-003`：术语收敛到 Render Policy / Codegen Policy（见 ADR 17 与 Codegen Policy v1）。

### 0.5 Phase 1 落地进展（2026-02-17）

1. 已落地 `ELIB-101`：Loader 补齐失败上下文与 import map 冲突诊断。
2. 已落地 `ELIB-102`：Scanner 补齐 include/exclude 边界与嵌套过滤规则。
3. 已落地 `ELIB-103`：Runtime 注册链路增加重复 `runtimeType` 去重与诊断。
4. 已落地 `ELIB-104`：Blueprint external 视图增加诊断可见面板（非 console-only）。

### 0.3 范围边界

1. 本计划只覆盖 Blueprint 外部组件库接入与 React 导出链路。
2. 不实现 NodeGraph/动画编辑器功能，仅保持协议兼容。
3. 不在本阶段完成供应链审计、许可证扫描与安全基线治理。
4. 不承诺一次性覆盖所有第三方库高级交互细节。

## 1. 里程碑与 Gate

1. `M0 / Gate A`：契约与术语冻结
2. `M1 / Gate B`：运行时内核闭环
3. `M2 / Gate C`：Blueprint 交互闭环
4. `M3 / Gate D`：MUI 运行时首批稳定
5. `M4 / Gate E`：生产级代码生成策略 v1
6. `M5 / Gate F`：端到端质量门
7. `M6 / Gate G`：复杂组件生产强化
8. `M7 / Gate H`：生态开放与收尾

## 2. 全阶段执行草案

### Phase 0 / Gate A：契约与术语冻结（2026-02-18 ~ 2026-02-19）

目标：冻结执行语言与验收口径，防止研发期反复改语义。

任务：

1. `ELIB-001` 冻结 Canonical External IR v1 字段最小集与版本策略。
2. `ELIB-002` 冻结 Diagnostics 编码分段规则（`ELIB-10xx/20xx/30xx/40xx/50xx`）。
3. `ELIB-003` 冻结“Render Policy / Codegen Policy”术语，生成侧不再使用 “generator adapter” 对外命名。
4. `ELIB-004` 完成 `react-production-policy-v1` 规范草案并评审。
5. `ELIB-005` 建立本实施计划与任务清单，统一任务编号与依赖关系。

输出：

- `specs/codegen/react-production-policy-v1.md`
- `specs/implementation/external-library-task-backlog.md`
- ADR 17 的执行链接与术语修订说明

验收：

- [ ] 术语在文档、代码注释、评审单中保持一致。
- [ ] 新增任务均可映射到 ELIB 编号并具备可验收输出。

---

### Phase 1 / Gate B：运行时内核闭环（2026-02-19 ~ 2026-02-22）

目标：实现“可加载、可扫描、可注册、可诊断”的稳定内核。

任务：

1. `ELIB-101` 强化 Loader 失败重试与错误上下文聚合。
2. `ELIB-102` 统一 Import Map 注入行为（幂等、冲突检测、桥接版本约束）。
3. `ELIB-103` 扫描器补齐边界：嵌套导出、命名导出冲突、误判过滤。
4. `ELIB-104` 注册链路增加去重与覆盖策略，避免重复注册污染 Palette。
5. `ELIB-105` 运行时阶段诊断结构透传到 Blueprint 可见区域（非 console-only）。
6. `ELIB-106` 增加 runtime 关键单测（loader/engine/registry 失败分支）。

输出：

- Runtime 内核稳定版（含错误可见性）
- 运行时测试集扩展

验收：

- [ ] 任一加载失败都能在 UI 中看到阶段、错误码、修复建议。
- [ ] 多次进入 Blueprint 不出现重复注册或分组膨胀。

---

### Phase 2 / Gate C：Blueprint 交互闭环（2026-02-21 ~ 2026-02-24）

目标：用户可以在蓝图内完成 external 组件发现、拖拽、编辑、保存。

任务：

1. `ELIB-201` external 分组支持空态、加载中态、失败态反馈。
2. `ELIB-202` 拖拽创建链路统一使用注册表项（`runtimeType/defaultProps`）。
3. `ELIB-203` Inspector 支持 external 节点首批属性编辑（文本/枚举/布尔）。
4. `ELIB-204` 保存/恢复流程校验：二次打开项目后节点语义不漂移。
5. `ELIB-205` 补齐外部组件拖拽与画布渲染的 E2E 冒烟脚本。

输出：

- Blueprint external 可用链路（用户可操作）
- 基础 E2E 冒烟

验收：

- [ ] external 组件拖拽后组件树与画布同源显示。
- [ ] 节点保存后 reload 不丢失 `runtimeType` 与关键 props。

---

### Phase 3 / Gate D：MUI 运行时首批稳定（2026-02-23 ~ 2026-02-26）

目标：MUI 从“可接入”提升到“可稳定使用（首批组件）”。

任务：

1. `ELIB-301` 确认首批组件清单（建议 20 个）：`Button/TextField/Dialog/Card/Box/Stack/Grid/...`。
2. `ELIB-302` 完善 MUI manifest 默认 props 与 group 映射，减少画布异常态。
3. `ELIB-303` Portal 类组件（Dialog/Popover）在 Blueprint 预览的安全渲染策略。
4. `ELIB-304` 上下文依赖组件最小兜底（Provider 缺失时降级提示）。
5. `ELIB-305` MUI 首批组件运行时回归测试（快照 + 行为断言）。

输出：

- MUI 首批稳定渲染集合
- 复杂组件安全预览策略

验收：

- [ ] 2026-02-26 前可在 Blueprint 稳定拖拽 MUI 首批组件。
- [ ] 复杂组件不因 portal/context 问题导致编辑器级崩溃。

---

### Phase 4 / Gate E：生产级代码生成策略 v1（2026-02-24 ~ 2026-02-28）

目标：导出代码向生产级靠齐，避免运行时快照式产物。

任务：

1. `ELIB-401` 落地 Codegen Policy 核心接口（非运行时 hack）。
2. `ELIB-402` 完成 MUI 首批组件 `type -> import -> JSX props` 映射规则。
3. `ELIB-403` 完善导出页策略选择与版本解析（workspace/esm.sh）。
4. `ELIB-404` 诊断收敛：未知组件、非法 props、不可序列化值生成标准错误。
5. `ELIB-405` 建立 golden tests，保障导出代码稳定性与可读性。

输出：

- React Production Codegen Policy v1 实现
- MUI 首批组件导出能力

验收：

- [ ] 2026-02-28 前导出 MUI 首批组件项目可安装并构建通过。
- [ ] 产物 import 稳定、组件名可读、核心 props 无语义漂移。

---

### Phase 5 / Gate F：端到端质量门（2026-02-27 ~ 2026-03-02）

目标：验证“拖拽 -> 保存 -> 导出 -> 构建”完整链路的可靠性。

任务：

1. `ELIB-501` 建立 E2E 场景：拖拽 MUI 组件 -> 保存 -> 导出 -> `pnpm build`。
2. `ELIB-502` 增加回归测试矩阵：诊断展示、节点恢复、导出稳定性。
3. `ELIB-503` 加入错误注入测试：网络失败、模块缺失、扫描空结果、导出失败。
4. `ELIB-504` 建立质量阈值：P0 崩溃为 0，P1 阻断缺陷可复现并可定位。

输出：

- E2E 回归脚本与基线报告

验收：

- [ ] 关键链路自动化通过率达到预设阈值。
- [ ] 所有阻断级错误均具备可见诊断与修复提示。

---

### Phase 6 / Gate G：复杂组件生产强化（2026-03-03 ~ 2026-03-06）

目标：处理生产项目最容易踩坑的复杂语义。

任务：

1. `ELIB-601` Form 相关组件（`Form.Item` 等）补齐受控/非受控与 name/path 规则。
2. `ELIB-602` Dialog/Modal/Drawer 统一 portal/容器策略，导出代码行为可预期。
3. `ELIB-603` 样式污染治理：默认禁止全局 reset 自动接管。
4. `ELIB-604` 生成侧高风险规则专项测试（事件、slot、嵌套 children）。

输出：

- 复杂组件策略包（Render + Codegen）
- 复杂语义专项测试集

验收：

- [ ] 复杂组件在编辑态与导出态语义一致，不出现“画布可用、导出失真”。
- [ ] 全局样式污染问题可被约束或显式告警。

---

### Phase 7 / Gate H：生态开放与收尾（2026-03-07 ~ 2026-03-12）

目标：将内建能力抽象为可复用接入模板，完成文档与验收收口。

任务：

1. `ELIB-701` 提供“用户注册任意 esm.sh 库”最小流程与持久化规范。
2. `ELIB-702` 发布 profile/manifest 模板（官方样板 + 社区样板）。
3. `ELIB-703` 建立可观测指标：加载成功率、渲染成功率、导出成功率。
4. `ELIB-704` 完成 ADR 17 验收项打勾与评审记录。

输出：

- 生态接入模板与使用文档
- ADR 17 验收评审材料

验收：

- [ ] 新库接入不需要改动编辑器核心模块。
- [ ] ADR 17 进入可关闭状态或转为 Accepted 候选。

## 3. 关键依赖（简化）

```txt
ELIB-001/002/003/004 -> ELIB-101..106 -> ELIB-201..205
ELIB-201..205 -> ELIB-301..305 -> ELIB-401..405
ELIB-401..405 -> ELIB-501..504 -> ELIB-601..604 -> ELIB-701..704
```

## 4. 风险与止损规则

1. 术语反复变更（Codegen Policy/Render Policy）导致实现漂移：立即冻结评审，暂停新增功能。
2. MUI 首批组件清单频繁变化导致进度失真：以 Gate D 冻结清单为准，新增组件进入下一迭代。
3. 导出代码不可构建或构建不稳定：Gate E 不通过，禁止进入后续生态开放阶段。
4. 诊断仍不可见（仅日志）：Gate B/Gate C 不通过，必须先补 UI 可见反馈。

## 5. 执行节奏（建议）

1. 周初：锁定当周 Gate 与 ELIB 任务，冻结变更范围。
2. 周中：开发 + 单测 + 冒烟；阻断项当天回归，不带病进入下一阶段。
3. 周末：Gate Review，逐项验证“输出物 + 验收清单”。

## 6. Definition of Done（本计划）

1. 蓝图中可稳定拖拽 MUI 首批组件并完成保存/恢复。
2. 导出 React 代码达到生产级标准并可构建通过。
3. 诊断链路全程可见、可定位、可重试。
4. 新库可按模板接入，核心链路无需侵入式改造。
