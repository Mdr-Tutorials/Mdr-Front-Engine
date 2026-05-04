# 错误码索引

MdrFrontEngine 使用稳定错误码帮助定位问题。每个错误码都对应独立说明页，用于快速理解含义、确认触发条件，并找到建议处理方式。

## 如何使用

1. 在界面或响应中找到稳定错误码，例如 `WKS-4003`。
2. 打开对应的错误码页面，先看严重程度、阶段和触发条件。
3. 按建议操作修复。若需要上报，使用下方模板。

## 上报模板

```txt
错误码
requestId
操作时间
当前项目或工作区
复现步骤
错误截图或日志摘要
```

不要上报 API key、Token、完整 Prompt 或其他敏感内容。

## 编码域

| 前缀        | 范围     | 说明                                                     |
| ----------- | -------- | -------------------------------------------------------- |
| `MIR-xxxx`  | MIR 文档 | 文档形状、UI graph、ValueRef、materialize 和运行前校验   |
| `WKS-xxxx`  | 工作区   | 工作区加载、文档保存、同步冲突、capability 和 patch 应用 |
| `EDT-xxxx`  | 编辑器   | 选择、拖拽、Inspector、画布、命令和 autosave             |
| `COD-xxxx`  | 用户代码 | 代码片段、符号解析、类型、宿主绑定、运行时和转译编译     |
| `ELIB-xxxx` | 外部库   | 外部库加载、扫描、注册、渲染和代码生成                   |
| `GEN-xxxx`  | 代码生成 | Canonical IR、adapter、依赖解析、代码发射和导出产物      |
| `API-xxxx`  | 后端/API | 请求、鉴权、权限、业务校验、持久化和第三方集成           |
| `AI-xxxx`   | AI 助手  | Provider、模型发现、Prompt、响应解析和 AI command        |
| `RTE-xxxx`  | 路由     | 路由清单、匹配、Outlet、导航和运行时                     |
| `NGR-xxxx`  | 节点图   | 节点图结构、端口、连线、执行和调试                       |
| `ANI-xxxx`  | 动画     | Timeline、binding、track、keyframe、filter 和预览运行时  |

## 命名空间索引

- [MIR](/reference/diagnostics/mir)
- [Workspace](/reference/diagnostics/wks)
- [Editor](/reference/diagnostics/edt)
- [Code](/reference/diagnostics/cod)
- [External Library](/reference/diagnostics/elib)
- [Codegen](/reference/diagnostics/gen)
- [Backend/API](/reference/diagnostics/api)
- [AI](/reference/diagnostics/ai)
- [Route](/reference/diagnostics/rte)
- [NodeGraph](/reference/diagnostics/ngr)
- [Animation](/reference/diagnostics/ani)

## 所有错误码

### MIR

| Code                                          | 名称                      | 严重程度  |
| --------------------------------------------- | ------------------------- | --------- |
| [`MIR-1001`](/reference/diagnostics/mir-1001) | 禁止保存树形 UI 根节点    | `error`   |
| [`MIR-1002`](/reference/diagnostics/mir-1002) | UI graph 缺失             | `error`   |
| [`MIR-1003`](/reference/diagnostics/mir-1003) | 节点字段非法              | `error`   |
| [`MIR-2001`](/reference/diagnostics/mir-2001) | 根节点不存在              | `error`   |
| [`MIR-2002`](/reference/diagnostics/mir-2002) | 节点 key 与节点 ID 不一致 | `error`   |
| [`MIR-2003`](/reference/diagnostics/mir-2003) | 子节点引用不存在          | `error`   |
| [`MIR-2004`](/reference/diagnostics/mir-2004) | UI graph 存在环           | `error`   |
| [`MIR-2005`](/reference/diagnostics/mir-2005) | 节点存在多个结构父级      | `error`   |
| [`MIR-2006`](/reference/diagnostics/mir-2006) | 存在未受控孤儿节点        | `warning` |
| [`MIR-2007`](/reference/diagnostics/mir-2007) | 跨结构节点引用不存在      | `error`   |
| [`MIR-3001`](/reference/diagnostics/mir-3001) | ValueRef 路径无法解析     | `warning` |
| [`MIR-3002`](/reference/diagnostics/mir-3002) | 数据作用域配置非法        | `warning` |
| [`MIR-3010`](/reference/diagnostics/mir-3010) | 列表渲染配置非法          | `warning` |
| [`MIR-4001`](/reference/diagnostics/mir-4001) | Materialize 失败          | `error`   |
| [`MIR-9001`](/reference/diagnostics/mir-9001) | MIR 未知异常              | `error`   |

