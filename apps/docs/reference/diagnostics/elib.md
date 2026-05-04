---
lastUpdated: false
---

# External Library 错误码

External Library 命名空间覆盖外部库加载、扫描、注册、渲染和代码生成。

| Code                                            | 名称                     | 严重程度  |
| ----------------------------------------------- | ------------------------ | --------- |
| [`ELIB-1001`](/reference/diagnostics/elib-1001) | 加载失败（模块导入失败） | `error`   |
| [`ELIB-1004`](/reference/diagnostics/elib-1004) | 未注册的外部库 ID        | `error`   |
| [`ELIB-1099`](/reference/diagnostics/elib-1099) | 加载阶段未知异常         | `error`   |
| [`ELIB-2001`](/reference/diagnostics/elib-2001) | 扫描阶段未发现可渲染导出 | `warning` |
| [`ELIB-3001`](/reference/diagnostics/elib-3001) | 注册阶段没有可渲染组件   | `error`   |

[返回错误码索引](/reference/diagnostic-codes)
