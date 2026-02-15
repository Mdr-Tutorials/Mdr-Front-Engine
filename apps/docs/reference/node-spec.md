# 节点规范

本文档详细描述 MdrFrontEngine 节点图系统中所有节点类型的完整规范。

## 节点通用结构

每个节点都具有以下基础结构：

```json
{
  "id": "node-unique-id",
  "type": "NodeType",
  "name": "节点名称",
  "position": { "x": 100, "y": 100 },
  "inputs": { ... },
  "outputs": { ... },
  "config": { ... }
}
```

| 字段       | 类型     | 描述               |
| ---------- | -------- | ------------------ |
| `id`       | string   | 节点唯一标识符     |
| `type`     | string   | 节点类型           |
| `name`     | string   | 节点显示名称       |
| `position` | { x, y } | 节点在画布上的位置 |
| `inputs`   | object   | 输入端口配置       |
| `outputs`  | object   | 输出端口配置       |
| `config`   | object   | 节点特定配置       |

## 端口类型

### 执行端口

控制执行流程的端口。

| 类型   | 颜色    | 描述            |
| ------ | ------- | --------------- |
| `exec` | ⬜ 白色 | 执行流入口/出口 |

### 数据端口

传递数据的端口。

| 类型       | 颜色    | 描述     |
| ---------- | ------- | -------- |
| `string`   | 🟢 绿色 | 字符串   |
| `number`   | 🔵 蓝色 | 数字     |
| `boolean`  | 🟡 黄色 | 布尔值   |
| `object`   | 🟣 紫色 | 对象     |
| `array`    | 🔴 红色 | 数组     |
| `any`      | ⚪ 白色 | 任意类型 |
| `function` | 🟠 橙色 | 函数     |

## 触发器节点

### Event/onClick

组件点击事件触发器。

```json
{
  "type": "trigger/onClick",
  "config": {
    "target": "component-id"
  },
  "outputs": {
    "exec": { "type": "exec" },
    "event": { "type": "object" },
    "target": { "type": "object" }
  }
}
```

**配置项**:

| 属性     | 类型   | 描述        |
| -------- | ------ | ----------- |
| `target` | string | 目标组件 ID |

**输出**:

| 端口     | 类型   | 描述         |
| -------- | ------ | ------------ |
| `exec`   | exec   | 执行流       |
| `event`  | object | 原生事件对象 |
| `target` | object | 目标元素     |

### Event/onChange

值变化事件触发器。

```json
{
  "type": "trigger/onChange",
  "config": {
    "target": "input-id"
  },
  "outputs": {
    "exec": { "type": "exec" },
    "value": { "type": "any" },
    "event": { "type": "object" }
  }
}
```

**输出**:

| 端口    | 类型   | 描述         |
| ------- | ------ | ------------ |
| `exec`  | exec   | 执行流       |
| `value` | any    | 新值         |
| `event` | object | 原生事件对象 |

### Event/onLoad

页面/组件加载事件。