### Workspace

| Code                                          | 名称                       | 严重程度  |
| --------------------------------------------- | -------------------------- | --------- |
| [`WKS-1001`](/reference/diagnostics/wks-1001) | 工作区不存在               | `error`   |
| [`WKS-1002`](/reference/diagnostics/wks-1002) | 工作区快照损坏             | `error`   |
| [`WKS-2001`](/reference/diagnostics/wks-2001) | 能力协商不支持当前写入协议 | `error`   |
| [`WKS-3001`](/reference/diagnostics/wks-3001) | 文档不存在                 | `error`   |
| [`WKS-3002`](/reference/diagnostics/wks-3002) | 文档类型不支持该操作       | `error`   |
| [`WKS-4001`](/reference/diagnostics/wks-4001) | Workspace revision 冲突    | `warning` |
| [`WKS-4002`](/reference/diagnostics/wks-4002) | Route revision 冲突        | `warning` |
| [`WKS-4003`](/reference/diagnostics/wks-4003) | Content revision 冲突      | `warning` |
| [`WKS-5001`](/reference/diagnostics/wks-5001) | Intent 类型不支持          | `error`   |
| [`WKS-5002`](/reference/diagnostics/wks-5002) | Patch 应用失败             | `error`   |
| [`WKS-9001`](/reference/diagnostics/wks-9001) | Workspace 未知异常         | `error`   |

### Editor

| Code                                          | 名称                         | 严重程度  |
| --------------------------------------------- | ---------------------------- | --------- |
| [`EDT-1001`](/reference/diagnostics/edt-1001) | 当前选中节点不存在           | `warning` |
| [`EDT-2001`](/reference/diagnostics/edt-2001) | 拖拽目标非法                 | `warning` |
| [`EDT-2002`](/reference/diagnostics/edt-2002) | 拖拽会产生循环结构           | `error`   |
| [`EDT-3001`](/reference/diagnostics/edt-3001) | Inspector 字段 schema 不可用 | `warning` |
| [`EDT-3002`](/reference/diagnostics/edt-3002) | Inspector 字段写入被拒绝     | `error`   |
| [`EDT-4001`](/reference/diagnostics/edt-4001) | 画布预览降级                 | `warning` |
| [`EDT-5001`](/reference/diagnostics/edt-5001) | 命令无法进入历史栈           | `warning` |
| [`EDT-5002`](/reference/diagnostics/edt-5002) | Autosave 队列存在过期任务    | `warning` |
| [`EDT-9001`](/reference/diagnostics/edt-9001) | 编辑器未知异常               | `error`   |

### Code

| Code                                          | 名称                             | 严重程度  |
| --------------------------------------------- | -------------------------------- | --------- |
| [`COD-1001`](/reference/diagnostics/cod-1001) | 代码解析失败                     | `error`   |
| [`COD-1002`](/reference/diagnostics/cod-1002) | 不支持的语言模式                 | `error`   |
| [`COD-2001`](/reference/diagnostics/cod-2001) | 符号无法解析                     | `warning` |
| [`COD-2002`](/reference/diagnostics/cod-2002) | import 无法解析                  | `error`   |
| [`COD-2003`](/reference/diagnostics/cod-2003) | 类型不兼容                       | `warning` |
| [`COD-2004`](/reference/diagnostics/cod-2004) | 共享符号环境过期                 | `warning` |
| [`COD-3001`](/reference/diagnostics/cod-3001) | 代码片段绑定目标不存在           | `error`   |
| [`COD-3002`](/reference/diagnostics/cod-3002) | 代码片段返回值不满足宿主契约     | `error`   |
| [`COD-3003`](/reference/diagnostics/cod-3003) | 代码访问了当前上下文不可用的能力 | `warning` |
| [`COD-4001`](/reference/diagnostics/cod-4001) | 用户代码运行时抛错               | `error`   |
| [`COD-5001`](/reference/diagnostics/cod-5001) | 转译失败                         | `error`   |
| [`COD-5002`](/reference/diagnostics/cod-5002) | Shader 编译失败                  | `error`   |
| [`COD-9001`](/reference/diagnostics/cod-9001) | 代码环境未知异常                 | `error`   |

