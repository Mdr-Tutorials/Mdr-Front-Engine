---
lastUpdated: false
---

# Editor 错误码

Editor 命名空间覆盖选择、拖拽、Inspector、画布、命令和 autosave。

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

[返回错误码索引](/reference/diagnostic-codes)
