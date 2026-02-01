# 后端 API

MdrFrontEngine 后端服务提供用户认证和数据管理 API。

## 概述

- **技术栈**: Go + Gin Web Framework
- **认证方式**: Session-based Token 认证
- **存储**: 内存存储（开发阶段）
- **默认地址**: `http://localhost:8080`

## 基础信息

### Base URL

```
http://localhost:8080/api
```

### 认证

大部分 API 需要认证。在请求头中添加 Token：

```http
Authorization: Bearer <token>
```

或使用：

```http
X-Auth-Token: <token>
```

### 响应格式

所有响应均为 JSON 格式。

**成功响应**:
```json
{
  "user": { ... },
  "token": "..."
}
```

**错误响应**:
```json
{
  "code": "error_code",
  "message": "错误描述"
}
```

## API 端点

### 健康检查

检查服务是否正常运行。

```http
GET /api/ping
```

**响应**:
```json
{
  "message": "pong"
}
```

---

### 认证 API

#### 注册

创建新用户账号。

```http
POST /api/auth/register
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名",
  "description": "个人简介"
}
```

| 字段 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| `email` | string | 是 | 邮箱地址 |
| `password` | string | 是 | 密码（至少 8 位） |
| `name` | string | 否 | 用户名 |
| `description` | string | 否 | 个人简介 |

**成功响应** (201 Created):
```json
{
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "user@example.com",
    "name": "用户名",
    "description": "个人简介",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "abc123def456...",
  "expiresAt": "2024-01-16T10:30:00Z"
}
```

**错误响应**:

| HTTP 状态码 | 错误码 | 描述 |
| --- | --- | --- |
| 400 | `invalid_payload` | 请求体格式错误 |
| 400 | `invalid_email` | 邮箱格式无效 |
| 400 | `weak_password` | 密码少于 8 位 |
| 409 | `email_exists` | 邮箱已被注册 |
| 500 | `create_failed` | 服务器错误 |

---

#### 登录

使用邮箱和密码登录。

```http
POST /api/auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应** (200 OK):
```json
{
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "user@example.com",
    "name": "用户名",
    "description": "个人简介",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "abc123def456...",
  "expiresAt": "2024-01-16T10:30:00Z"
}
```

**错误响应**:

| HTTP 状态码 | 错误码 | 描述 |
| --- | --- | --- |
| 400 | `invalid_payload` | 请求体格式错误 |
| 401 | `invalid_credentials` | 邮箱或密码错误 |

---

#### 登出

退出登录，使当前 Token 失效。

```http
POST /api/auth/logout
```

**请求头**: 需要认证

**成功响应** (204 No Content): 无响应体

---

#### 获取当前用户

获取当前登录用户的信息。

```http
GET /api/auth/me
```

**请求头**: 需要认证

**成功响应** (200 OK):
```json
{
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "user@example.com",
    "name": "用户名",
    "description": "个人简介",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 用户 API

#### 获取用户信息

根据 ID 获取用户公开信息。

```http
GET /api/users/:id
```

**请求头**: 需要认证

**路径参数**:

| 参数 | 类型 | 描述 |
| --- | --- | --- |
| `id` | string | 用户 ID |

**成功响应** (200 OK):
```json
{
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "user@example.com",
    "name": "用户名",
    "description": "个人简介",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**错误响应**:

| HTTP 状态码 | 错误码 | 描述 |
| --- | --- | --- |
| 404 | `not_found` | 用户不存在 |

---

#### 更新当前用户

更新当前登录用户的信息。

```http
PATCH /api/users/me
```

**请求头**: 需要认证

**请求体**:
```json
{
  "name": "新用户名",
  "description": "新的个人简介"
}
```

| 字段 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| `name` | string | 否 | 新用户名 |
| `description` | string | 否 | 新个人简介 |

**成功响应** (200 OK):
```json
{
  "user": {
    "id": "usr_a1b2c3d4e5f6g7h8",
    "email": "user@example.com",
    "name": "新用户名",
    "description": "新的个人简介",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**错误响应**:

| HTTP 状态码 | 错误码 | 描述 |
| --- | --- | --- |
| 400 | `invalid_payload` | 请求体格式错误 |
| 404 | `not_found` | 用户不存在 |
| 500 | `update_failed` | 更新失败 |

---

## 数据模型

### User

```typescript
interface User {
  id: string;          // 格式: "usr_" + 16位随机十六进制
  email: string;       // 邮箱（小写标准化）
  name: string;        // 用户名
  description: string; // 个人简介
  createdAt: string;   // ISO 8601 格式时间戳
}
```

### Session

```typescript
interface Session {
  token: string;       // 32位十六进制字符串
  userId: string;      // 关联的用户 ID
  createdAt: string;   // 创建时间
  expiresAt: string;   // 过期时间
}
```

## 配置

后端服务通过环境变量配置：

| 环境变量 | 默认值 | 描述 |
| --- | --- | --- |
| `BACKEND_ADDR` | `:8080` | 服务监听地址 |
| `BACKEND_TOKEN_TTL` | `24h` | Token 有效期（支持 Go duration 格式或秒数） |
| `BACKEND_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174` | 允许的 CORS 来源（逗号分隔） |

**示例**:

```bash
export BACKEND_ADDR=":3000"
export BACKEND_TOKEN_TTL="48h"
export BACKEND_ALLOWED_ORIGINS="http://localhost:5173,https://myapp.com"
```

## CORS

后端配置了以下 CORS 头：

```http
Access-Control-Allow-Origin: <configured origins>
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Auth-Token
Access-Control-Expose-Headers: Authorization, Content-Type
```

## 使用示例

### JavaScript/TypeScript

```typescript
// 注册
const registerResponse = await fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: '用户名'
  })
});
const { user, token } = await registerResponse.json();

// 使用 Token 请求
const meResponse = await fetch('http://localhost:8080/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { user: currentUser } = await meResponse.json();

// 更新用户信息
const updateResponse = await fetch('http://localhost:8080/api/users/me', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: '新名字' })
});
```

### cURL

```bash
# 注册
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"用户名"}'

# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 获取当前用户
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <token>"

# 更新用户
curl -X PATCH http://localhost:8080/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"新名字"}'
```

## 开发说明

### 启动后端服务

```bash
cd apps/backend
go run .
```

### 当前限制

- 使用内存存储，重启后数据丢失
- 暂无数据库持久化
- 暂无项目管理 API

### 计划功能

- [ ] 数据库持久化（PostgreSQL/SQLite）
- [ ] 项目 CRUD API
- [ ] 文件上传 API
- [ ] OAuth 第三方登录
- [ ] API 速率限制
