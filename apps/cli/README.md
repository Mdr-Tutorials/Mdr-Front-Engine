# @mdr/cli

MdrFrontEngine 的命令行工具，提供项目初始化、同步、构建相关能力。

## 目录结构

```text
apps/cli
├── src/
│   ├── commands/      # CLI 子命令实现
│   ├── utils/         # 命令工具函数
│   └── cli.ts         # 命令入口
├── bin/
│   └── mdr.js         # 可执行入口
├── test/              # CLI 测试
├── package.json
└── tsconfig.json
```

## 常用命令

```bash
pnpm dev:cli
pnpm build:cli
pnpm cli --help
```
