# @mdr/vscode

MdrFrontEngine 的 VSCode 插件，提供 MIR 语言支持、MIR 预览命令与调试适配能力。

## 目录结构

```text
apps/vscode
├── src/
│   ├── commands/      # 命令实现（含 MIR 预览）
│   ├── language/      # MIR 语言特性
│   ├── debugger/      # 调试器接入
│   ├── test/          # 插件测试
│   ├── extension.ts   # 扩展入口
│   └── index.ts       # 调试适配入口
├── out/               # 编译输出
├── dist/              # 打包输出
├── esbuild.js         # 构建脚本
├── package.json
└── tsconfig.json
```

## 常用命令

```bash
pnpm dev:vscode
pnpm build:vscode
cd apps/vscode && pnpm lint
```
