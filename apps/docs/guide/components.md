# 组件系统

MdrFrontEngine 采用组件化架构，提供丰富的内置组件库，同时支持自定义组件扩展。本文档介绍组件系统的设计理念和使用方法。

## 设计原则

### 1. 一致性

所有组件遵循统一的 API 设计规范：

- 属性命名采用 camelCase
- 事件命名以 `on` 开头
- 尺寸使用 `size` 属性（small, medium, large）
- 变体使用 `variant` 属性

### 2. 可组合性

组件设计为可组合的原子单元：

```
Button + Icon → IconButton
Input + Button → SearchBar
Card + List → CardList
```

### 3. 可访问性

所有组件符合 WCAG 2.1 AA 标准：

- 完善的 ARIA 属性
- 键盘导航支持
- 屏幕阅读器兼容
- 足够的色彩对比度

### 4. 主题化

组件支持主题定制：

- CSS 变量驱动
- 深色/浅色模式
- 可自定义设计令牌

## 组件分类

### 布局组件

用于页面结构和布局的组件。

#### MdrContainer

通用容器组件，支持多种布局模式。

```json
{
  "type": "MdrContainer",
  "props": {
    "layout": "flex",
    "direction": "column",
    "justify": "center",
    "align": "center",
    "gap": "16px",
    "padding": "24px"
  }
}
```

| 属性      | 类型                              | 默认值         | 说明       |
| --------- | --------------------------------- | -------------- | ---------- |
| layout    | `"block"` \| `"flex"` \| `"grid"` | `"block"`      | 布局模式   |
| direction | `"row"` \| `"column"`             | `"row"`        | 主轴方向   |
| justify   | CSS justify-content               | `"flex-start"` | 主轴对齐   |
| align     | CSS align-items                   | `"stretch"`    | 交叉轴对齐 |
| gap       | CSS gap                           | `"0"`          | 子元素间距 |
| padding   | CSS padding                       | `"0"`          | 内边距     |

#### MdrGrid

网格布局组件。

```json
{
  "type": "MdrGrid",
  "props": {
    "columns": 3,
    "gap": "16px",
    "minChildWidth": "200px"
  }
}
```

| 属性          | 类型      | 默认值   | 说明                       |
| ------------- | --------- | -------- | -------------------------- |
| columns       | number    | 12       | 列数                       |
| rows          | number    | auto     | 行数                       |
| gap           | CSS gap   | `"16px"` | 网格间距                   |
| minChildWidth | CSS width | -        | 最小子元素宽度（自动列数） |

### 基础组件

#### MdrButton

按钮组件。

```json
{
  "type": "MdrButton",
  "props": {
    "variant": "primary",
    "size": "medium",
    "disabled": false,
    "loading": false
  },
  "children": ["提交"]
}
```

| 属性         | 类型                                                                   | 默认值      | 说明     |
| ------------ | ---------------------------------------------------------------------- | ----------- | -------- |
| variant      | `"primary"` \| `"secondary"` \| `"outline"` \| `"ghost"` \| `"danger"` | `"primary"` | 按钮变体 |
| size         | `"small"` \| `"medium"` \| `"large"`                                   | `"medium"`  | 按钮尺寸 |
| disabled     | boolean                                                                | false       | 禁用状态 |
| loading      | boolean                                                                | false       | 加载状态 |
| icon         | string                                                                 | -           | 图标名称 |
| iconPosition | `"left"` \| `"right"`                                                  | `"left"`    | 图标位置 |

#### MdrText

文本组件。

```json
{
  "type": "MdrText",
  "props": {
    "variant": "h1",
    "color": "primary",
    "align": "center"
  },
  "children": ["标题文本"]
}
```

| 属性    | 类型                                                            | 默认值      | 说明     |
| ------- | --------------------------------------------------------------- | ----------- | -------- |
| variant | `"h1"` \| `"h2"` \| `"h3"` \| `"h4"` \| `"body"` \| `"caption"` | `"body"`    | 文本变体 |
| color   | string                                                          | `"inherit"` | 文本颜色 |
| align   | `"left"` \| `"center"` \| `"right"`                             | `"left"`    | 对齐方式 |
| weight  | `"normal"` \| `"medium"` \| `"bold"`                            | `"normal"`  | 字重     |

#### MdrLink

链接组件。

```json
{
  "type": "MdrLink",
  "props": {
    "href": "/about",
    "target": "_self"
  },
  "children": ["关于我们"]
}
```

