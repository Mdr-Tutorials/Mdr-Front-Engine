# 主题定制

MdrFrontEngine 提供灵活的主题系统，支持通过 CSS 变量、设计令牌和主题配置来定制应用外观。

## 主题系统概述

MdrFrontEngine 的主题系统基于以下核心概念：

1. **CSS 变量** - 使用 CSS 自定义属性定义设计令牌
2. **设计令牌** - 颜色、间距、圆角等可配置值
3. **主题模式** - 浅色/深色模式切换
4. **组件变体** - 每个组件支持多种视觉变体

## CSS 变量

### 颜色系统

MdrFrontEngine 使用 10 级灰度和语义化颜色：

```css
:root {
  /* 灰度 */
  --mdr-gray-0: #ffffff;
  --mdr-gray-1: #f8f9fa;
  --mdr-gray-2: #e9ecef;
  --mdr-gray-3: #dee2e6;
  --mdr-gray-4: #ced4da;
  --mdr-gray-5: #adb5bd;
  --mdr-gray-6: #6c757d;
  --mdr-gray-7: #495057;
  --mdr-gray-8: #343a40;
  --mdr-gray-9: #212529;
  --mdr-gray-10: #000000;

  /* 主色 */
  --mdr-color-primary: #5f67ee;
  --mdr-color-primary-hover: #4c54d8;
  --mdr-color-primary-active: #3d45c2;
  --mdr-color-primary-light: #eef0ff;

  /* 语义色 */
  --mdr-color-success: #10b981;
  --mdr-color-warning: #f59e0b;
  --mdr-color-danger: #ef4444;
  --mdr-color-info: #3b82f6;

  /* 文本色 */
  --mdr-color-text: var(--mdr-gray-9);
  --mdr-color-text-secondary: var(--mdr-gray-6);
  --mdr-color-text-muted: var(--mdr-gray-5);

  /* 背景色 */
  --mdr-color-background: var(--mdr-gray-0);
  --mdr-color-surface: var(--mdr-gray-1);
  --mdr-color-border: var(--mdr-gray-3);
}
```

### 间距系统

```css
:root {
  --mdr-spacing-0: 0;
  --mdr-spacing-1: 0.25rem; /* 4px */
  --mdr-spacing-2: 0.5rem; /* 8px */
  --mdr-spacing-3: 0.75rem; /* 12px */
  --mdr-spacing-4: 1rem; /* 16px */
  --mdr-spacing-5: 1.25rem; /* 20px */
  --mdr-spacing-6: 1.5rem; /* 24px */
  --mdr-spacing-8: 2rem; /* 32px */
  --mdr-spacing-10: 2.5rem; /* 40px */
  --mdr-spacing-12: 3rem; /* 48px */
  --mdr-spacing-16: 4rem; /* 64px */
}
```

### 圆角

```css
:root {
  --mdr-radius-none: 0;
  --mdr-radius-sm: 0.25rem; /* 4px */
  --mdr-radius-md: 0.5rem; /* 8px */
  --mdr-radius-lg: 0.75rem; /* 12px */
  --mdr-radius-xl: 1rem; /* 16px */
  --mdr-radius-full: 9999px;
}
```

### 阴影

```css
:root {
  --mdr-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --mdr-shadow-md:
    0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --mdr-shadow-lg:
    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --mdr-shadow-xl:
    0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

### 字体

```css
:root {
  /* 字体族 */
  --mdr-font-sans: ui-sans-serif, system-ui, sans-serif;
  --mdr-font-mono: ui-monospace, monospace;

  /* 字号 */
  --mdr-text-xs: 0.75rem; /* 12px */
  --mdr-text-sm: 0.875rem; /* 14px */
  --mdr-text-base: 1rem; /* 16px */
  --mdr-text-lg: 1.125rem; /* 18px */
  --mdr-text-xl: 1.25rem; /* 20px */
  --mdr-text-2xl: 1.5rem; /* 24px */
  --mdr-text-3xl: 1.875rem; /* 30px */
  --mdr-text-4xl: 2.25rem; /* 36px */

  /* 字重 */
  --mdr-font-normal: 400;
  --mdr-font-medium: 500;
  --mdr-font-semibold: 600;
  --mdr-font-bold: 700;

  /* 行高 */
  --mdr-leading-tight: 1.25;
  --mdr-leading-normal: 1.5;
  --mdr-leading-relaxed: 1.75;
}
```

## 深色模式

### 自动切换

MdrFrontEngine 默认根据系统设置自动切换：

```css
@media (prefers-color-scheme: dark) {
  :root {
    --mdr-color-background: var(--mdr-gray-9);
    --mdr-color-surface: var(--mdr-gray-8);
    --mdr-color-text: var(--mdr-gray-1);
    --mdr-color-text-secondary: var(--mdr-gray-4);
    --mdr-color-border: var(--mdr-gray-7);
  }
}
```

### 手动切换

使用 `data-theme` 属性手动控制：

```html
<html data-theme="light">
  <!-- 浅色模式 -->
  <html data-theme="dark">
    <!-- 深色模式 -->
  </html>
