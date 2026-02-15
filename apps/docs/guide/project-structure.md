# 项目结构

MdrFrontEngine 采用 **Monorepo** 架构，使用 pnpm workspace 和 Turborepo 进行管理。本文档将详细介绍项目的目录结构和各模块的职责。

## 整体结构

```
mdr-front-engine/
├── apps/                      # 独立可部署的应用
│   ├── web/                   # Web 编辑器（主应用）
│   ├── backend/               # Go 后端服务
│   ├── cli/                   # 命令行工具
│   ├── docs/                  # 文档站点（VitePress）
│   └── vscode/                # VS Code 扩展
│
├── packages/                  # 共享的库和包
│   ├── mir-compiler/          # MIR 编译器
│   ├── ui/                    # UI 组件库
│   ├── shared/                # 共享类型和工具
│   ├── themes/                # 主题系统
│   ├── i18n/                  # 国际化
│   ├── eslint-plugin-mdr/     # ESLint 插件
│   └── vscode-debugger/       # VS Code 调试适配器
│
├── specs/                     # 规范文档
│   ├── mir/                   # MIR 语言规范
│   └── rfc/                   # RFC 提案模板
│
├── tests/                     # E2E 测试（Playwright）
│
├── package.json               # 根配置
├── pnpm-workspace.yaml        # pnpm workspace 配置
├── turbo.json                 # Turborepo 配置
└── tsconfig.json              # TypeScript 根配置
```

## 应用 (apps/)

### apps/web - Web 编辑器

Web 编辑器是 MdrFrontEngine 的核心应用，提供完整的可视化开发体验。

```
apps/web/
├── src/
│   ├── App.tsx               # 应用入口
│   ├── index.tsx             # 渲染入口
│   │
│   ├── core/                 # 核心引擎
│   │   ├── executor/         # 节点图执行器
│   │   ├── nodes/            # 内置节点定义
│   │   ├── worker/           # Web Worker 执行环境
│   │   └── types/            # 类型定义
│   │
│   ├── editor/               # 编辑器模块
│   │   ├── Editor.tsx        # 编辑器主组件
│   │   ├── EditorBar/        # 顶部工具栏
│   │   ├── EditorHome.tsx    # 编辑器首页
│   │   ├── ProjectHome.tsx   # 项目首页
│   │   │
│   │   └── features/         # 功能模块
│   │       ├── design/       # 蓝图编辑器
│   │       │   ├── BlueprintEditor.tsx
│   │       │   ├── BlueprintEditorComponentTree.tsx
│   │       │   ├── BlueprintEditorInspector.tsx
│   │       │   ├── BlueprintEditorSidebar.tsx
│   │       │   └── BlueprintEditorViewportBar.tsx
│   │       │
│   │       ├── development/  # 节点图编辑器
│   │       │   └── NodeGraph.tsx
│   │       │
│   │       ├── export/       # 导出功能
│   │       ├── newfile/      # 新建资源
│   │       └── settings/     # 设置页面
│   │
│   ├── mir/                  # MIR 相关
│   │   ├── ast/              # AST 解析
│   │   ├── converter/        # AST ↔ MIR 转换
│   │   ├── generator/        # 代码生成器
│   │   ├── renderer/         # MIR 渲染器
│   │   └── validator/        # 校验器
│   │
│   ├── debug/                # 调试系统
│   │   ├── breakpoints/      # 断点管理
│   │   ├── state-monitor/    # 状态监控
│   │   └── timeline/         # 时间线
│   │
│   ├── home/                 # 首页
│   └── i18n/                 # 国际化资源
│       └── resources/
│           ├── en.json
│           └── zh-CN.json
│
├── public/                   # 静态资源
├── vite.config.ts            # Vite 配置
├── tailwind.config.ts        # Tailwind 配置
└── tsconfig.json             # TypeScript 配置
```

**技术栈**：

- React 19
- TypeScript 5.9
- Vite
- Tailwind CSS
- Zustand（状态管理）
- React Router 7
- Monaco Editor
- @dnd-kit（拖拽）

