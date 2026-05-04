# Code Diagnostics 编码规范（COD）

## 状态

- Draft
- 日期：2026-05-04
- 关联：
  - `specs/diagnostics/README.md`
  - `specs/decisions/25.authoring-symbol-environment.md`
  - `specs/decisions/21.inspector-panel-architecture.md`
  - `specs/decisions/20.node-graph-port-semantics.md`
  - `specs/mir/mir-contract-v1.3.md`

## 1. 范围

`COD-xxxx` 覆盖用户在 MFE 中编写、挂载、引用和执行的代码片段，以及这些代码片段依赖的共享符号环境。

包括：

1. Code Editor 中的 TypeScript、JavaScript、CSS、SCSS、GLSL、WGSL 和表达式片段。
2. Blueprint 中的事件代码、Mounted CSS、绑定表达式和节点级代码挂载。
3. NodeGraph 暴露给代码环境的 graph input、graph output、函数节点、变量节点和端口类型。
4. Animation 中的表达式、filter、track value 和 keyframe 计算逻辑。
5. Route、MIR、Workspace、External Library 等来源注入到代码环境中的共享符号。

不覆盖：

1. MIR 保存态 graph、ValueRef 与 materialize 契约，使用 `MIR-xxxx`。
2. Inspector 写入、拖拽、选择和编辑器交互，使用 `EDT-xxxx`。
3. NodeGraph 结构、端口连线和执行计划本身，使用 `NGR-xxxx`。
4. Animation timeline、binding、track 和 keyframe 结构本身，使用 `ANI-xxxx`。
5. 目标框架项目代码生成和导出产物，使用 `GEN-xxxx`。
6. MFE 自身前端应用崩溃。后续如需稳定分类，应新增独立应用运行时域。

## 2. 阶段

```ts
type CodeDiagnosticStage =
  | 'parse'
  | 'symbol'
  | 'binding'
  | 'runtime'
  | 'compile'
  | 'environment';
```

## 3. 编码分段

| 段位       | 阶段          | 说明                                          |
| ---------- | ------------- | --------------------------------------------- |
| `COD-10xx` | `parse`       | 源码解析、语言模式、片段形状                  |
| `COD-20xx` | `symbol`      | 符号解析、类型、import、共享环境 revision     |
| `COD-30xx` | `binding`     | 代码片段与 Blueprint/NodeGraph/Animation 契约 |
| `COD-40xx` | `runtime`     | 用户代码运行时、sandbox、worker、执行权限     |
| `COD-50xx` | `compile`     | 转译、编译、shader compile、语言服务产物      |
| `COD-90xx` | `environment` | 代码环境未知异常                              |

## 4. 已占用码位

### `COD-1001` 代码解析失败

- Severity: `error`
- Stage: `parse`
- Retryable: false
- Trigger: 用户代码片段无法被当前语言 parser 解析，例如 TypeScript、JavaScript、CSS、GLSL、WGSL 或表达式语法错误
- User action: 根据 Code Editor 中的行列提示修正语法错误
- Developer notes: 诊断应尽量包含 `sourceSpan`、`artifactId` 和语言模式；UI 主落点是 Code Editor inline diagnostic

### `COD-1002` 不支持的语言模式

- Severity: `error`
- Stage: `parse`
- Retryable: false
- Trigger: 代码片段声明的 language 不在当前 Authoring Environment 支持列表中
- User action: 切换为当前功能支持的代码语言，或移除该代码片段
- Developer notes: Inspector、Code Editor 和导入器必须共享语言模式枚举，避免出现无法编辑但可保存的片段

### `COD-2001` 符号无法解析

- Severity: `warning`
- Stage: `symbol`
- Retryable: true
- Trigger: 代码片段引用的变量、节点、route param、graph output、data scope 或外部导出无法在当前作用域中解析
- User action: 检查引用名称、当前节点作用域、数据源、路由参数或节点图输出
- Developer notes: 诊断应包含 `symbolName`、`scopeId` 和可选 `targetRef`；同一语义不要折叠到 `MIR-3001`

### `COD-2002` import 无法解析

- Severity: `error`
- Stage: `symbol`
- Retryable: true
- Trigger: 代码片段中的 import specifier 无法映射到 workspace 文档、外部库、esm.sh 依赖或内置模块
- User action: 检查依赖是否已安装、外部库是否已注册，或改用可用的导入路径
- Developer notes: 依赖解析属于作者环境时使用该码；导出目标项目解析失败时使用 `GEN-3001`