</html>
```

```css
[data-theme='dark'] {
  --mdr-color-background: #1a1a1a;
  --mdr-color-surface: #2d2d2d;
  --mdr-color-text: #ffffff;
  /* ... */
}
```

### 在 MIR 中切换主题

```json
{
  "type": "MdrButton",
  "props": {
    "variant": "outline",
    "icon": "sun"
  },
  "events": {
    "onClick": {
      "type": "code",
      "code": "document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'"
    }
  }
}
```

## 自定义主题

### 创建主题文件

```css
/* themes/custom.css */
:root {
  /* 自定义主色 */
  --mdr-color-primary: #ff6b6b;
  --mdr-color-primary-hover: #ee5a5a;
  --mdr-color-primary-active: #dd4a4a;

  /* 自定义圆角 */
  --mdr-radius-md: 12px;
  --mdr-radius-lg: 16px;

  /* 自定义字体 */
  --mdr-font-sans: 'Inter', sans-serif;
}
```

### 在项目中使用

```json
// project.json
{
  "theme": {
    "extends": "default",
    "customCSS": "./themes/custom.css",
    "variables": {
      "color-primary": "#ff6b6b"
    }
  }
}
```

### 导出时应用

导出代码时，主题配置会被转换为 CSS 文件：

```bash
mdr export --target react --theme ./themes/custom.css
```

## 组件级样式

### 覆盖组件样式

```css
/* 全局覆盖按钮样式 */
.mdr-button {
  font-weight: var(--mdr-font-semibold);
  text-transform: uppercase;
}

/* 覆盖特定变体 */
.mdr-button--primary {
  background: linear-gradient(135deg, var(--mdr-color-primary), #8b5cf6);
}
```

### 在 MIR 中使用自定义类

```json
{
  "type": "MdrButton",
  "props": {
    "variant": "primary"
  },
  "className": "my-custom-button",
  "children": ["自定义按钮"]
}
```

### 内联样式

```json
{
  "type": "MdrContainer",
  "styles": {
    "background": "linear-gradient(to right, #667eea, #764ba2)",
    "padding": "2rem",
    "borderRadius": "1rem"
  }
}
```

## 设计令牌配置

### tokens.json

```json
{
  "colors": {
    "primary": {
      "value": "#5f67ee",
      "description": "主色调"
    },
    "secondary": {
      "value": "#6b7280",
      "description": "次要色"
    }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" }
  },
  "borderRadius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" }
  }
}
```

### 从 Figma 导入

MdrFrontEngine 支持从 Figma 导入设计令牌：

1. 在 Figma 中使用 **Tokens Studio** 插件导出
2. 在 MdrFrontEngine 中选择 **"导入设计令牌"**
3. 上传 JSON 文件
4. 预览并确认

## Tailwind CSS 集成

MdrFrontEngine 支持使用 Tailwind CSS：

### 配置文件

```javascript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--mdr-color-primary)',
        secondary: 'var(--mdr-color-secondary)',
      },
      spacing: {
        'mdr-1': 'var(--mdr-spacing-1)',
        'mdr-2': 'var(--mdr-spacing-2)',
      },
    },
  },
};
```

### 在 MIR 中使用

```json
{
  "type": "MdrContainer",
  "className": "flex flex-col gap-4 p-6 bg-gray-100 rounded-lg"
}
```

## 响应式设计

### 断点

```css
:root {
  --mdr-breakpoint-sm: 640px;
  --mdr-breakpoint-md: 768px;
  --mdr-breakpoint-lg: 1024px;
  --mdr-breakpoint-xl: 1280px;
  --mdr-breakpoint-2xl: 1536px;
}
```

### 响应式样式

```json
{
  "type": "MdrGrid",
  "props": {
    "columns": {
      "default": 1,
      "sm": 2,
      "md": 3,
      "lg": 4
    },
    "gap": "16px"
  }
}
```

## 无障碍设计

### 色彩对比度

所有颜色组合符合 WCAG 2.1 AA 标准（对比度 ≥ 4.5:1）：

```css
/* 确保文本可读性 */
--mdr-color-text: var(--mdr-gray-9); /* 在白色背景上 */
--mdr-color-text-on-primary: #ffffff; /* 在主色背景上 */
```

### 焦点样式

```css
/* 键盘焦点指示器 */
:focus-visible {
  outline: 2px solid var(--mdr-color-primary);
  outline-offset: 2px;
}
```

### 动画偏好

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 最佳实践

### 1. 使用语义化变量

```css
/* ✅ 推荐：语义化 */
color: var(--mdr-color-text-secondary);

/* ❌ 避免：直接使用灰度 */
color: var(--mdr-gray-6);
```

### 2. 保持一致性

使用设计系统中定义的值，避免硬编码：

```css
/* ✅ 推荐 */
padding: var(--mdr-spacing-4);
border-radius: var(--mdr-radius-md);

/* ❌ 避免 */
padding: 17px;
border-radius: 7px;
```

### 3. 测试深色模式

始终在两种模式下测试你的自定义样式。

## 下一步

- [国际化](/guide/i18n) - 多语言支持
- [组件系统](/guide/components) - 组件样式详情
- [代码导出](/guide/export) - 导出带主题的代码
