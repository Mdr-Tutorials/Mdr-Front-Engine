# 组件规范

本文档详细描述 MdrFrontEngine 内置组件的完整 API 规范。

## 通用属性

所有组件都支持以下通用属性：

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `id` | string | auto | 组件唯一标识符 |
| `className` | string | - | CSS 类名 |
| `style` | object | - | 内联样式 |
| `ref` | string | - | 组件引用名 |
| `data-*` | any | - | 自定义数据属性 |

## 布局组件

### MdrContainer

通用容器组件。

```json
{
  "type": "MdrContainer",
  "props": {
    "layout": "flex",
    "direction": "column",
    "justify": "center",
    "align": "center",
    "wrap": "nowrap",
    "gap": "16px",
    "padding": "24px"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `layout` | `"block"` \| `"flex"` \| `"grid"` \| `"inline"` | `"block"` | 布局模式 |
| `direction` | `"row"` \| `"column"` \| `"row-reverse"` \| `"column-reverse"` | `"row"` | 主轴方向 |
| `justify` | CSS justify-content | `"flex-start"` | 主轴对齐 |
| `align` | CSS align-items | `"stretch"` | 交叉轴对齐 |
| `wrap` | `"nowrap"` \| `"wrap"` \| `"wrap-reverse"` | `"nowrap"` | 换行方式 |
| `gap` | string | `"0"` | 子元素间距 |
| `padding` | string | `"0"` | 内边距 |
| `margin` | string | `"0"` | 外边距 |
| `width` | string | `"auto"` | 宽度 |
| `height` | string | `"auto"` | 高度 |
| `minWidth` | string | - | 最小宽度 |
| `maxWidth` | string | - | 最大宽度 |
| `minHeight` | string | - | 最小高度 |
| `maxHeight` | string | - | 最大高度 |
| `overflow` | CSS overflow | `"visible"` | 溢出处理 |

### MdrGrid

网格布局组件。

```json
{
  "type": "MdrGrid",
  "props": {
    "columns": 3,
    "rows": "auto",
    "gap": "16px",
    "columnGap": "16px",
    "rowGap": "16px"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `columns` | number \| string | `12` | 列数或列定义 |
| `rows` | number \| string | `"auto"` | 行数或行定义 |
| `gap` | string | `"16px"` | 网格间距 |
| `columnGap` | string | - | 列间距 |
| `rowGap` | string | - | 行间距 |
| `autoFlow` | `"row"` \| `"column"` \| `"dense"` | `"row"` | 自动放置方向 |
| `justifyItems` | CSS justify-items | `"stretch"` | 单元格水平对齐 |
| `alignItems` | CSS align-items | `"stretch"` | 单元格垂直对齐 |

### MdrGridItem

网格项组件。

```json
{
  "type": "MdrGridItem",
  "props": {
    "colSpan": 2,
    "rowSpan": 1,
    "colStart": 1,
    "rowStart": 1
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `colSpan` | number | `1` | 跨列数 |
| `rowSpan` | number | `1` | 跨行数 |
| `colStart` | number | - | 起始列 |
| `colEnd` | number | - | 结束列 |
| `rowStart` | number | - | 起始行 |
| `rowEnd` | number | - | 结束行 |

### MdrStack

堆叠布局组件。

```json
{
  "type": "MdrStack",
  "props": {
    "direction": "vertical",
    "spacing": "16px",
    "divider": true
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `direction` | `"horizontal"` \| `"vertical"` | `"vertical"` | 堆叠方向 |
| `spacing` | string | `"16px"` | 间距 |
| `divider` | boolean | `false` | 是否显示分割线 |
| `align` | `"start"` \| `"center"` \| `"end"` \| `"stretch"` | `"stretch"` | 对齐方式 |

## 基础组件

### MdrText

文本组件。

```json
{
  "type": "MdrText",
  "props": {
    "variant": "body",
    "color": "primary",
    "align": "left",
    "weight": "normal"
  },
  "children": ["文本内容"]
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `variant` | `"h1"` \| `"h2"` \| `"h3"` \| `"h4"` \| `"h5"` \| `"h6"` \| `"body"` \| `"caption"` \| `"overline"` | `"body"` | 文本变体 |
| `color` | string | `"inherit"` | 文本颜色 |
| `align` | `"left"` \| `"center"` \| `"right"` \| `"justify"` | `"left"` | 对齐方式 |
| `weight` | `"normal"` \| `"medium"` \| `"semibold"` \| `"bold"` | - | 字重 |
| `truncate` | boolean \| number | `false` | 截断行数 |
| `noWrap` | boolean | `false` | 不换行 |
| `transform` | `"none"` \| `"uppercase"` \| `"lowercase"` \| `"capitalize"` | `"none"` | 文本转换 |

### MdrButton

按钮组件。

```json
{
  "type": "MdrButton",
  "props": {
    "variant": "primary",
    "size": "medium",
    "disabled": false,
    "loading": false,
    "icon": "plus",
    "iconPosition": "left"
  },
  "children": ["按钮文本"],
  "events": {
    "onClick": { ... }
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `variant` | `"primary"` \| `"secondary"` \| `"outline"` \| `"ghost"` \| `"danger"` \| `"link"` | `"primary"` | 按钮变体 |
| `size` | `"small"` \| `"medium"` \| `"large"` | `"medium"` | 按钮尺寸 |
| `disabled` | boolean | `false` | 禁用状态 |
| `loading` | boolean | `false` | 加载状态 |
| `icon` | string | - | 图标名称 |
| `iconPosition` | `"left"` \| `"right"` | `"left"` | 图标位置 |
| `fullWidth` | boolean | `false` | 撑满容器 |
| `type` | `"button"` \| `"submit"` \| `"reset"` | `"button"` | 按钮类型 |

**事件**:

| 事件 | 参数 | 描述 |
| --- | --- | --- |
| `onClick` | event | 点击事件 |

### MdrLink

链接组件。

```json
{
  "type": "MdrLink",
  "props": {
    "href": "/about",
    "target": "_self",
    "underline": "hover"
  },
  "children": ["链接文本"]
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `href` | string | - | 链接地址 |
| `target` | `"_self"` \| `"_blank"` \| `"_parent"` \| `"_top"` | `"_self"` | 打开方式 |
| `underline` | `"always"` \| `"hover"` \| `"none"` | `"hover"` | 下划线显示 |
| `color` | string | - | 链接颜色 |
| `external` | boolean | `false` | 外部链接（显示图标） |

### MdrImage

图片组件。

```json
{
  "type": "MdrImage",
  "props": {
    "src": "/images/photo.jpg",
    "alt": "描述文本",
    "width": "100%",
    "aspectRatio": "16/9",
    "objectFit": "cover"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `src` | string | - | 图片地址 |
| `alt` | string | `""` | 替代文本 |
| `width` | string | `"auto"` | 宽度 |
| `height` | string | `"auto"` | 高度 |
| `aspectRatio` | string | - | 宽高比 |
| `objectFit` | `"contain"` \| `"cover"` \| `"fill"` \| `"none"` \| `"scale-down"` | `"cover"` | 填充方式 |
| `objectPosition` | string | `"center"` | 位置 |
| `loading` | `"lazy"` \| `"eager"` | `"lazy"` | 加载策略 |
| `fallback` | string | - | 加载失败时的备用图片 |
| `placeholder` | string | - | 占位图 |

### MdrIcon

图标组件。

```json
{
  "type": "MdrIcon",
  "props": {
    "name": "check",
    "size": "24px",
    "color": "currentColor"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | string | - | 图标名称 |
| `size` | string | `"1em"` | 图标尺寸 |
| `color` | string | `"currentColor"` | 图标颜色 |
| `stroke` | number | - | 描边宽度 |

## 表单组件

### MdrInput

输入框组件。

```json
{
  "type": "MdrInput",
  "props": {
    "type": "text",
    "placeholder": "请输入",
    "value": "",
    "disabled": false,
    "readonly": false
  },
  "events": {
    "onChange": { ... },
    "onFocus": { ... },
    "onBlur": { ... }
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `type` | `"text"` \| `"password"` \| `"email"` \| `"number"` \| `"tel"` \| `"url"` \| `"search"` | `"text"` | 输入类型 |
| `placeholder` | string | - | 占位文本 |
| `value` | string \| number | `""` | 输入值 |
| `defaultValue` | string \| number | - | 默认值 |
| `disabled` | boolean | `false` | 禁用状态 |
| `readonly` | boolean | `false` | 只读状态 |
| `size` | `"small"` \| `"medium"` \| `"large"` | `"medium"` | 尺寸 |
| `prefix` | string | - | 前缀 |
| `suffix` | string | - | 后缀 |
| `maxLength` | number | - | 最大长度 |
| `minLength` | number | - | 最小长度 |
| `pattern` | string | - | 正则验证 |
| `required` | boolean | `false` | 是否必填 |
| `error` | boolean \| string | `false` | 错误状态/信息 |
| `clearable` | boolean | `false` | 可清空 |
| `autoFocus` | boolean | `false` | 自动聚焦 |

**事件**:

| 事件 | 参数 | 描述 |
| --- | --- | --- |
| `onChange` | { value, event } | 值变化 |
| `onFocus` | event | 获得焦点 |
| `onBlur` | event | 失去焦点 |
| `onKeyDown` | event | 键盘按下 |
| `onKeyUp` | event | 键盘松开 |
| `onClear` | - | 清空 |

### MdrTextarea

多行文本输入组件。

```json
{
  "type": "MdrTextarea",
  "props": {
    "placeholder": "请输入内容",
    "rows": 4,
    "autosize": true
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `rows` | number | `4` | 显示行数 |
| `autosize` | boolean \| { minRows, maxRows } | `false` | 自动调整高度 |
| `resize` | `"none"` \| `"vertical"` \| `"horizontal"` \| `"both"` | `"vertical"` | 可调整方向 |
| `showCount` | boolean | `false` | 显示字数 |

### MdrSelect

选择器组件。

```json
{
  "type": "MdrSelect",
  "props": {
    "options": [
      { "label": "选项 1", "value": "1" },
      { "label": "选项 2", "value": "2", "disabled": true }
    ],
    "placeholder": "请选择"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | Array<{ label, value, disabled? }> | `[]` | 选项列表 |
| `value` | any | - | 选中值 |
| `placeholder` | string | - | 占位文本 |
| `multiple` | boolean | `false` | 是否多选 |
| `searchable` | boolean | `false` | 是否可搜索 |
| `clearable` | boolean | `false` | 可清空 |
| `disabled` | boolean | `false` | 禁用状态 |
| `loading` | boolean | `false` | 加载状态 |
| `maxTagCount` | number | - | 最多显示标签数 |

### MdrCheckbox

复选框组件。

```json
{
  "type": "MdrCheckbox",
  "props": {
    "checked": false,
    "label": "同意协议",
    "indeterminate": false
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `checked` | boolean | `false` | 选中状态 |
| `label` | string | - | 标签文本 |
| `disabled` | boolean | `false` | 禁用状态 |
| `indeterminate` | boolean | `false` | 不确定状态 |
| `value` | any | - | 值（用于 CheckboxGroup） |

### MdrRadio

单选框组件。

```json
{
  "type": "MdrRadio",
  "props": {
    "options": [
      { "label": "选项 A", "value": "a" },
      { "label": "选项 B", "value": "b" }
    ],
    "value": "a",
    "direction": "horizontal"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | Array<{ label, value, disabled? }> | `[]` | 选项列表 |
| `value` | any | - | 选中值 |
| `direction` | `"horizontal"` \| `"vertical"` | `"horizontal"` | 排列方向 |
| `disabled` | boolean | `false` | 禁用状态 |

### MdrSwitch

开关组件。

```json
{
  "type": "MdrSwitch",
  "props": {
    "checked": false,
    "size": "medium"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `checked` | boolean | `false` | 开启状态 |
| `size` | `"small"` \| `"medium"` \| `"large"` | `"medium"` | 尺寸 |
| `disabled` | boolean | `false` | 禁用状态 |
| `loading` | boolean | `false` | 加载状态 |
| `checkedText` | string | - | 开启时文本 |
| `uncheckedText` | string | - | 关闭时文本 |

## 数据展示组件

### MdrTable

表格组件。

```json
{
  "type": "MdrTable",
  "props": {
    "columns": [
      { "title": "姓名", "dataIndex": "name", "width": "150px" },
      { "title": "年龄", "dataIndex": "age", "align": "center" },
      { "title": "操作", "key": "action", "render": "..." }
    ],
    "dataSource": [],
    "pagination": { "pageSize": 10 },
    "bordered": true
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `columns` | Array | `[]` | 列配置 |
| `dataSource` | Array | `[]` | 数据源 |
| `rowKey` | string \| function | `"id"` | 行唯一标识 |
| `pagination` | object \| false | - | 分页配置 |
| `bordered` | boolean | `false` | 显示边框 |
| `striped` | boolean | `false` | 斑马纹 |
| `hoverable` | boolean | `true` | 悬停高亮 |
| `loading` | boolean | `false` | 加载状态 |
| `emptyText` | string | `"暂无数据"` | 空数据文本 |
| `scroll` | { x, y } | - | 滚动配置 |

**Column 配置**:

| 属性 | 类型 | 描述 |
| --- | --- | --- |
| `title` | string | 列标题 |
| `dataIndex` | string | 数据字段 |
| `key` | string | 唯一标识 |
| `width` | string | 列宽 |
| `align` | `"left"` \| `"center"` \| `"right"` | 对齐方式 |
| `render` | MIR node | 自定义渲染 |
| `sorter` | boolean \| function | 排序 |
| `filters` | Array | 筛选选项 |
| `fixed` | `"left"` \| `"right"` | 固定列 |

### MdrCard

卡片组件。

```json
{
  "type": "MdrCard",
  "props": {
    "title": "卡片标题",
    "cover": "/images/cover.jpg",
    "hoverable": true,
    "bordered": true
  },
  "children": ["卡片内容"]
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `title` | string | - | 标题 |
| `cover` | string | - | 封面图片 |
| `hoverable` | boolean | `false` | 悬停效果 |
| `bordered` | boolean | `true` | 显示边框 |
| `loading` | boolean | `false` | 加载状态 |
| `padding` | string | `"16px"` | 内边距 |

### MdrList

列表组件。

```json
{
  "type": "MdrList",
  "props": {
    "items": [],
    "bordered": false,
    "split": true
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `items` | Array | `[]` | 数据项 |
| `bordered` | boolean | `false` | 显示边框 |
| `split` | boolean | `true` | 显示分割线 |
| `size` | `"small"` \| `"medium"` \| `"large"` | `"medium"` | 尺寸 |

## 反馈组件

### MdrModal

模态框组件。

```json
{
  "type": "MdrModal",
  "props": {
    "open": false,
    "title": "标题",
    "width": "500px",
    "closable": true,
    "maskClosable": true
  },
  "events": {
    "onClose": { ... },
    "onConfirm": { ... }
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `open` | boolean | `false` | 显示状态 |
| `title` | string | - | 标题 |
| `width` | string | `"500px"` | 宽度 |
| `closable` | boolean | `true` | 显示关闭按钮 |
| `maskClosable` | boolean | `true` | 点击遮罩关闭 |
| `centered` | boolean | `false` | 垂直居中 |
| `footer` | MIR node \| null | - | 自定义底部 |
| `confirmText` | string | `"确定"` | 确认按钮文本 |
| `cancelText` | string | `"取消"` | 取消按钮文本 |
| `confirmLoading` | boolean | `false` | 确认按钮加载 |

### MdrAlert

警告提示组件。

```json
{
  "type": "MdrAlert",
  "props": {
    "type": "info",
    "message": "提示信息",
    "description": "详细描述",
    "closable": true
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `type` | `"info"` \| `"success"` \| `"warning"` \| `"error"` | `"info"` | 类型 |
| `message` | string | - | 标题 |
| `description` | string | - | 描述 |
| `closable` | boolean | `false` | 可关闭 |
| `showIcon` | boolean | `true` | 显示图标 |
| `banner` | boolean | `false` | 横幅模式 |

### MdrTooltip

工具提示组件。

```json
{
  "type": "MdrTooltip",
  "props": {
    "content": "提示内容",
    "placement": "top",
    "trigger": "hover"
  },
  "children": [...]
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `content` | string \| MIR node | - | 提示内容 |
| `placement` | `"top"` \| `"bottom"` \| `"left"` \| `"right"` | `"top"` | 位置 |
| `trigger` | `"hover"` \| `"click"` \| `"focus"` | `"hover"` | 触发方式 |
| `delay` | number | `0` | 显示延迟(ms) |
| `arrow` | boolean | `true` | 显示箭头 |

## 导航组件

### MdrNav

导航组件。

```json
{
  "type": "MdrNav",
  "props": {
    "items": [
      { "label": "首页", "path": "/" },
      { "label": "关于", "path": "/about" },
      {
        "label": "产品",
        "children": [
          { "label": "产品 A", "path": "/products/a" },
          { "label": "产品 B", "path": "/products/b" }
        ]
      }
    ],
    "mode": "horizontal"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `items` | Array | `[]` | 导航项 |
| `mode` | `"horizontal"` \| `"vertical"` | `"horizontal"` | 模式 |
| `activeKey` | string | - | 当前激活项 |
| `collapsed` | boolean | `false` | 折叠状态 |

### MdrTabs

标签页组件。

```json
{
  "type": "MdrTabs",
  "props": {
    "items": [
      { "key": "1", "label": "标签 1", "content": {...} },
      { "key": "2", "label": "标签 2", "content": {...} }
    ],
    "activeKey": "1"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `items` | Array | `[]` | 标签项 |
| `activeKey` | string | - | 当前激活标签 |
| `type` | `"line"` \| `"card"` | `"line"` | 样式类型 |
| `position` | `"top"` \| `"bottom"` \| `"left"` \| `"right"` | `"top"` | 位置 |

### MdrBreadcrumb

面包屑组件。

```json
{
  "type": "MdrBreadcrumb",
  "props": {
    "items": [
      { "label": "首页", "path": "/" },
      { "label": "产品", "path": "/products" },
      { "label": "详情" }
    ],
    "separator": "/"
  }
}
```

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `items` | Array<{ label, path? }> | `[]` | 面包屑项 |
| `separator` | string | `"/"` | 分隔符 |

## 下一步

- [节点规范](/reference/node-spec) - 节点图节点规范
- [MIR 规范](/reference/mir-spec) - 完整语法规范
- [组件系统](/guide/components) - 组件使用指南
