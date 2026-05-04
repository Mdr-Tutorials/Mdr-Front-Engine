---
lastUpdated: false
---

# NodeGraph 错误码

NodeGraph 命名空间覆盖节点图结构、端口、连线、执行和调试。

| Code                                          | 名称                   | 严重程度  |
| --------------------------------------------- | ---------------------- | --------- |
| [`NGR-1001`](/reference/diagnostics/ngr-1001) | 节点定义不存在         | `error`   |
| [`NGR-2001`](/reference/diagnostics/ngr-2001) | 必填输入端口未连接     | `warning` |
| [`NGR-2002`](/reference/diagnostics/ngr-2002) | 端口类型不兼容         | `error`   |
| [`NGR-3001`](/reference/diagnostics/ngr-3001) | 控制流连线形成非法循环 | `error`   |
| [`NGR-4001`](/reference/diagnostics/ngr-4001) | 节点执行失败           | `error`   |
| [`NGR-5001`](/reference/diagnostics/ngr-5001) | 断点目标不存在         | `warning` |
| [`NGR-9001`](/reference/diagnostics/ngr-9001) | NodeGraph 未知异常     | `error`   |

[返回错误码索引](/reference/diagnostic-codes)