| 属性      | 类型                    | 默认值    | 说明           |
| --------- | ----------------------- | --------- | -------------- |
| href      | string                  | -         | 链接地址       |
| target    | `"_self"` \| `"_blank"` | `"_self"` | 打开方式       |
| underline | boolean                 | true      | 是否显示下划线 |

#### MdrImage

图片组件。

```json
{
  "type": "MdrImage",
  "props": {
    "src": "/images/hero.jpg",
    "alt": "Hero Image",
    "objectFit": "cover",
    "aspectRatio": "16/9"
  }
}
```

| 属性        | 类型                  | 默认值    | 说明     |
| ----------- | --------------------- | --------- | -------- |
| src         | string                | -         | 图片地址 |
| alt         | string                | -         | 替代文本 |
| objectFit   | CSS object-fit        | `"cover"` | 填充方式 |
| aspectRatio | string                | -         | 宽高比   |
| loading     | `"lazy"` \| `"eager"` | `"lazy"`  | 加载策略 |

### 表单组件

#### MdrInput

输入框组件。

```json
{
  "type": "MdrInput",
  "props": {
    "type": "text",
    "placeholder": "请输入用户名",
    "size": "medium"
  }
}
```

| 属性        | 类型                                                | 默认值     | 说明          |
| ----------- | --------------------------------------------------- | ---------- | ------------- |
| type        | `"text"` \| `"password"` \| `"email"` \| `"number"` | `"text"`   | 输入类型      |
| placeholder | string                                              | -          | 占位文本      |
| value       | string                                              | -          | 输入值        |
| disabled    | boolean                                             | false      | 禁用状态      |
| size        | `"small"` \| `"medium"` \| `"large"`                | `"medium"` | 尺寸          |
| prefix      | string                                              | -          | 前缀图标/文本 |
| suffix      | string                                              | -          | 后缀图标/文本 |

#### MdrSelect

选择器组件。

```json
{
  "type": "MdrSelect",
  "props": {
    "options": [
      { "label": "选项 1", "value": "1" },
      { "label": "选项 2", "value": "2" }
    ],
    "placeholder": "请选择"
  }
}
```

| 属性        | 类型                  | 默认值 | 说明       |
| ----------- | --------------------- | ------ | ---------- |
| options     | Array<{label, value}> | []     | 选项列表   |
| value       | string                | -      | 选中值     |
| placeholder | string                | -      | 占位文本   |
| multiple    | boolean               | false  | 是否多选   |
| searchable  | boolean               | false  | 是否可搜索 |

#### MdrCheckbox

复选框组件。

```json
{
  "type": "MdrCheckbox",
  "props": {
    "checked": false,
    "label": "同意用户协议"
  }
}
```

#### MdrRadio

单选框组件。

```json
{
  "type": "MdrRadio",
  "props": {
    "options": [
      { "label": "男", "value": "male" },
      { "label": "女", "value": "female" }
    ],
    "value": "male"
  }
}
```

### 数据展示组件

#### MdrTable

表格组件。

```json
{
  "type": "MdrTable",
  "props": {
    "columns": [
      { "title": "姓名", "dataIndex": "name" },
      { "title": "年龄", "dataIndex": "age" },
      { "title": "操作", "type": "action" }
    ],
    "dataSource": "$users"
  }
}
```

| 属性       | 类型    | 说明         |
| ---------- | ------- | ------------ |
| columns    | Array   | 列配置       |
| dataSource | Array   | 数据源       |
| pagination | object  | 分页配置     |
| bordered   | boolean | 是否显示边框 |
| striped    | boolean | 是否斑马纹   |

#### MdrCard

卡片组件。

```json
{
  "type": "MdrCard",
  "props": {
    "title": "卡片标题",
    "cover": "/images/cover.jpg",
    "hoverable": true
  },
  "children": ["卡片内容"]
}
```

#### MdrList

列表组件。

```json
{
  "type": "MdrList",
  "props": {
    "items": "$todoList",
    "renderItem": {
      "type": "MdrListItem",
      "props": {
        "title": "${item.title}",
        "description": "${item.description}"
      }
    }
  }
}
```

### 反馈组件

#### MdrModal

模态框组件。

```json
{
  "type": "MdrModal",
  "props": {
    "open": "$showModal",
    "title": "确认删除",
    "onClose": {
      "type": "action",
      "action": "setState",
      "params": { "showModal": false }
    }
  },
  "children": ["确定要删除这条记录吗？"]
}
```

#### MdrToast

消息提示组件（通过操作节点触发）。

