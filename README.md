# MdrFrontEngine (MFE)

**开源可视化前端开发平台** —— 从设计到部署的全流程解决方案

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/version-0.1.0--alpha-orange.svg)
![Local First](https://img.shields.io/badge/Local%20First-Yes-brightgreen.svg)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Mdr-Tutorials/Mdr-Front-Engine)

**口号**：**Mdr / 前端 _梭哈_ / 灵感顷刻 _炼化_**  
**我们主张**：**"Visualize Beyond Design"** —— 可视化的不仅是设计，更是整个前端全生命周期。

通过 **MIR（Mdr Intermediate Representation）** 作为唯一真相源，MFE 将 UI 蓝图、业务逻辑、动画效果“三层”无缝统一，最终“一键炼化”成生产级代码。你可以像搭积木一样开发前端，也可以在任意环节混入真实代码。

---

## 🧠 核心架构：MIR 单真相源

MFE 采用独创的 **三编辑器统一架构**，所有操作最终都收敛到 **MIR**（Mdr Intermediate Representation）—— 项目唯一的、权威的中间表示：

- **蓝图编辑器（Blueprint Editor）** —— UI 层  
  可视化界面构建、组件布局、样式绑定、触发器（内置事件 / 执行节点图 / 执行代码 / 播放动画）
- **节点图编辑器（Node Graph Editor）** —— Logic 层  
  业务逻辑、数据流、控制流，支持内置节点 + **自定义 JS/TS 代码节点**
- **动画编辑器（Animation Editor）** —— Animation 层  
  时间线、关键帧、过渡曲线、交互动画序列、CSS Filter、SVG Filter

**MIR 是整个系统的“唯一真相源”**：  
任意编辑器修改都会实时同步到其他视图 → 最终通过“炼化”编译器生成多框架代码，解决传统低代码工具“改一处、乱三处”的顽疾。

---

## ✨ 核心特性

- **可视化全链路编辑**  
  蓝图搭界面、节点图写逻辑、动画编辑器做动效，三者统一于 MIR
- **外部库可引入**
  从 esm.sh 拉取你想要的库，在 MFE 里随心使用，对于组件库还有特化的适配
- **自由的代码节点**  
  复杂逻辑直接写真实 TypeScript，支持导入项目现有模块，类型检查与智能提示全都有
- **多目标代码炼化（Code Transmutation）**  
  一键导出 Vue 3、React、Angular、SolidJS、Svelte、Qwik、原生 HTML、htmx 等多种生产级代码
- **数据驱动引擎**  
  内置 JSON Schema + 动态绑定，实现“数据获取 → 渲染 → 更新”完整闭环
- **全栈本地优先生态**  
  Go 驱动的高性能后端 + CLI + VSCode 插件，完全支持离线开发与云端协作
- **AI 助手深度集成**
  一键生成节点、自动补全逻辑、优化 MIR

---

## 📂 项目结构 (Monorepo)

采用 **Turbo + pnpm workspaces** 构建：

```text
.
├── .github/               # CI/CD 与仓库工作流
├── apps/
│   ├── web/               # MFE 核心可视化编辑器（React + TS）
│   ├── backend/           # Go 驱动的后端服务
│   ├── cli/               # Mdr 命令行工具
│   ├── vscode/            # VSCode 插件
│   └── docs/              # VitePress 文档站点
├── deploy/                # 部署与本地依赖编排（如 postgres）
├── packages/
│   ├── ui/                # 共享组件库（SCSS）+ Storybook
│   ├── themes/            # 主题与设计变量
│   ├── shared/            # MIR Schema / Types / 公共工具
│   ├── i18n/              # 国际化资源与工具
│   ├── mir-compiler/      # MIR 编译器核心包
│   ├── eslint-plugin-mdr/ # 自定义 ESLint 插件
│   └── vscode-debugger/   # VSCode 调试适配器
├── scripts/               # 仓库级脚本
├── specs/                 # 规范与设计文档
├── tests/                 # 仓库级测试
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

子项目说明文档：

- [apps/web/README.md](apps/web/README.md)
- [apps/backend/README.md](apps/backend/README.md)
- [apps/cli/README.md](apps/cli/README.md)
- [apps/docs/README.md](apps/docs/README.md)
- [apps/vscode/README.md](apps/vscode/README.md)

---

## 🚀 快速开始

### 前提条件

- pnpm（推荐 v10+）
- Go 1.22+
- Node.js LTS
- PostgreSQL

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/Mdr-Tutorials/Mdr-Front-Engine.git
cd mdr-front-engine

# 安装依赖
pnpm install

# 一次性启动所有模块（Web + Backend + Docs）
pnpm dev
```

---

## 🛠️ 命令指南

### 全域命令

| 命令          | 说明                               |
| ------------- | ---------------------------------- |
| `pnpm dev`    | 并行启动所有应用                   |
| `pnpm build`  | 全链路构建（生产产物）             |
| `pnpm format` | 统一格式化（TS/TSX/Go/MD/JSON 等） |
| `pnpm test`   | 全仓库测试                         |

命令有细化版本：比如 `pnpm test:web` 只跑前端测试，`pnpm test:web:coverage` 只跑前端覆盖率测试，等等。

### 子模块开发

| 模块        | 命令               |
| ----------- | ------------------ |
| Web 编辑器  | `pnpm dev:web`     |
| Go 后端     | `pnpm dev:backend` |
| CLI         | `pnpm dev:cli`     |
| 文档中心    | `pnpm dev:docs`    |
| VSCode 插件 | `pnpm dev:vscode`  |

### 组件预览

```bash
pnpm storybook:ui     # 在 packages/ui 中独立开发组件
```

### CLI 使用示例

```bash
pnpm cli init my-project          # 创建新项目
pnpm cli sync                     # 同步 MIR 与本地代码
```

---

## 🔬 技术栈

- **Monorepo**：Turbo + pnpm
- **前端核心**：React + TypeScript + Vite + React Flow（节点图）+ Code Mirror（代码编辑器）
- **后端引擎**：Go
- **代码编辑**：CodeMirror
- **UI 组件**：SCSS + Tailwind
- **状态管理**：Zustand + Immer
- **质量保障**：Prettier + Husky + Vitest

---

## 📜 许可证

本项目基于 **MIT License** 开源 —— 欢迎个人、商业、教学自由使用与贡献。

---

## 鸣谢

---

> **MdrFrontEngine** —— 打破边界，让灵感在可视化与代码间自由跳动。  
> **Minsecrus** 2026.2.18

**Star 支持我们！**
