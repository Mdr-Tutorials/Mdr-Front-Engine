---
lastUpdated: false
---

# Codegen 错误码

Codegen 命名空间覆盖Canonical IR、adapter、依赖解析、代码发射和导出产物。

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

[返回错误码索引](/reference/diagnostic-codes)
