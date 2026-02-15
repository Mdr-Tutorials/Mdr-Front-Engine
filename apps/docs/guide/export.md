# 代码导出

MdrFrontEngine 支持将可视化设计导出为多种前端框架的生产级代码。本文档介绍导出功能的使用方法和各框架的输出特点。

## 导出流程

### 1. 打开导出面板

在编辑器中，点击顶部工具栏的 **"导出"** 按钮，或使用快捷键 `Ctrl/Cmd + Shift + E`。

### 2. 选择导出目标

```
┌─────────────────────────────────────────────┐
│  导出项目                                    │
├─────────────────────────────────────────────┤
│  目标框架:                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │React│ │ Vue │ │Angu-│ │Solid│ │ Web │   │
│  │     │ │  3  │ │lar  │ │ JS  │ │     │   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
│                                             │
│  导出范围:                                   │
│  ○ 当前页面                                  │
│  ● 整个项目                                  │
│  ○ 选中组件                                  │
│                                             │
│  输出选项:                                   │
│  ☑ 包含样式文件                              │
│  ☑ 包含类型定义                              │
│  ☑ 生成路由配置                              │
│  ☐ 包含测试文件                              │
│                                             │
│  [预览代码]              [下载 ZIP] [复制]   │
└─────────────────────────────────────────────┘
```

### 3. 预览和下载

- **预览代码** - 在面板内查看生成的代码
- **下载 ZIP** - 下载包含所有文件的压缩包
- **复制** - 复制代码到剪贴板
- **推送到 Git** - 直接推送到 GitHub/GitLab（需授权）

## 支持的框架

### React

**输出格式**: JSX + Hooks (TypeScript)

```tsx
// pages/Home.tsx
import { useState, useCallback } from 'react';
import { Container, Text, Button } from '@mdr/ui';
import styles from './Home.module.css';

export function Home() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return (
    <Container className={styles.container} layout="flex" direction="column">
      <Text variant="h1">计数器: {count}</Text>
      <Button variant="primary" onClick={handleClick}>
        增加
      </Button>
    </Container>
  );
}
```

**输出结构**:

```
dist/
├── src/
│   ├── components/           # 组件
│   ├── pages/               # 页面
│   ├── hooks/               # 自定义 Hooks
│   ├── styles/              # 样式文件
│   └── App.tsx              # 根组件
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### Vue 3

**输出格式**: SFC + Composition API (TypeScript)

```vue
<!-- pages/Home.vue -->
<template>
  <MdrContainer class="container" layout="flex" direction="column">
    <MdrText variant="h1">计数器: {{ count }}</MdrText>
    <MdrButton variant="primary" @click="handleClick"> 增加 </MdrButton>
  </MdrContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MdrContainer, MdrText, MdrButton } from '@mdr/ui-vue';

const count = ref(0);

const handleClick = () => {
  count.value++;
};
</script>

<style scoped>
.container {
  /* 样式 */
}
</style>
```

**输出结构**:

```
dist/
├── src/
│   ├── components/
│   ├── pages/
│   ├── composables/         # 组合式函数
│   └── App.vue
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### Angular

**输出格式**: 组件类 + 模板

```typescript
// pages/home/home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MdrContainerComponent,
  MdrTextComponent,
  MdrButtonComponent,
} from '@mdr/ui-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MdrContainerComponent,
    MdrTextComponent,
    MdrButtonComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  count = 0;

  handleClick() {
    this.count++;
  }
}
```

```html
<!-- pages/home/home.component.html -->
<mdr-container layout="flex" direction="column">
  <mdr-text variant="h1">计数器: {{ count }}</mdr-text>
  <mdr-button variant="primary" (click)="handleClick()"> 增加 </mdr-button>
</mdr-container>
```

### SolidJS

**输出格式**: JSX + 响应式

```tsx
// pages/Home.tsx
import { createSignal } from 'solid-js';
import { Container, Text, Button } from '@mdr/ui-solid';

export function Home() {
  const [count, setCount] = createSignal(0);

  const handleClick = () => {
    setCount((prev) => prev + 1);
  };

  return (
    <Container layout="flex" direction="column">
      <Text variant="h1">计数器: {count()}</Text>
      <Button variant="primary" onClick={handleClick}>
        增加
      </Button>
    </Container>
  );
}
```