### External Library

| Code                                            | 名称                     | 严重程度  |
| ----------------------------------------------- | ------------------------ | --------- |
| [`ELIB-1001`](/reference/diagnostics/elib-1001) | 加载失败（模块导入失败） | `error`   |
| [`ELIB-1004`](/reference/diagnostics/elib-1004) | 未注册的外部库 ID        | `error`   |
| [`ELIB-1099`](/reference/diagnostics/elib-1099) | 加载阶段未知异常         | `error`   |
| [`ELIB-2001`](/reference/diagnostics/elib-2001) | 扫描阶段未发现可渲染导出 | `warning` |
| [`ELIB-3001`](/reference/diagnostics/elib-3001) | 注册阶段没有可渲染组件   | `error`   |

### Codegen

| Code                                          | 名称                  | 严重程度  |
| --------------------------------------------- | --------------------- | --------- |
| [`GEN-1001`](/reference/diagnostics/gen-1001) | Canonical IR 构建失败 | `error`   |
| [`GEN-2001`](/reference/diagnostics/gen-2001) | 组件 Adapter 缺失     | `warning` |
| [`GEN-2002`](/reference/diagnostics/gen-2002) | 目标框架不支持该能力  | `warning` |
| [`GEN-3001`](/reference/diagnostics/gen-3001) | 依赖包无法解析        | `error`   |
| [`GEN-3002`](/reference/diagnostics/gen-3002) | 依赖许可证策略不满足  | `warning` |
| [`GEN-4001`](/reference/diagnostics/gen-4001) | 代码发射失败          | `error`   |
| [`GEN-5001`](/reference/diagnostics/gen-5001) | 导出包生成失败        | `error`   |
| [`GEN-9001`](/reference/diagnostics/gen-9001) | Codegen 未知异常      | `error`   |

### Backend/API

| Code                                          | 名称               | 严重程度  |
| --------------------------------------------- | ------------------ | --------- |
| [`API-1001`](/reference/diagnostics/api-1001) | 请求体无法解析     | `error`   |
| [`API-1002`](/reference/diagnostics/api-1002) | 请求参数缺失       | `error`   |
| [`API-2001`](/reference/diagnostics/api-2001) | 用户未登录         | `error`   |
| [`API-2002`](/reference/diagnostics/api-2002) | 会话已过期         | `warning` |
| [`API-3001`](/reference/diagnostics/api-3001) | 权限不足           | `error`   |
| [`API-4001`](/reference/diagnostics/api-4001) | 后端业务校验失败   | `error`   |
| [`API-4004`](/reference/diagnostics/api-4004) | 资源不存在或不可见 | `error`   |
| [`API-4009`](/reference/diagnostics/api-4009) | 业务冲突           | `error`   |
| [`API-5001`](/reference/diagnostics/api-5001) | 数据库写入失败     | `error`   |
| [`API-6001`](/reference/diagnostics/api-6001) | 第三方集成调用失败 | `error`   |
| [`API-9001`](/reference/diagnostics/api-9001) | 后端未知异常       | `error`   |

### AI

