# @mdr/docs

MdrFrontEngine 官方文档站点，基于 VitePress。

## 目录结构

```text
apps/docs
├── .vitepress/
│   └── config.mts     # 站点配置
├── guide/             # 使用与开发指南
├── api/               # API 文档
├── reference/         # 规范与参考
├── community/         # 社区与协作文档
├── index.md           # 首页
└── package.json
```

## 常用命令

```bash
pnpm dev:docs
pnpm build:docs
cd apps/docs && pnpm preview
```