### 原生 Web

**输出格式**: HTML + CSS + JavaScript

```html
<!-- pages/home.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>首页</title>
    <link rel="stylesheet" href="../styles/global.css" />
    <link rel="stylesheet" href="./home.css" />
  </head>
  <body>
    <div class="mdr-container" data-layout="flex" data-direction="column">
      <h1 class="mdr-text" data-variant="h1">
        计数器: <span id="count">0</span>
      </h1>
      <button class="mdr-button mdr-button--primary" onclick="handleClick()">
        增加
      </button>
    </div>

    <script src="./home.js"></script>
  </body>
</html>
```

```javascript
// pages/home.js
let count = 0;

function handleClick() {
  count++;
  document.getElementById('count').textContent = count;
}
```

## 导出选项

### 样式处理

| 选项         | 说明                             |
| ------------ | -------------------------------- |
| CSS Modules  | 组件级样式隔离（React/Vue 默认） |
| CSS-in-JS    | 内联样式（Styled Components）    |
| Tailwind CSS | 使用 Tailwind 工具类             |
| 纯 CSS       | 传统 CSS 文件                    |
| SCSS/Sass    | 预处理器语法                     |

### 状态管理

根据项目复杂度，自动选择或手动指定：

| 方案            | 适用场景                     |
| --------------- | ---------------------------- |
| 组件状态        | 简单页面，状态不跨组件       |
| Context/Provide | 中等复杂度，局部状态共享     |
| Zustand/Pinia   | 复杂应用，全局状态管理       |
| Redux/Vuex      | 大型应用，需要时间旅行等功能 |

### 路由配置

自动生成路由配置：

```typescript
// React Router
const routes = [
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
  { path: '/users/:id', element: <UserDetail /> },
];

// Vue Router
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/users/:id', component: UserDetail },
];
```

## 节点图代码生成

节点图会被转换为对应框架的逻辑代码：

### 示例：HTTP 请求 + 状态更新

**节点图**:

```
onClick → SetLoading(true) → HTTP GET → SetState(data) → SetLoading(false)
```

**React 输出**:

```typescript
const handleClick = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
  } finally {
    setLoading(false);
  }
}, []);
```

**Vue 输出**:

```typescript
const handleClick = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    users.value = data;
  } finally {
    loading.value = false;
  }
};
```

## Git 集成

### 推送到 GitHub

1. 点击 **"推送到 Git"**
2. 选择或创建仓库
3. 配置分支和提交信息
4. 确认推送

```
┌─────────────────────────────────────────────┐
│  推送到 GitHub                              │
├─────────────────────────────────────────────┤
│  仓库: my-app                               │
│  分支: main                                 │
│  提交信息: [Export from MdrFrontEngine    ] │
│                                             │
│  ☑ 创建 .gitignore                          │
│  ☑ 创建 README.md                           │
│                                             │
│  [取消]                            [推送]   │
└─────────────────────────────────────────────┘
```

### 支持的平台

- GitHub
- GitLab
- Gitee
- Bitbucket

## CLI 导出

通过命令行导出项目：

```bash
# 导出为 React
mdr export --target react --output ./dist

# 导出为 Vue，包含测试
mdr export --target vue --with-tests --output ./dist

# 导出单个页面
mdr export --target react --page home --output ./dist
```

更多 CLI 选项参见 [CLI 工具文档](/api/cli)。

## 最佳实践

### 1. 代码质量

导出的代码遵循最佳实践：

- ✅ 使用 TypeScript 类型注解
- ✅ 组件职责单一
- ✅ 合理的文件组织
- ✅ 符合 ESLint 规范
- ✅ 可读的变量命名

### 2. 性能优化

- 自动进行代码分割
- 按需加载组件
- 图片懒加载
- CSS 提取和压缩

### 3. 二次开发

导出的代码可以直接用于生产，也可以作为起点进行二次开发：

```bash
cd dist
npm install
npm run dev     # 开发
npm run build   # 构建
npm run preview # 预览
```

## 下一步

- [部署](/guide/deployment) - 部署导出的项目
- [CLI 工具](/api/cli) - 了解命令行导出选项
- [主题定制](/guide/theming) - 定制导出代码的样式
