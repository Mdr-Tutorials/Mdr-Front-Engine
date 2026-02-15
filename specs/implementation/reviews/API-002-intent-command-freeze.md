# API-002 评审记录：Intent/Command Envelope 冻结

## 状态

- Completed
- 日期：2026-02-08
- 关联任务：`API-002`
- 关联文档：`specs/decisions/12.intent-command-extension.md`

## 评审目标

冻结 Intent/Command 的最小 envelope 字段与保留域错误码，避免接口在落地阶段漂移。

## 固定字段表（Final for Gate A）

### IntentEnvelope

| 字段             | 必填 | 说明                                         |
| ---------------- | ---- | -------------------------------------------- |
| `id`             | 是   | 请求唯一标识                                 |
| `namespace`      | 是   | 协议命名空间（`core` / `plugin.*` / 自定义） |
| `type`           | 是   | 意图类型                                     |
| `version`        | 是   | 协议版本                                     |
| `payload`        | 是   | 业务负载                                     |
| `issuedAt`       | 是   | 客户端发出时间                               |
| `idempotencyKey` | 否   | 幂等键                                       |
| `actor`          | 否   | 行为主体（user/client）                      |

### CommandEnvelope

| 字段                 | 必填 | 说明             |
| -------------------- | ---- | ---------------- |
| `id`                 | 是   | 命令唯一标识     |
| `namespace`          | 是   | 命令命名空间     |
| `type`               | 是   | 命令类型         |
| `version`            | 是   | 协议版本         |
| `issuedAt`           | 是   | 命令生成时间     |
| `forwardOps`         | 是   | 正向可执行 patch |
| `reverseOps`         | 是   | 反向可逆 patch   |
| `target.workspaceId` | 是   | 目标工作区       |
| `target.documentId`  | 否   | 目标文档         |
| `mergeKey`           | 否   | 历史合并键       |

## 示例 payload（冻结样例）

### Intent 示例

```json
{
  "id": "intent_7f83",
  "namespace": "core",
  "type": "route.create",
  "version": "1.0",
  "payload": {
    "parentRouteId": "root",
    "segment": "product"
  },
  "idempotencyKey": "route.create:root:product",
  "actor": { "userId": "u_1", "clientId": "web_1" },
  "issuedAt": "2026-02-08T10:00:00Z"
}
```

### Command 示例

```json
{
  "id": "cmd_912a",
  "namespace": "core.route",
  "type": "node.add",
  "version": "1.0",
  "issuedAt": "2026-02-08T10:00:01Z",
  "forwardOps": [
    {
      "op": "add",
      "path": "/routeManifest/root/children/0",
      "value": { "id": "product", "segment": "product" }
    }
  ],
  "reverseOps": [{ "op": "remove", "path": "/routeManifest/root/children/0" }],
  "target": { "workspaceId": "ws_1" },
  "mergeKey": "route.add:root"
}
```

## 保留域错误码（Final）

服务端：

1. `UNSUPPORTED_INTENT`
2. `UNSUPPORTED_COMMAND`
3. `RESERVED_DOMAIN_DISABLED`
4. `INVALID_ENVELOPE_VERSION`
5. `INVALID_ENVELOPE_PAYLOAD`

客户端本地状态：

1. `UNHANDLED_RESERVED_DOMAIN`

## 评审结论

1. 通过：进入 `Draft-Frozen（API-002）`
2. 后续新增 envelope 字段只能以“可选字段”方式扩展
3. 若需修改 required 字段，必须重新发起 Gate A 评审