```json
{
  "type": "action",
  "action": "showToast",
  "params": {
    "message": "操作成功",
    "type": "success",
    "duration": 3000
  }
}
```

#### MdrTooltip

工具提示组件。

```json
{
  "type": "MdrTooltip",
  "props": {
    "content": "这是提示信息",
    "placement": "top"
  },
  "children": [{ "type": "MdrButton", "children": ["悬停查看"] }]
}
```

## 自定义组件

### 创建自定义组件

1. 创建组件 MIR 文件：

```json
// components/UserCard.mir.json
{
  "$schema": "https://mdr.dev/schemas/mir/1.0.json",
  "version": "1.0",
  "type": "component",
  "meta": {
    "name": "UserCard",
    "description": "用户卡片组件"
  },
  "props": {
    "user": {
      "type": "object",
      "required": true,
      "properties": {
        "name": { "type": "string" },
        "avatar": { "type": "string" },
        "email": { "type": "string" }
      }
    }
  },
  "root": {
    "type": "MdrCard",
    "props": {
      "hoverable": true
    },
    "children": [
      {
        "type": "MdrContainer",
        "props": { "layout": "flex", "gap": "12px" },
        "children": [
          {
            "type": "MdrImage",
            "props": {
              "src": "${props.user.avatar}",
              "alt": "${props.user.name}",
              "style": {
                "width": "48px",
                "height": "48px",
                "borderRadius": "50%"
              }
            }
          },
          {
            "type": "MdrContainer",
            "children": [
              {
                "type": "MdrText",
                "props": { "variant": "h4" },
                "children": ["${props.user.name}"]
              },
              {
                "type": "MdrText",
                "props": { "variant": "caption" },
                "children": ["${props.user.email}"]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

2. 在页面中使用：

```json
{
  "imports": [{ "from": "./components/UserCard", "components": ["UserCard"] }],
  "root": {
    "type": "UserCard",
    "props": {
      "user": {
        "name": "张三",
        "avatar": "/avatars/zhangsan.jpg",
        "email": "zhangsan@example.com"
      }
    }
  }
}
```

### 组件属性定义

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
    "onClick": {
      "type": "function",
      "description": "点击事件回调"
    }
  }
}
```

### 插槽 (Slots)

支持具名插槽：

```json
{
  "slots": {
    "header": { "description": "头部插槽" },
    "footer": { "description": "底部插槽" },
    "default": { "description": "默认插槽" }
  },
  "root": {
    "type": "MdrCard",
    "children": [
      { "$slot": "header" },
      { "$slot": "default" },
      { "$slot": "footer" }
    ]
  }
}
```

使用插槽：

```json
{
  "type": "CustomCard",
  "slots": {
    "header": { "type": "MdrText", "children": ["头部内容"] },
    "footer": { "type": "MdrButton", "children": ["底部按钮"] }
  },
  "children": ["主体内容"]
}
```

## 组件状态

### 内部状态

组件可以定义内部状态：

```json
{
  "state": {
    "count": { "type": "number", "default": 0 },
    "isOpen": { "type": "boolean", "default": false }
  }
}
```

### 状态更新

通过事件处理更新状态：

```json
{
  "events": {
    "onClick": {
      "type": "action",
      "action": "setState",
      "params": {
        "count": "${state.count + 1}"
      }
    }
  }
}
```

## 主题定制

### CSS 变量

组件使用 CSS 变量，支持主题定制：

```css
:root {
  /* 颜色 */
  --mdr-color-primary: #5f67ee;
  --mdr-color-secondary: #6b7280;
  --mdr-color-success: #10b981;
  --mdr-color-warning: #f59e0b;
  --mdr-color-danger: #ef4444;

  /* 间距 */
  --mdr-spacing-xs: 4px;
  --mdr-spacing-sm: 8px;
  --mdr-spacing-md: 16px;
  --mdr-spacing-lg: 24px;
  --mdr-spacing-xl: 32px;

  /* 圆角 */
  --mdr-radius-sm: 4px;
  --mdr-radius-md: 8px;
  --mdr-radius-lg: 12px;

  /* 阴影 */
  --mdr-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --mdr-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### 深色模式

```css
[data-theme='dark'] {
  --mdr-color-background: #1a1a1a;
  --mdr-color-surface: #2d2d2d;
  --mdr-color-text: #ffffff;
}
```

## 下一步

- [代码导出](/guide/export) - 导出组件为框架代码
- [主题定制](/guide/theming) - 深度定制组件样式
- [组件规范](/reference/component-spec) - 完整的组件 API 规范
