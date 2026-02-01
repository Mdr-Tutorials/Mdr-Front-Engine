# MIR 语法规范

本文档详细描述 MIR（Modular Intermediate Representation）的完整语法规范，包括文档结构、组件定义、表达式语法和验证规则。

## 版本

当前规范版本：**1.0**

## 文档结构

### 完整结构

```json
{
  "$schema": "https://mdr.dev/schemas/mir/1.0.json",
  "version": "1.0",
  "type": "page | component | template",
  "meta": { ... },
  "imports": [ ... ],
  "state": { ... },
  "computed": { ... },
  "methods": { ... },
  "props": { ... },
  "slots": { ... },
  "root": { ... }
}
```

### 必需字段

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `version` | string | MIR 版本号 |
| `type` | enum | 文档类型 |
| `root` | object | 根组件节点 |

### 可选字段

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `$schema` | string | JSON Schema URL |
| `meta` | object | 元信息 |
| `imports` | array | 导入声明 |
| `state` | object | 状态定义 |
| `computed` | object | 计算属性 |
| `methods` | object | 方法定义 |
| `props` | object | 属性定义（仅 component 类型） |
| `slots` | object | 插槽定义（仅 component 类型） |

## 文档类型

### page

页面类型，表示一个完整的页面。

```json
{
  "type": "page",
  "meta": {
    "route": "/home",
    "title": "首页"
  }
}
```

### component

组件类型，表示可复用的组件。

```json
{
  "type": "component",
  "props": {
    "title": { "type": "string", "required": true }
  }
}
```

### template

模板类型，表示页面模板。

```json
{
  "type": "template",
  "meta": {
    "name": "BlogLayout",
    "description": "博客页面布局模板"
  }
}
```

## 元信息 (meta)

```json
{
  "meta": {
    "name": "HomePage",
    "title": "首页",
    "description": "应用首页",
    "author": "MFE Team",
    "version": "1.0.0",
    "created": "2024-01-01T00:00:00Z",
    "modified": "2024-01-15T12:30:00Z",
    "tags": ["home", "landing"],
    "route": "/",
    "layout": "default"
  }
}
```

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `name` | string | 名称标识符 |
| `title` | string | 显示标题 |
| `description` | string | 描述文本 |
| `author` | string | 作者 |
| `version` | string | 版本号 |
| `created` | string (ISO 8601) | 创建时间 |
| `modified` | string (ISO 8601) | 修改时间 |
| `tags` | array[string] | 标签 |
| `route` | string | 路由路径 |
| `layout` | string | 布局模板 |

## 导入声明 (imports)

### 语法

```json
{
  "imports": [
    {
      "from": "source",
      "components": ["Component1", "Component2"],
      "default": "DefaultExport",
      "named": { "originalName": "alias" }
    }
  ]
}
```

### 示例

```json
{
  "imports": [
    {
      "from": "@mdr/ui",
      "components": ["MdrButton", "MdrInput", "MdrModal"]
    },
    {
      "from": "./components/CustomCard",
      "components": ["CustomCard"]
    },
    {
      "from": "lodash",
      "named": { "debounce": "debounce", "throttle": "throttle" }
    },
    {
      "from": "axios",
      "default": "axios"
    }
  ]
}
```

## 状态定义 (state)

### 语法

```json
{
  "state": {
    "stateName": {
      "type": "string | number | boolean | array | object",
      "default": "defaultValue",
      "description": "状态描述"
    }
  }
}
```

### 示例

```json
{
  "state": {
    "count": {
      "type": "number",
      "default": 0,
      "description": "计数器值"
    },
    "items": {
      "type": "array",
      "default": [],
      "items": { "type": "object" }
    },
    "user": {
      "type": "object",
      "default": null,
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" }
      }
    },
    "isLoading": {
      "type": "boolean",
      "default": false
    }
  }
}
```

## 计算属性 (computed)

### 语法

```json
{
  "computed": {
    "propertyName": {
      "expression": "expression",
      "dependencies": ["dep1", "dep2"]
    }
  }
}
```

### 示例

```json
{
  "computed": {
    "fullName": {
      "expression": "state.firstName + ' ' + state.lastName",
      "dependencies": ["firstName", "lastName"]
    },
    "itemCount": {
      "expression": "state.items.length",
      "dependencies": ["items"]
    },
    "isValid": {
      "expression": "state.email.includes('@') && state.password.length >= 8",
      "dependencies": ["email", "password"]
    }
  }
}
```

## 方法定义 (methods)

### 语法

```json
{
  "methods": {
    "methodName": {
      "params": ["param1", "param2"],
      "body": "code or graph reference",
      "async": false
    }
  }
}
```