### apps/backend - Go 后端

```
apps/backend/
├── main.go                   # 入口
├── server.go                 # HTTP 服务器
├── store.go                  # 数据存储
├── config.go                 # 配置管理
├── types.go                  # 类型定义
├── go.mod                    # Go 模块定义
└── Makefile                  # 构建脚本
```

**技术栈**：

- Go 1.24
- Gin Web 框架

**职责**：

- 用户认证
- 项目存储
- API 服务
- 部署集成

### apps/cli - 命令行工具

```
apps/cli/
├── src/
│   ├── index.ts              # CLI 入口
│   ├── commands/             # 命令定义
│   │   ├── build.ts
│   │   ├── export.ts
│   │   └── deploy.ts
│   └── utils/                # 工具函数
│       └── logger.ts
├── package.json
└── tsconfig.json
```

**技术栈**：

- Node.js
- Commander.js
- TypeScript

**命令**：

- `mdr build` - 构建项目
- `mdr export` - 导出静态站点
- `mdr deploy` - 部署项目

### apps/docs - 文档站点

```
apps/docs/
├── .vitepress/
│   └── config.mts            # VitePress 配置
├── guide/                    # 用户指南
├── reference/                # 参考文档
├── api/                      # API 文档
├── community/                # 社区相关
├── index.md                  # 首页
└── package.json
```

**技术栈**：VitePress 1.6

### apps/vscode - VS Code 扩展

```
apps/vscode/
├── src/
│   ├── extension.ts          # 扩展入口
│   └── providers/            # 功能提供者
├── syntaxes/                 # 语法高亮
├── package.json              # 扩展清单
└── tsconfig.json
```

**功能**：

- `.mir.json` 语法高亮
- 符号导航
- 调试支持
- 实时预览

## 共享包 (packages/)

### packages/ui - 组件库

```
packages/ui/
├── src/
│   ├── button/               # 按钮组件
│   │   ├── MdrButton.tsx
│   │   ├── MdrButton.scss
│   │   └── index.ts
│   ├── link/                 # 链接组件
│   ├── nav/                  # 导航组件
│   ├── container/            # 容器组件
│   ├── data/                 # 数据组件
│   ├── form/                 # 表单组件
│   ├── media/                # 媒体组件
│   └── text/                 # 文本组件
│
├── .storybook/               # Storybook 配置
├── package.json
└── tsconfig.json
```

**特点**：

- 10 级灰度设计系统
- 自动深色/浅色模式
- WCAG 2.1 AA 无障碍
- Storybook 文档

### packages/mir-compiler - MIR 编译器

```
packages/mir-compiler/
├── src/
│   ├── index.ts              # 入口
│   ├── parser.ts             # 解析器
│   ├── transformer.ts        # 转换器
│   └── generators/           # 代码生成器
│       ├── react.ts
│       ├── vue.ts
│       └── angular.ts
├── package.json
└── tsconfig.json
```

### packages/shared - 共享工具

```
packages/shared/
├── src/
│   ├── types/                # 类型定义
│   │   └── MdrComponent.ts
│   ├── schemas/              # JSON Schema
│   └── utils/                # 工具函数
├── package.json
└── tsconfig.json
```

### packages/themes - 主题系统

```
packages/themes/
├── src/
│   └── variables.scss        # CSS 变量定义
└── package.json
```

### packages/i18n - 国际化

```
packages/i18n/
├── src/
│   ├── index.ts              # 配置入口
│   └── resources/            # 语言资源
│       ├── en.json
│       └── zh-CN.json
└── package.json
```

## 构建系统

### Turborepo 配置 (turbo.json)

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {},
    "lint": {}
  }
}
```

### pnpm Workspace (pnpm-workspace.yaml)

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

## 下一步

- [蓝图编辑器](/guide/blueprint-editor) - 了解可视化设计功能
- [MIR 规范](/reference/mir-spec) - 深入理解组件描述格式
- [开发指南](/community/development) - 参与项目开发