### `COD-2003` 类型不兼容

- Severity: `warning`
- Stage: `symbol`
- Retryable: false
- Trigger: 代码片段的表达式、返回值、赋值或调用参数不满足当前符号或宿主字段的类型约束
- User action: 调整表达式类型、返回值或宿主字段配置
- Developer notes: TypeScript language service、NodeGraph 端口类型和 Inspector 字段 schema 应尽量共享类型诊断语义

### `COD-2004` 共享符号环境过期

- Severity: `warning`
- Stage: `symbol`
- Retryable: true
- Trigger: 当前代码诊断基于过期的 Authoring Environment revision，可能不反映最新 Blueprint、NodeGraph、Animation 或 Workspace 状态
- User action: 等待编辑器重新索引，或手动刷新当前项目上下文
- Developer notes: 该诊断用于索引延迟和 worker 同步状态，不应阻断保存；稳定后应自动消失

### `COD-3001` 代码片段绑定目标不存在

- Severity: `error`
- Stage: `binding`
- Retryable: false
- Trigger: 代码片段 owner 指向的 MIR 节点、Inspector 字段、NodeGraph 节点、Animation track 或其他宿主对象已不存在
- User action: 重新选择代码挂载目标，或删除失效代码片段
- Developer notes: 删除宿主对象时应清理相关 `CodeArtifact`；无法清理时必须保留可定位诊断

### `COD-3002` 代码片段返回值不满足宿主契约

- Severity: `error`
- Stage: `binding`
- Retryable: false
- Trigger: 事件处理、表达式、computed value、shader entry 或动画计算片段的返回值不满足宿主协议
- User action: 按当前字段、事件、节点端口或动画 track 要求调整返回值
- Developer notes: 诊断应包含宿主期望类型或能力名；Code Editor 和 Inspector 可同时展示同一诊断

### `COD-3003` 代码访问了当前上下文不可用的能力

- Severity: `warning`
- Stage: `binding`
- Retryable: false
- Trigger: 代码片段访问了当前 sandbox、运行目标、导出目标或宿主对象未声明支持的 capability
- User action: 移除不可用 API，或切换到支持该能力的运行目标
- Developer notes: capability 来源应来自 Authoring Environment，不允许各编辑器硬编码互相冲突的规则

### `COD-4001` 用户代码运行时抛错

- Severity: `error`
- Stage: `runtime`
- Retryable: true
- Trigger: 用户代码片段在预览、调试、表达式求值、worker 或 sandbox 中执行时抛出异常或返回失败状态
- User action: 查看代码位置、输入上下文和运行时错误摘要后修复代码
- Developer notes: 原始 stack 只进入开发调试详情；普通用户 UI 应展示 code、sourceSpan、artifactId 和受控摘要

### `COD-5001` 转译失败

- Severity: `error`
- Stage: `compile`
- Retryable: true
- Trigger: 用户代码片段在 TypeScript、JavaScript、CSS、SCSS 或表达式转译阶段失败
- User action: 修复代码语法、类型或不支持的语言特性后重试
- Developer notes: 作者态转译失败使用该码；目标项目代码发射失败使用 `GEN-4001`

### `COD-5002` Shader 编译失败

- Severity: `error`
- Stage: `compile`
- Retryable: false
- Trigger: GLSL 或 WGSL 代码片段无法通过 shader compiler 校验或编译
- User action: 根据 shader 编译日志修正入口函数、类型、uniform、binding 或语法
- Developer notes: 编译日志需脱敏和裁剪；UI 主落点是 Code Editor inline diagnostic 和 Preview 受控错误提示

### `COD-9001` 代码环境未知异常

- Severity: `error`
- Stage: `environment`
- Retryable: true
- Trigger: 代码解析、符号索引、语言服务、sandbox 或编译链路出现未分类异常
- User action: 重试操作；若复现，携带错误码、代码片段位置和项目上下文上报
- Developer notes: 新增稳定复现场景后应分配更具体的码位

## 5. 预留码位

1. `COD-2010`：重命名符号存在冲突。
2. `COD-2011`：循环 import 或循环符号依赖。
3. `COD-3010`：事件 handler 参数签名不匹配。
4. `COD-3011`：Mounted CSS selector 超出节点作用域。
5. `COD-4010`：用户代码执行超时。
6. `COD-4011`：sandbox 权限拒绝。
7. `COD-5010`：语言服务 worker 初始化失败。