### 代码方法

```json
{
  "methods": {
    "increment": {
      "body": "setState({ count: state.count + 1 })"
    },
    "fetchData": {
      "async": true,
      "body": "const res = await fetch('/api/data'); return res.json();"
    }
  }
}
```

### 节点图方法

```json
{
  "methods": {
    "handleSubmit": {
      "params": ["formData"],
      "graph": "submit-handler"
    }
  }
}
```

## 组件属性定义 (props)

### 语法

```json
{
  "props": {
    "propName": {
      "type": "string | number | boolean | array | object | function",
      "required": false,
      "default": "defaultValue",
      "description": "属性描述",
      "validator": "expression"
    }
  }
}
```

### 示例

```json
{
  "props": {
    "title": {
      "type": "string",
      "required": true,
      "description": "卡片标题"
    },
    "size": {
      "type": "string",
      "enum": ["small", "medium", "large"],
      "default": "medium",
      "description": "卡片尺寸"
    },
    "items": {
      "type": "array",
      "default": [],
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "number" },
          "name": { "type": "string" }
        }
      }
    },
    "onClick": {
      "type": "function",
      "description": "点击回调"
    },
    "count": {
      "type": "number",
      "default": 0,
      "validator": "value >= 0 && value <= 100"
    }
  }
}
```

## 插槽定义 (slots)

### 语法

```json
{
  "slots": {
    "slotName": {
      "description": "插槽描述",
      "props": { ... }
    }
  }
}
```

### 示例

```json
{
  "slots": {
    "default": {
      "description": "默认内容插槽"
    },
    "header": {
      "description": "头部插槽"
    },
    "footer": {
      "description": "底部插槽"
    },
    "item": {
      "description": "列表项插槽",
      "props": {
        "item": { "type": "object" },
        "index": { "type": "number" }
      }
    }
  }
}
```

## 组件节点结构

### 完整结构

```json
{
  "id": "unique-id",
  "type": "ComponentType",
  "ref": "refName",
  "props": { ... },
  "children": [ ... ],
  "events": { ... },
  "bindings": { ... },
  "styles": { ... },
  "className": "class-name",
  "condition": { ... },
  "loop": { ... }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 描述 |
| --- | --- | --- | --- |
| `id` | string | 否 | 唯一标识符 |
| `type` | string | 是 | 组件类型 |
| `ref` | string | 否 | 引用名称 |
| `props` | object | 否 | 组件属性 |
| `children` | array | 否 | 子节点 |
| `events` | object | 否 | 事件处理 |
| `bindings` | object | 否 | 数据绑定 |
| `styles` | object | 否 | 内联样式 |
| `className` | string | 否 | CSS 类名 |
| `condition` | object | 否 | 条件渲染 |
| `loop` | object | 否 | 循环渲染 |

## 子节点 (children)

### 文本节点

```json
{
  "children": ["纯文本内容"]
}
```

### 组件节点

```json
{
  "children": [
    {
      "type": "MdrText",
      "props": { "content": "文本" }
    }
  ]
}
```

### 动态内容

```json
{
  "children": [
    { "$expr": "user.name" },
    { "$t": "greeting", "params": { "name": "${user.name}" } }
  ]
}
```

### 混合内容

```json
{
  "children": [
    "Hello, ",
    { "$expr": "user.name" },
    "!",
    { "type": "MdrIcon", "props": { "name": "check" } }
  ]
}
```

## 事件处理 (events)

### 节点图引用

```json
{
  "events": {
    "onClick": {
      "type": "graph",
      "ref": "click-handler",
      "params": { "id": "${item.id}" }
    }
  }
}
```

### 预设操作

```json
{
  "events": {
    "onClick": {
      "type": "action",
      "action": "navigate",
      "params": { "path": "/detail/${item.id}" }
    },
    "onChange": {
      "type": "action",
      "action": "setState",
      "params": { "key": "value", "value": "$event.target.value" }
    }
  }
}
```

### 代码片段

```json
{
  "events": {
    "onClick": {
      "type": "code",
      "code": "console.log('clicked', event)"
    }
  }
}
```

### 方法引用

```json
{
  "events": {
    "onClick": {
      "type": "method",
      "name": "handleClick",
      "params": ["${item.id}"]
    }
  }
}
```

### 预设操作列表

| 操作 | 参数 | 描述 |
| --- | --- | --- |
| `setState` | key, value | 更新状态 |
| `navigate` | path, params | 页面跳转 |
| `showToast` | message, type | 显示提示 |
| `showModal` | ref | 显示模态框 |
| `hideModal` | ref | 隐藏模态框 |
| `fetch` | url, options | HTTP 请求 |
| `submit` | formRef | 提交表单 |
| `reset` | formRef | 重置表单 |

## 数据绑定 (bindings)

### 状态绑定

```json
{
  "bindings": {
    "value": {
      "source": "state",
      "path": "formData.username"
    }
  }
}
```

### 属性绑定

```json
{
  "bindings": {
    "title": {
      "source": "props",
      "path": "cardTitle"
    }
  }
}
```

### 计算属性绑定

```json
{
  "bindings": {
    "label": {
      "source": "computed",
      "path": "fullName"
    }
  }
}
```

### 表达式绑定

```json
{
  "bindings": {
    "disabled": {
      "source": "expression",
      "value": "!state.isValid || state.isLoading"
    }
  }
}
```

### API 绑定

```json
{
  "bindings": {
    "items": {
      "source": "api",
      "endpoint": "/api/users",
      "method": "GET",
      "path": "data.list",
      "refresh": "onMount"
    }
  }
}
```

## 条件渲染 (condition)

### 基本条件

```json
{
  "condition": {
    "type": "expression",
    "value": "isLoggedIn"
  }
}
```

### 带 else 分支

```json
{
  "condition": {
    "type": "expression",
    "value": "user !== null",
    "else": {
      "type": "MdrText",
      "props": { "content": "请先登录" }
    }
  }
}
```

### 多条件

```json
{
  "condition": {
    "type": "switch",
    "value": "status",
    "cases": {
      "loading": { "type": "MdrSpinner" },
      "error": { "type": "MdrAlert", "props": { "type": "error" } },
      "success": { "type": "MdrText", "props": { "content": "成功" } }
    },
    "default": { "type": "MdrText", "props": { "content": "未知状态" } }
  }
}
```

## 循环渲染 (loop)

### 基本循环

```json
{
  "loop": {
    "source": "items",
    "item": "item",
    "key": "item.id"
  },
  "type": "MdrCard",
  "props": {
    "title": { "$expr": "item.name" }
  }
}
```

### 带索引

```json
{
  "loop": {
    "source": "items",
    "item": "item",
    "index": "idx",
    "key": "item.id"
  }
}
```

### 范围循环

```json
{
  "loop": {
    "type": "range",
    "start": 1,
    "end": 10,
    "item": "num"
  }
}
```

### 对象循环

```json
{
  "loop": {
    "source": "userMap",
    "key": "userId",
    "value": "userData"
  }
}
```

## 表达式语法

### 变量引用

```
state.count          // 状态
props.title          // 属性
computed.fullName    // 计算属性
item.name            // 循环变量
$event               // 事件对象
$refs.form           // 引用
```

### 运算符

```
// 算术
a + b, a - b, a * b, a / b, a % b

