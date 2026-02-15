# MIR 中间表示

MIR（Modular Intermediate Representation）是 MdrFrontEngine 的核心创新，它是一种框架无关的组件描述格式，使得"一次设计，多端运行"成为可能。

## 什么是 MIR？

MIR 是一种 JSON 格式的组件描述语言，它抽象了不同前端框架的差异，提供统一的组件表示方式。

```json
{
  "$schema": "https://mdr.dev/schemas/mir/1.0.json",
  "version": "1.0",
  "type": "page",
  "root": {
    "type": "MdrContainer",
    "props": {
      "layout": "flex",
      "direction": "column"
    },
    "children": [
      {
        "type": "MdrText",
        "props": {
          "content": "Hello, MdrFrontEngine!",
          "variant": "h1"
        }
      },
      {
        "type": "MdrButton",
        "props": {
          "variant": "primary",
          "size": "medium"
        },
        "children": ["点击我"],
        "events": {
          "onClick": {
            "type": "graph",
            "ref": "click-handler"
          }
        }
      }
    ]
  }
}
```

## MIR 的设计目标

1. **框架无关** - 不绑定任何特定前端框架
2. **可读性强** - JSON 格式，人机皆可读
3. **类型安全** - JSON Schema 验证，避免运行时错误
4. **可扩展性** - 支持自定义组件和属性
5. **双向转换** - 支持与各框架代码相互转换

## MIR 文档结构

### 顶层结构

```json
{
  "$schema": "...",     // JSON Schema 引用
  "version": "1.0",     // MIR 版本
  "type": "page",       // 文档类型: page | component | template
  "meta": {...},        // 元信息
  "imports": [...],     // 导入声明
  "root": {...}         // 根组件
}
```

### 元信息 (meta)

```json
{
  "meta": {
    "name": "HomePage",
    "title": "首页",
    "description": "应用首页",
    "author": "MFE Team",
    "created": "2024-01-01T00:00:00Z",
    "modified": "2024-01-15T12:30:00Z"
  }
}
```

### 导入声明 (imports)

```json
{
  "imports": [
    {
      "from": "@mdr/ui",
      "components": ["MdrButton", "MdrInput"]
    },
    {
      "from": "./components/CustomCard",
      "components": ["CustomCard"]
    },
    {
      "from": "antd",
      "components": ["Table", "Modal"]
    }
  ]
}
```

## 组件节点结构

每个组件节点包含以下字段：

```json
{
  "id": "btn-1",              // 唯一标识（可选，自动生成）
  "type": "MdrButton",        // 组件类型
  "props": {...},             // 属性
  "children": [...],          // 子节点
  "events": {...},            // 事件处理
  "bindings": {...},          // 数据绑定
  "styles": {...},            // 内联样式
  "className": "...",         // CSS 类名
  "condition": {...},         // 条件渲染
  "loop": {...}               // 循环渲染
}
```

### 属性 (props)

```json
{
  "props": {
    "variant": "primary", // 静态值
    "disabled": false,
    "size": "medium",
    "onClick": {
      // 函数属性
      "$type": "function",
      "ref": "handleClick"
    }
  }
}
```

### 子节点 (children)

子节点可以是：

```json
{
  "children": [
    "纯文本内容", // 文本节点
    {
      // 组件节点
      "type": "MdrIcon",
      "props": { "name": "check" }
    },
    {
      // 动态内容
      "$type": "expression",
      "value": "user.name"
    }
  ]
}
```

### 事件处理 (events)

```json
{
  "events": {
    "onClick": {
      "type": "graph", // 节点图
      "ref": "click-handler"
    },
    "onChange": {
      "type": "action", // 预设操作
      "action": "setState",
      "params": {
        "key": "inputValue",
        "value": "$event.target.value"
      }
    },
    "onSubmit": {
      "type": "code", // 代码片段
      "code": "console.log('submitted', data)"
    }
  }
}
```

### 数据绑定 (bindings)

```json
{
  "bindings": {
    "content": {
      "source": "state", // 状态绑定
      "path": "user.name"
    },
    "items": {
      "source": "api", // API 绑定
      "endpoint": "/api/users",
      "path": "data.list"
    },
    "visible": {
      "source": "expression", // 表达式
      "value": "user.role === 'admin'"
    }
  }
}
```

### 条件渲染 (condition)

```json
{
  "condition": {
    "type": "expression",
    "value": "isLoggedIn",
    "else": {
      // 可选的 else 分支
      "type": "MdrText",
      "props": { "content": "请先登录" }
    }
  }
}
```

### 循环渲染 (loop)

```json
{
  "loop": {
    "source": "users",
    "item": "user",
    "index": "idx",
    "key": "user.id"
  },
  "type": "MdrCard",
  "props": {
    "title": { "$type": "expression", "value": "user.name" }
  }
}
```

## 表达式语法

MIR 使用特殊的表达式格式表示动态值：

### 变量引用

