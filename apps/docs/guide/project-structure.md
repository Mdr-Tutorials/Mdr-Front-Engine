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
│   ├── App.tsx               # 应用入口和路由配置
│   ├── main.tsx              # 渲染入口
│   │
│   ├── core/                 # 核心引擎
│   │   ├── executor/         # 节点图执行器（待实现）
│   │   ├── nodes/            # 内置节点定义
│   │   │   └── http/         # HTTP 请求节点
│   │   ├── worker/           # Web Worker 执行环境
│   │   └── types/            # 核心类型定义
│   │       └── engine.types.ts
│   │
│   ├── editor/               # 编辑器模块
│   │   ├── Editor.tsx        # 编辑器主组件
│   │   ├── EditorBar/        # 顶部工具栏
│   │   ├── EditorHome.tsx    # 编辑器首页
│   │   ├── ProjectHome.tsx   # 项目首页
│   │   ├── editorApi.ts      # API 接口
│   │   │
│   │   └── features/         # 功能模块
│   │       ├── design/       # 蓝图编辑器
│   │       │   ├── BlueprintEditor.tsx
│   │       │   ├── BlueprintEditorComponentTree.tsx
│   │       │   ├── BlueprintEditorInspector.tsx
│   │       │   ├── BlueprintEditorSidebar.tsx
│   │       │   ├── BlueprintEditorCanvas.tsx
│   │       │   ├── BlueprintEditorViewportBar.tsx
│   │       │   └── blueprint/
│   │       │       ├── data/         # 组件数据
│   │       │       │   ├── groups/   # 组件分组
│   │       │       │   └── external/ # 外部库集成
│   │       │       └── inspector/    # 属性检查器
│   │       │
│   │       ├── development/  # 节点图编辑器（待完善）
│   │       │   └── NodeGraph.tsx
│   │       │
│   │       ├── export/       # 导出功能
│   │       ├── resources/    # 资源管理
│   │       └── settings/     # 设置页面
│   │
│   ├── mir/                  # MIR 相关
│   │   ├── ast/              # AST 解析
│   │   ├── converter/        # AST ↔ MIR 转换
│   │   ├── generator/        # 代码生成器
│   │   │   ├── mirToReact.ts
│   │   │   └── react/
│   │   │       ├── compileComponent.ts
│   │   │       └── projectScaffold.ts
│   │   ├── renderer/         # MIR 渲染器
│   │   │   ├── MIRRenderer.tsx
│   │   │   └── registry.ts
│   │   ├── actions/          # 内置动作
│   │   │   └── registry.ts
│   │   └── validator/        # 校验器
│   │
│   ├── debug/                # 调试系统（待实现）
│   │   ├── breakpoints/      # 断点管理
│   │   ├── stateMonitor/     # 状态监控
│   │   └── timeline/         # 时间线
│   │
│   ├── store/                # 状态管理
│   │   ├── useEditorStore.ts
│   │   └── useSettingsStore.ts
│   │
│   ├── auth/                 # 认证模块
│   ├── community/            # 社区模块
│   ├── home/                 # 首页
│   └── i18n/                 # 国际化资源
│       └── resources/
│           ├── en.json
│           └── zh-CN.json
│
├── public/                   # 静态资源
├── vite.config.ts            # Vite 配置
├── tailwind.config.ts        # Tailwind 配置
├── vitest.config.ts          # 测试配置
└── tsconfig.json             # TypeScript 配置
```

**技术栈**：

- React 19
- TypeScript 5.9
- Vite (rolldown-vite)
- Tailwind CSS 4
- Zustand（状态管理）
- React Router 7
- Monaco Editor
- @dnd-kit（拖拽）
- @xyflow/react（节点图）

### apps/backend - Go 后端

```
apps/backend/
├── main.go                   # 入口
├── server.go                 # HTTP 服务器和路由
├── store.go                  # 数据存储基类
├── config.go                 # 配置管理
├── database.go               # 数据库连接
├── types.go                  # 类型定义
├── project_store.go          # 项目存储
├── workspace_store.go        # 工作区存储
├── workspace_handlers.go     # 工作区 API 处理
├── go.mod                    # Go 模块定义
├── go.sum                    # 依赖锁定
├── Makefile                  # 构建脚本
├── Dockerfile                # Docker 构建
├── docker-compose.yml        # 本地开发环境
└── .air.toml                 # 热重载配置
```

**技术栈**：

- Go 1.24
- Gin Web 框架
- PostgreSQL
- bcrypt（密码哈希）

**职责**：

- 用户认证（注册、登录、会话管理）
- 项目存储和管理
- 工作区协作编辑
- 版本控制和冲突检测
- 社区功能（公开项目）
- API 服务

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
│   │   ├── MdrButton.stories.tsx
│   │   └── MdrButtonLink.tsx
│   ├── link/                 # 链接组件
│   ├── nav/                  # 导航组件
│   │   ├── MdrNav.tsx
│   │   ├── MdrNavbar.tsx
│   │   ├── MdrSidebar.tsx
│   │   └── ...
│   ├── container/            # 容器组件
│   │   ├── MdrDiv.tsx
│   │   ├── MdrCard.tsx
│   │   ├── MdrPanel.tsx
│   │   └── MdrSection.tsx
│   ├── data/                 # 数据组件
│   │   ├── MdrTable.tsx
│   │   ├── MdrDataGrid.tsx
│   │   ├── MdrList.tsx
│   │   └── ...
│   ├── form/                 # 表单组件
│   │   ├── MdrInput.tsx
│   │   ├── MdrSelect.tsx
│   │   ├── MdrDatePicker.tsx
│   │   └── ...
│   ├── media/                # 媒体组件
│   ├── feedback/             # 反馈组件
│   │   ├── MdrModal.tsx
│   │   ├── MdrDrawer.tsx
│   │   └── ...
│   ├── text/                 # 文本组件
│   ├── icon/                 # 图标组件
│   ├── input/                # 输入组件
│   ├── embed/                # 嵌入组件
│   └── index.ts              # 导出入口
│
├── .storybook/               # Storybook 配置
├── package.json
└── tsconfig.json
```

