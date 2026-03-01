# @mdr/web

MdrFrontEngine 的核心可视化编辑器前端应用，基于 React + TypeScript + Vite。

## 目录结构

```text
apps/web
├── src/
│   ├── editor/        # 编辑器主模块（蓝图/节点图/动画）
│   ├── mir/           # MIR 相关模型与协议
│   ├── core/          # 执行器、节点运行时等核心能力
│   ├── components/    # 通用 UI 组件封装
│   ├── stores/        # 状态管理
│   ├── hooks/         # 复用 hooks
│   └── utils/         # 通用工具函数
├── public/            # 静态资源
├── docker/            # Nginx 等部署配置
├── .storybook/        # Storybook 配置
├── vite.config.ts
├── tailwind.config.ts
└── vitest.config.ts
```

## 常用命令

```bash
pnpm dev:web
pnpm build:web
pnpm test:web
pnpm test:web:coverage
```