| Code                                        | 名称                    | 严重程度  |
| ------------------------------------------- | ----------------------- | --------- |
| [`AI-1001`](/reference/diagnostics/ai-1001) | Provider 配置缺失       | `warning` |
| [`AI-1002`](/reference/diagnostics/ai-1002) | Provider 请求失败       | `error`   |
| [`AI-2001`](/reference/diagnostics/ai-2001) | 模型发现失败            | `warning` |
| [`AI-2002`](/reference/diagnostics/ai-2002) | 模型能力不满足当前任务  | `warning` |
| [`AI-3001`](/reference/diagnostics/ai-3001) | Prompt 上下文为空       | `warning` |
| [`AI-4001`](/reference/diagnostics/ai-4001) | 响应为空                | `error`   |
| [`AI-4002`](/reference/diagnostics/ai-4002) | 响应结构无法解析        | `error`   |
| [`AI-5001`](/reference/diagnostics/ai-5001) | AI Command dry-run 失败 | `error`   |
| [`AI-9001`](/reference/diagnostics/ai-9001) | AI 未知异常             | `error`   |

### Route

| Code                                          | 名称                  | 严重程度  |
| --------------------------------------------- | --------------------- | --------- |
| [`RTE-1001`](/reference/diagnostics/rte-1001) | 路由路径重复          | `error`   |
| [`RTE-1002`](/reference/diagnostics/rte-1002) | 路由路径非法          | `error`   |
| [`RTE-2001`](/reference/diagnostics/rte-2001) | 路由目标组件不存在    | `error`   |
| [`RTE-3001`](/reference/diagnostics/rte-3001) | 布局路由缺少 Outlet   | `warning` |
| [`RTE-3002`](/reference/diagnostics/rte-3002) | Outlet 无法匹配子路由 | `warning` |
| [`RTE-4001`](/reference/diagnostics/rte-4001) | 导航目标无法解析      | `error`   |
| [`RTE-9001`](/reference/diagnostics/rte-9001) | Route 未知异常        | `error`   |

### NodeGraph

| Code                                          | 名称                   | 严重程度  |
| --------------------------------------------- | ---------------------- | --------- |
| [`NGR-1001`](/reference/diagnostics/ngr-1001) | 节点定义不存在         | `error`   |
| [`NGR-2001`](/reference/diagnostics/ngr-2001) | 必填输入端口未连接     | `warning` |
| [`NGR-2002`](/reference/diagnostics/ngr-2002) | 端口类型不兼容         | `error`   |
| [`NGR-3001`](/reference/diagnostics/ngr-3001) | 控制流连线形成非法循环 | `error`   |
| [`NGR-4001`](/reference/diagnostics/ngr-4001) | 节点执行失败           | `error`   |
| [`NGR-5001`](/reference/diagnostics/ngr-5001) | 断点目标不存在         | `warning` |
| [`NGR-9001`](/reference/diagnostics/ngr-9001) | NodeGraph 未知异常     | `error`   |

### Animation

| Code                                          | 名称                        | 严重程度  |
| --------------------------------------------- | --------------------------- | --------- |
| [`ANI-1001`](/reference/diagnostics/ani-1001) | 时间线时长非法              | `error`   |
| [`ANI-1002`](/reference/diagnostics/ani-1002) | 时间线 ID 重复              | `error`   |
| [`ANI-2001`](/reference/diagnostics/ani-2001) | Binding 目标节点不存在      | `error`   |
| [`ANI-3001`](/reference/diagnostics/ani-3001) | Track 属性不支持            | `warning` |
| [`ANI-3002`](/reference/diagnostics/ani-3002) | SVG Filter primitive 不存在 | `error`   |
| [`ANI-4001`](/reference/diagnostics/ani-4001) | Keyframe 时间不递增         | `warning` |
| [`ANI-5001`](/reference/diagnostics/ani-5001) | 动画预览采样失败            | `error`   |
| [`ANI-9001`](/reference/diagnostics/ani-9001) | Animation 未知异常          | `error`   |

## Backend API

后端 API 错误响应会将稳定错误码放在 `error.code` 中，并可能同时返回 `requestId`。

```json
{
  "error": {
    "code": "WKS-4003",
    "message": "Revision conflict.",
    "requestId": "req_...",
    "retryable": true,
    "details": {}
  }
}
```