// 比较
a === b, a !== b, a > b, a < b, a >= b, a <= b

// 逻辑
a && b, a || b, !a

// 三元
condition ? trueValue : falseValue

// 可选链
user?.profile?.name

// 空值合并
value ?? defaultValue
```

### 内置函数

```
// 数组
items.length
items.map(x => x.name)
items.filter(x => x.active)
items.find(x => x.id === id)
items.includes(value)
items.join(separator)

// 字符串
str.toUpperCase()
str.toLowerCase()
str.trim()
str.split(separator)
str.replace(pattern, replacement)

// 数学
Math.round(value)
Math.floor(value)
Math.ceil(value)
Math.max(...values)
Math.min(...values)

// 日期
new Date().toISOString()
Date.now()
```

### 表达式简写

```json
// 完整形式
{ "$expr": "state.count + 1" }

// 模板字符串
"Total: ${state.count}"

// 属性引用
"$state.count"
```

## 验证规则

### 必需的顶层字段

- `version` 必须是有效的版本号
- `type` 必须是 `page`、`component` 或 `template`
- `root` 必须是有效的组件节点

### 组件节点验证

- `type` 必须是有效的组件类型
- `id` 如果提供，必须在文档内唯一
- `props` 值必须符合组件的属性定义
- `children` 必须是有效的子节点数组

### 表达式验证

- 引用的状态、属性、计算属性必须已定义
- 函数调用必须使用有效的函数名
- 类型必须兼容

## JSON Schema

完整的 JSON Schema 定义参见：

```
https://mdr.dev/schemas/mir/1.0.json
```

### 在编辑器中启用验证

```json
{
  "$schema": "https://mdr.dev/schemas/mir/1.0.json"
}
```

## 下一步

- [组件规范](/reference/component-spec) - 组件 API 详细规范
- [节点规范](/reference/node-spec) - 节点图节点规范
- [MIR 概念](/guide/mir) - MIR 使用指南
