# @mdr/backend

MdrFrontEngine 的后端服务，基于 Go。

## 目录结构

```text
apps/backend
├── cmd/
│   └── server/        # 服务入口
├── internal/
│   ├── app/           # 应用装配
│   ├── config/        # 配置加载
│   ├── modules/       # 业务模块
│   └── platform/      # 基础设施与平台能力
├── server.go          # 启动入口
├── go.mod
├── Dockerfile
└── docker-compose.yml
```

## 常用命令

```bash
pnpm dev:backend
pnpm dev:backend:hot
pnpm build:backend
cd apps/backend && go test ./...
```
