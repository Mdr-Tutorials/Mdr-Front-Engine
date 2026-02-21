#!/usr/bin/env bash

set -euo pipefail

# 如果你想每次运行特定的版本，可以修改这个变量
# 也可以在运行脚本时通过参数传入：./start-app.sh sha-12345
DEFAULT_TAG="sha-557cad1"
TAG="${1:-$DEFAULT_TAG}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.ghcr.yml"
ENV_FILE="$SCRIPT_DIR/.env"

echo "🚀 开始部署版本: $TAG ..."

# 1. 初始化 .env 文件（如果不存在）
if [ ! -f "$ENV_FILE" ]; then
  echo "📝 正在根据 .env.example 创建 .env 文件..."
  cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"
fi

# 2. 清理旧容器和残留网络（确保环境干净）
echo "🧹 正在清理旧容器..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans

# 3. 拉取并启动服务
echo "📥 正在拉取镜像..."
IMAGE_TAG="$TAG" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "🏗️ 正在启动服务..."
IMAGE_TAG="$TAG" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# 4. 检查结果
echo "---------------------------------------"
echo "✅ 部署成功！"
echo "📊 当前运行状态："
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
echo "🌐 前端访问地址: 端口 4173"
echo "🔗 后端 API 地址: 端口 8080"