```json
{ "$type": "expression", "value": "user.name" }
```

### 模板字符串

```json
{ "$type": "template", "value": "Hello, ${user.name}!" }
```

### 函数调用

```json
{
  "$type": "call",
  "function": "formatDate",
  "args": ["user.createdAt", "YYYY-MM-DD"]
}
```

### 简写语法

在支持的上下文中，可以使用简写：

```json
{
  "props": {
    "title": "${user.name}", // 自动识别为模板
    "count": "$items.length" // 自动识别为表达式
  }
}
```

## 内置组件

MIR 定义了一套标准的内置组件：

### 布局组件

| 组件         | 说明     | 关键属性                  |
| ------------ | -------- | ------------------------- |
| MdrContainer | 容器     | layout, padding, gap      |
| MdrGrid      | 网格布局 | columns, rows, gap        |
| MdrFlex      | 弹性布局 | direction, justify, align |
| MdrStack     | 堆叠布局 | spacing, direction        |

### 基础组件

| 组件      | 说明 | 关键属性                |
| --------- | ---- | ----------------------- |
| MdrText   | 文本 | content, variant, color |
| MdrButton | 按钮 | variant, size, disabled |
| MdrLink   | 链接 | href, target            |
| MdrImage  | 图片 | src, alt, objectFit     |
| MdrIcon   | 图标 | name, size, color       |

### 表单组件

| 组件        | 说明     | 关键属性                 |
| ----------- | -------- | ------------------------ |
| MdrInput    | 输入框   | type, placeholder, value |
| MdrSelect   | 下拉选择 | options, value           |
| MdrCheckbox | 复选框   | checked, label           |
| MdrRadio    | 单选框   | options, value           |
| MdrTextarea | 多行输入 | rows, placeholder        |

### 数据组件

| 组件     | 说明 | 关键属性            |
| -------- | ---- | ------------------- |
| MdrTable | 表格 | columns, dataSource |
| MdrList  | 列表 | items, renderItem   |
| MdrCard  | 卡片 | title, content      |

## 代码生成

MIR 可以转换为多种框架代码：

### React (JSX)

```jsx
// 从 MIR 生成的 React 代码
import { Container, Text, Button } from '@mdr/ui';

export function HomePage() {
  const handleClick = useCallback(() => {
    // 来自节点图
  }, []);

  return (
    <Container layout="flex" direction="column">
      <Text variant="h1">Hello, MdrFrontEngine!</Text>
      <Button variant="primary" size="medium" onClick={handleClick}>
        点击我
      </Button>
    </Container>
  );
}
```

### Vue 3 (SFC)

```vue
<!-- 从 MIR 生成的 Vue 代码 -->
<template>
  <MdrContainer layout="flex" direction="column">
    <MdrText variant="h1">Hello, MdrFrontEngine!</MdrText>
    <MdrButton variant="primary" size="medium" @click="handleClick">
      点击我
    </MdrButton>
  </MdrContainer>
</template>

<script setup>
import { MdrContainer, MdrText, MdrButton } from '@mdr/ui-vue';

const handleClick = () => {
  // 来自节点图
};
</script>
```

### HTML/CSS/JS

```html
<!-- 从 MIR 生成的原生 Web 代码 -->
<div class="mdr-container" style="display: flex; flex-direction: column;">
  <h1 class="mdr-text">Hello, MdrFrontEngine!</h1>
  <button
    class="mdr-button mdr-button--primary mdr-button--medium"
    onclick="handleClick()"
  >
    点击我
  </button>
</div>

<script>
  function handleClick() {
    // 来自节点图
  }
</script>
```

## JSON Schema 验证

MIR 文件通过 JSON Schema 进行验证：

```json
{
  "$schema": "https://mdr.dev/schemas/mir/1.0.json"
}
```

### 验证错误示例

```
Error: Invalid MIR document
  at root.children[0].props.variant
  Expected: "h1" | "h2" | "h3" | "h4" | "body" | "caption"
  Received: "heading"
```

## 最佳实践

### 1. 使用有意义的 ID

```json
{
  "id": "hero-title", // ✅ 语义化
  "id": "node-123" // ❌ 无意义
}
```

### 2. 保持结构扁平

```json
// ✅ 合理的嵌套
{
  "type": "MdrContainer",
  "children": [
    { "type": "MdrText" },
    { "type": "MdrButton" }
  ]
}

// ❌ 过度嵌套
{
  "type": "MdrContainer",
  "children": [{
    "type": "MdrContainer",
    "children": [{
      "type": "MdrContainer",
      "children": [...]
    }]
  }]
}
```

### 3. 复用组件

创建可复用的组件模板，通过 imports 引入。

### 4. 类型检查

始终包含 `$schema` 以启用 IDE 类型检查和自动补全。

## 下一步

- [组件系统](/guide/components) - 深入了解组件设计
- [MIR 规范](/reference/mir-spec) - 完整的语法规范
- [代码导出](/guide/export) - 导出为框架代码
