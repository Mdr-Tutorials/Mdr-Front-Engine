# 快速开始

本指南将帮助你在本地环境中运行 MdrFrontEngine，并创建你的第一个项目。

## 前置条件

在开始之前，请确保你的开发环境满足以下要求：

| 依赖 | 版本要求 | 检查命令 |
| --- | --- | --- |
| Node.js | >= 20.0.0 | `node --version` |
| pnpm | >= 10.0.0 | `pnpm --version` |
| Git | 任意版本 | `git --version` |

::: tip 安装 pnpm
如果你还没有安装 pnpm，可以通过以下命令安装：
```bash
npm install -g pnpm
```
:::

## 克隆仓库

```bash
git clone https://github.com/mdr-front-engine/mdr-front-engine.git
cd mdr-front-engine
```

## 安装依赖

MdrFrontEngine 使用 pnpm workspace 管理多个包：

```bash
pnpm install
```

这将安装所有应用和包的依赖。

## 启动开发服务器

### 启动 Web 编辑器

```bash
pnpm dev:web
```

Web 编辑器将在 `http://localhost:5173` 启动。

### 启动所有服务

如果你需要同时运行 Web 编辑器、后端服务和文档站点：

```bash
pnpm dev
```

### 可用的开发命令

| 命令 | 描述 |
| --- | --- |
| `pnpm dev` | 启动所有开发服务器 |
| `pnpm dev:web` | 仅启动 Web 编辑器 |
| `pnpm dev:docs` | 启动文档站点 |
| `pnpm dev:cli` | 启动 CLI 开发模式 |
| `pnpm build` | 构建所有包 |
| `pnpm test` | 运行所有测试 |
| `pnpm lint` | 代码检查 |
| `pnpm storybook:ui` | 启动 UI 组件库文档 |

## 创建第一个项目

### 1. 打开编辑器

访问 `http://localhost:5173`，你将看到 MdrFrontEngine 的主界面。

### 2. 创建新项目

1. 点击 **"新建项目"** 按钮
2. 输入项目名称（例如 "My First App"）
3. 选择项目模板（推荐 "空白项目" 开始）
4. 点击 **"创建"**

### 3. 添加组件

1. 在左侧 **组件面板** 中找到 "Button" 组件
2. 将其拖拽到中央画布
3. 在右侧 **属性检查器** 中修改按钮文本

### 4. 预览效果

点击顶部工具栏的 **"预览"** 按钮，查看实时效果。

### 5. 导出代码

1. 点击 **"导出"** 按钮
2. 选择目标框架（如 React）
3. 预览生成的代码
4. 下载或复制代码

## 项目结构

一个典型的 MdrFrontEngine 项目结构如下：

```
my-project/
├── pages/                  # 页面目录
│   ├── index.mir.json     # 首页
│   └── about.mir.json     # 关于页
├── components/             # 自定义组件
│   └── MyButton.mir.json
├── assets/                 # 静态资源
│   └── logo.png
├── graphs/                 # 节点图逻辑
│   └── click-handler.json
└── project.json           # 项目配置
```

## 编辑器界面概览

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  项目名称      [预览] [导出] [设置]      [用户]      │
├──────────┬────────────────────────────────┬────────────────┤
│          │                                │                │
│  组件    │                                │    属性        │
│  面板    │         画布 / 预览区          │    检查器      │
│          │                                │                │
│          │                                │                │
├──────────┤                                ├────────────────┤
│  组件树  │                                │    样式        │
│          │                                │    编辑器      │
└──────────┴────────────────────────────────┴────────────────┘
```

### 主要区域

- **顶部工具栏** - 项目操作、预览、导出等功能
- **组件面板** - 可拖拽的组件列表
- **组件树** - 页面组件层级结构
- **画布** - 可视化设计区域
- **属性检查器** - 编辑选中组件的属性
- **样式编辑器** - 调整组件样式

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl/Cmd + S` | 保存项目 |
| `Ctrl/Cmd + Z` | 撤销 |
| `Ctrl/Cmd + Shift + Z` | 重做 |
| `Delete` | 删除选中组件 |
| `Ctrl/Cmd + D` | 复制组件 |
| `Ctrl/Cmd + G` | 组合组件 |
| `Space + 拖拽` | 平移画布 |
| `Ctrl/Cmd + 滚轮` | 缩放画布 |

## 常见问题

### 端口被占用

如果 5173 端口被占用，Vite 会自动尝试下一个可用端口（5174, 5175 等）。

### 依赖安装失败

尝试清理缓存后重新安装：

```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

### 热更新不工作

确保你的编辑器没有锁定文件，或尝试重启开发服务器。

## 下一步

恭喜你完成了第一个 MdrFrontEngine 项目！接下来，你可以：

- [深入了解蓝图编辑器](/guide/blueprint-editor)
- [学习节点图编程](/guide/node-graph)
- [探索组件系统](/guide/components)
- [了解代码导出](/guide/export)