```json
{
  "type": "trigger/onLoad",
  "config": {
    "target": "page" | "component-id"
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

### Event/onSubmit

表单提交事件。

```json
{
  "type": "trigger/onSubmit",
  "config": {
    "target": "form-id"
  },
  "outputs": {
    "exec": { "type": "exec" },
    "formData": { "type": "object" },
    "event": { "type": "object" }
  }
}
```

### Event/onKeyPress

键盘事件触发器。

```json
{
  "type": "trigger/onKeyPress",
  "config": {
    "key": "Enter",
    "modifiers": ["ctrl", "shift"]
  },
  "outputs": {
    "exec": { "type": "exec" },
    "key": { "type": "string" },
    "event": { "type": "object" }
  }
}
```

**配置项**:

| 属性        | 类型   | 描述                                    |
| ----------- | ------ | --------------------------------------- |
| `key`       | string | 触发按键                                |
| `modifiers` | array  | 修饰键 ["ctrl", "shift", "alt", "meta"] |

### Event/onTimer

定时器触发器。

```json
{
  "type": "trigger/onTimer",
  "config": {
    "interval": 1000,
    "repeat": true,
    "immediate": false
  },
  "outputs": {
    "exec": { "type": "exec" },
    "count": { "type": "number" },
    "timestamp": { "type": "number" }
  }
}
```

**配置项**:

| 属性        | 类型    | 默认值 | 描述         |
| ----------- | ------- | ------ | ------------ |
| `interval`  | number  | 1000   | 间隔时间(ms) |
| `repeat`    | boolean | false  | 是否重复     |
| `immediate` | boolean | false  | 是否立即触发 |

## 操作节点

### Action/SetState

状态更新节点。

```json
{
  "type": "action/setState",
  "config": {
    "target": "stateName",
    "mode": "replace"
  },
  "inputs": {
    "exec": { "type": "exec" },
    "value": { "type": "any" }
  },
  "outputs": {
    "exec": { "type": "exec" },
    "newValue": { "type": "any" }
  }
}
```

**配置项**:

| 属性     | 类型                                               | 描述       |
| -------- | -------------------------------------------------- | ---------- |
| `target` | string                                             | 目标状态名 |
| `mode`   | `"replace"` \| `"merge"` \| `"push"` \| `"remove"` | 更新模式   |

**更新模式**:

| 模式      | 描述     | 适用类型 |
| --------- | -------- | -------- |
| `replace` | 完全替换 | 所有类型 |
| `merge`   | 浅合并   | object   |
| `push`    | 追加元素 | array    |
| `remove`  | 移除元素 | array    |

### Action/Navigate

页面跳转节点。

```json
{
  "type": "action/navigate",
  "config": {
    "path": "/detail/${id}",
    "mode": "push"
  },
  "inputs": {
    "exec": { "type": "exec" },
    "params": { "type": "object" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

**配置项**:

| 属性    | 类型                    | 默认值   | 描述         |
| ------- | ----------------------- | -------- | ------------ |
| `path`  | string                  | -        | 目标路径     |
| `mode`  | `"push"` \| `"replace"` | `"push"` | 导航模式     |
| `query` | object                  | -        | URL 查询参数 |

### Action/HTTP

HTTP 请求节点。

```json
{
  "type": "action/http",
  "config": {
    "method": "GET",
    "url": "/api/users",
    "headers": {},
    "timeout": 30000
  },
  "inputs": {
    "exec": { "type": "exec" },
    "url": { "type": "string" },
    "body": { "type": "any" },
    "params": { "type": "object" }
  },
  "outputs": {
    "success": { "type": "exec" },
    "error": { "type": "exec" },
    "response": { "type": "object" },
    "data": { "type": "any" },
    "status": { "type": "number" },
    "errorMessage": { "type": "string" }
  }
}
```

**配置项**:

| 属性          | 类型                                                      | 默认值               | 描述         |
| ------------- | --------------------------------------------------------- | -------------------- | ------------ |
| `method`      | `"GET"` \| `"POST"` \| `"PUT"` \| `"DELETE"` \| `"PATCH"` | `"GET"`              | 请求方法     |
| `url`         | string                                                    | -                    | 请求 URL     |
| `headers`     | object                                                    | {}                   | 请求头       |
| `timeout`     | number                                                    | 30000                | 超时时间(ms) |
| `contentType` | string                                                    | `"application/json"` | Content-Type |

### Action/ShowToast

显示消息提示节点。

```json
{
  "type": "action/showToast",
  "config": {
    "type": "success",
    "duration": 3000,
    "position": "top"
  },
  "inputs": {
    "exec": { "type": "exec" },
    "message": { "type": "string" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

**配置项**:

| 属性       | 类型                                                | 默认值   | 描述         |
| ---------- | --------------------------------------------------- | -------- | ------------ |
| `type`     | `"info"` \| `"success"` \| `"warning"` \| `"error"` | `"info"` | 提示类型     |
| `duration` | number                                              | 3000     | 显示时长(ms) |
| `position` | `"top"` \| `"bottom"`                               | `"top"`  | 显示位置     |

### Action/ShowModal

显示模态框节点。

```json
{
  "type": "action/showModal",
  "config": {
    "ref": "modal-id"
  },
  "inputs": {
    "exec": { "type": "exec" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

### Action/HideModal

隐藏模态框节点。

```json
{
  "type": "action/hideModal",
  "config": {
    "ref": "modal-id"
  },
  "inputs": {
    "exec": { "type": "exec" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

### Action/Console

控制台输出节点（调试用）。

```json
{
  "type": "action/console",
  "config": {
    "level": "log"
  },
  "inputs": {
    "exec": { "type": "exec" },
    "message": { "type": "any" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

## 逻辑节点

### Logic/Condition

条件分支节点。

```json
{
  "type": "logic/condition",
  "config": {
    "expression": "value > 0"
  },
  "inputs": {
    "exec": { "type": "exec" },
    "input": { "type": "any" }
  },
  "outputs": {
    "true": { "type": "exec" },
    "false": { "type": "exec" }
  }
}
```

**配置项**:

| 属性         | 类型   | 描述       |
| ------------ | ------ | ---------- |
| `expression` | string | 条件表达式 |

### Logic/Switch

多条件分支节点。

```json
{
  "type": "logic/switch",
  "config": {
    "cases": [
      { "value": "a", "label": "Case A" },
      { "value": "b", "label": "Case B" }
    ]
  },
  "inputs": {
    "exec": { "type": "exec" },
    "value": { "type": "any" }
  },
  "outputs": {
    "case_a": { "type": "exec" },
    "case_b": { "type": "exec" },
    "default": { "type": "exec" }
  }
}
```

### Logic/ForEach

循环节点。

```json
{
  "type": "logic/forEach",
  "inputs": {
    "exec": { "type": "exec" },
    "array": { "type": "array" }
  },
  "outputs": {
    "loop": { "type": "exec" },
    "item": { "type": "any" },
    "index": { "type": "number" },
    "done": { "type": "exec" }
  }
}
```

### Logic/Delay

延迟执行节点。

```json
{
  "type": "logic/delay",
  "config": {
    "duration": 1000
  },
  "inputs": {
    "exec": { "type": "exec" },
    "duration": { "type": "number" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

### Logic/Debounce

防抖节点。

```json
{
  "type": "logic/debounce",
  "config": {
    "wait": 300
  },
  "inputs": {
    "exec": { "type": "exec" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

### Logic/Throttle

节流节点。

```json
{
  "type": "logic/throttle",
  "config": {
    "limit": 1000
  },
  "inputs": {
    "exec": { "type": "exec" }
  },
  "outputs": {
    "exec": { "type": "exec" }
  }
}
```

## 数据节点

### Data/Variable

变量引用节点。

```json
{
  "type": "data/variable",
  "config": {
    "name": "stateName"
  },
  "outputs": {
    "value": { "type": "any" }
  }
}
```

### Data/Constant

常量节点。

```json
{
  "type": "data/constant",
  "config": {
    "type": "string",
    "value": "Hello"
  },
  "outputs": {
    "value": { "type": "string" }
  }
}
```

**配置项**:

| 属性    | 类型                                                               | 描述   |
| ------- | ------------------------------------------------------------------ | ------ |
| `type`  | `"string"` \| `"number"` \| `"boolean"` \| `"object"` \| `"array"` | 值类型 |
| `value` | any                                                                | 常量值 |

### Data/Transform

数据转换节点。

```json
{
  "type": "data/transform",
  "config": {
    "expression": "data.map(item => item.name)"
  },
  "inputs": {
    "data": { "type": "any" }
  },
  "outputs": {
    "result": { "type": "any" }
  }
}
```

### Data/Merge

对象合并节点。

```json
{
  "type": "data/merge",
  "inputs": {
    "obj1": { "type": "object" },
    "obj2": { "type": "object" }
  },
  "outputs": {
    "result": { "type": "object" }
  }
}
```

### Data/Pick

对象取值节点。

```json
{
  "type": "data/pick",
  "config": {
    "path": "user.profile.name"
  },
  "inputs": {
    "object": { "type": "object" }
  },
  "outputs": {
    "value": { "type": "any" }
  }
}
```

### Data/ArrayOperation

数组操作节点。

```json
{
  "type": "data/arrayOperation",
  "config": {
    "operation": "filter",
    "expression": "item.active === true"
  },
  "inputs": {
    "array": { "type": "array" }
  },
  "outputs": {
    "result": { "type": "array" }
  }
}
```

**操作类型**:

| 操作      | 描述 | 配置       |
| --------- | ---- | ---------- |
| `map`     | 映射 | expression |
| `filter`  | 过滤 | expression |
| `find`    | 查找 | expression |
| `sort`    | 排序 | key, order |
| `slice`   | 切片 | start, end |
| `reverse` | 反转 | -          |
| `flat`    | 展平 | depth      |

## 自定义代码节点

### Code/JavaScript

JavaScript 代码节点。

```json
{
  "type": "code/javascript",
  "config": {
    "code": "const result = inputs.a + inputs.b;\nreturn { result };",
    "async": false
  },
  "inputs": {
    "exec": { "type": "exec" },
    "a": { "type": "number" },
    "b": { "type": "number" }
  },
  "outputs": {
    "exec": { "type": "exec" },
    "result": { "type": "number" }
  }
}
```

**配置项**:

| 属性    | 类型    | 默认值 | 描述            |
| ------- | ------- | ------ | --------------- |
| `code`  | string  | -      | JavaScript 代码 |
| `async` | boolean | false  | 是否异步        |

**代码上下文**:

```javascript
// 可用变量
inputs; // 输入数据
state; // 当前状态
props; // 组件属性
refs; // 组件引用

// 可用函数
setState(key, value); // 更新状态
navigate(path); // 页面跳转
fetch(url, options); // HTTP 请求
console.log(); // 日志输出
```

## 子图节点

### Subgraph/Call

调用子图节点。

```json
{
  "type": "subgraph/call",
  "config": {
    "graphId": "fetch-and-cache"
  },
  "inputs": {
    "exec": { "type": "exec" },
    "url": { "type": "string" }
  },
  "outputs": {
    "exec": { "type": "exec" },
    "data": { "type": "any" }
  }
}
```

## 注释节点

### Comment

注释节点（不参与执行）。

```json
{
  "type": "comment",
  "config": {
    "text": "这里处理用户登录逻辑",
    "color": "#FFE066"
  }
}
```

## 下一步

- [MIR 规范](/reference/mir-spec) - 完整 MIR 语法
- [组件规范](/reference/component-spec) - 组件 API
- [节点图系统](/guide/node-graph) - 使用指南
