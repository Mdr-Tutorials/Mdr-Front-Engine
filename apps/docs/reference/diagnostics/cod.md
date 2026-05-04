---
lastUpdated: false
---

# Code 错误码

Code 命名空间覆盖代码片段、符号解析、类型、宿主绑定、运行时和转译编译。

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

[返回错误码索引](/reference/diagnostic-codes)