**特点**：

- 75+ 组件
- 10 级灰度设计系统
- 自动深色/浅色模式
- WCAG 2.1 AA 无障碍
- Storybook 文档

### packages/mir-compiler - MIR 编译器

```
packages/mir-compiler/
├── package.json
└── tsconfig.json
```

**说明**：当前 MIR 编译逻辑位于 `apps/web/src/mir/generator/` 中。

### packages/shared - 共享工具

```
packages/shared/
├── src/
│   ├── types/                # 类型定义
│   │   ├── MdrComponent.ts
│   │   └── mir.ts
│   ├── index.ts
│   └── scripts/              # 工具脚本
│       ├── generate-types.js
│       └── validate-mir.js
├── package.json
└── tsconfig.json
```

### packages/themes - 主题系统

```
packages/themes/
├── src/
│   └── variables.scss        # CSS 变量定义
├── base/
│   └── base.scss             # 基础样式
├── semantic/
│   └── semantic.scss         # 语义化样式
├── presets/
│   └── presets.ts            # 预设主题
├── utils/
│   └── themeUtils.ts         # 主题工具
├── index.ts
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
├── scripts/
│   └── translate.ts          # 翻译工具
└── package.json
```

### packages/eslint-plugin-mdr - ESLint 插件

```
packages/eslint-plugin-mdr/
├── src/
│   ├── index.ts              # 插件入口
│   └── rules/                # 自定义规则
│       ├── no-circular.ts    # 禁止循环依赖
│       ├── no-type-error.ts  # 类型错误检查
│       └── no-unused-var.ts  # 未使用变量检查
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### packages/vscode-debugger - VS Code 调试适配器

```
packages/vscode-debugger/
├── package.json
└── tsconfig.json
```

**说明**：提供 VS Code 调试适配器协议实现。

## 规范文档 (specs/)

```
specs/
├── package.json
└── mir/                      # MIR 规范
    ├── MIR-v1.0.json
    ├── MIR-v1.1.json
    └── MIR-v1.2.json
```

**说明**：包含 MIR 规范的 JSON Schema 定义，用于版本化管理和验证。

## 测试 (tests/)

```
tests/
├── e2e/                      # E2E 测试
│   ├── fixtures/             # 测试数据
│   │   └── todo-app.mir.json
│   ├── pages/                # Page Object
│   │   └── EditorPage.ts
│   ├── specs/                # 测试用例
│   │   ├── debug-breakpoint.spec.ts
│   │   ├── node-diff.spec.ts
│   │   ├── node-state.spec.ts
│   │   └── performance.spec.ts
│   └── playwright.config.ts
```

**说明**：使用 Playwright 进行端到端测试。

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
