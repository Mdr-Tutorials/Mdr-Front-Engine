# 部署

MdrFrontEngine 支持多种部署方式，从传统静态托管到 Web3 去中心化部署。本文档介绍各种部署选项和配置方法。

## 部署选项概览

| 平台 | 特点 | 适用场景 |
| --- | --- | --- |
| **GitHub Pages** | 免费、与 GitHub 集成 | 开源项目、个人站点 |
| **Vercel** | 自动部署、边缘网络 | 生产应用、团队协作 |
| **Netlify** | 表单处理、函数支持 | 需要后端功能的站点 |
| **自托管** | 完全控制 | 企业内部、特殊需求 |
| **IPFS** | 去中心化、永存 | Web3 应用 |

## GitHub Pages

### 在线部署

1. 在导出面板选择 **"部署到 GitHub Pages"**
2. 授权 GitHub 访问
3. 选择目标仓库和分支
4. 确认部署

### 手动部署

1. 导出项目代码
2. 推送到 GitHub 仓库
3. 配置 GitHub Actions：

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

4. 在仓库 Settings → Pages 中启用 GitHub Pages

### 配置自定义域名

1. 在仓库根目录创建 `CNAME` 文件：
```
www.example.com
```

2. 在域名 DNS 设置中添加 CNAME 记录指向 `username.github.io`

## Vercel

### 一键部署

1. 在导出面板选择 **"部署到 Vercel"**
2. 授权 Vercel 访问
3. 配置项目名称和环境变量
4. 确认部署

### 命令行部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 导出项目
mdr export --target react --output ./dist

# 部署
cd dist
vercel
```

### vercel.json 配置

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### 环境变量

在 Vercel 面板或 `.env` 文件中配置：

```bash
# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App
```

## Netlify

### 一键部署

1. 在导出面板选择 **"部署到 Netlify"**
2. 授权 Netlify 访问
3. 配置构建设置
4. 确认部署

### netlify.toml 配置

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

### Netlify Functions

如果需要后端功能：

```javascript
// netlify/functions/api.js
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from Netlify Functions!" })
  };
};
```

## 自托管

### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/my-app/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

```bash
# 构建和运行
docker-compose up -d
```

## Web3 部署

### IPFS 部署

1. 在导出面板选择 **"部署到 IPFS"**
2. 选择 IPFS 网关（Infura、Pinata、Web3.Storage）
3. 确认部署

手动部署：

```bash
# 安装 IPFS CLI
npm i -g ipfs-car

# 打包上传
ipfs-car pack dist --output app.car
# 上传到 Pinata 或其他服务
```

### 配置 IPFS 兼容

```javascript
// vite.config.ts
export default defineConfig({
  base: './',  // 使用相对路径
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 确保文件名可预测
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
});
```

### ENS 域名

将 IPFS 哈希绑定到 ENS 域名：

1. 获取部署的 IPFS CID
2. 在 ENS 管理器中设置 Content Hash
3. 通过 `https://myapp.eth.limo` 访问

## CLI 部署命令

```bash
# 部署到 GitHub Pages
mdr deploy --platform github-pages

# 部署到 Vercel
mdr deploy --platform vercel

# 部署到 Netlify
mdr deploy --platform netlify

# 部署到 IPFS
mdr deploy --platform ipfs --gateway pinata

# 自定义部署
mdr deploy --platform custom --script ./deploy.sh
```

## 环境配置

### 多环境支持

```bash
# .env.development
VITE_API_URL=http://localhost:3000
VITE_DEBUG=true

# .env.staging
VITE_API_URL=https://staging-api.example.com
VITE_DEBUG=true

# .env.production
VITE_API_URL=https://api.example.com
VITE_DEBUG=false
```

### 构建时注入

```bash
# 使用特定环境构建
pnpm build --mode staging
pnpm build --mode production
```

## 部署检查清单

### 部署前

- [ ] 运行 `pnpm build` 确保构建成功
- [ ] 运行 `pnpm preview` 本地预览
- [ ] 检查环境变量配置
- [ ] 确认 API 端点正确
- [ ] 检查静态资源路径

### 部署后

- [ ] 验证所有页面可访问
- [ ] 测试路由跳转
- [ ] 检查 API 调用
- [ ] 验证 HTTPS 证书
- [ ] 测试移动端兼容性
- [ ] 检查 SEO 元信息

## 故障排除

### 404 错误

SPA 应用需要配置服务器将所有路由指向 `index.html`。

### 资源加载失败

检查 `base` 配置是否正确：
- GitHub Pages: `base: '/repo-name/'`
- 根域名: `base: '/'`
- IPFS: `base: './'`

### CORS 错误

确保 API 服务器配置了正确的 CORS 头，或使用代理。

### 构建失败

1. 清理缓存：`rm -rf node_modules/.vite`
2. 重新安装依赖：`pnpm install`
3. 检查 TypeScript 错误：`pnpm tsc --noEmit`

## 下一步

- [主题定制](/guide/theming) - 定制应用外观
- [国际化](/guide/i18n) - 多语言支持
- [CLI 工具](/api/cli) - 了解更多部署选项
