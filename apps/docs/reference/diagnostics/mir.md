---
lastUpdated: false
---

# MIR 错误码

MIR 命名空间覆盖文档形状、UI graph、ValueRef、materialize 和运行前校验。

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

[返回错误码索引](/reference/diagnostic-codes)
