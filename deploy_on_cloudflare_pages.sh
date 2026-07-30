#!/bin/bash
# Cloudflare Pages 手动部署脚本
# 前置条件：npm run build:h5（postbuild 钩子会自动执行 prepare-deploy.sh）

BUILD_DIR=dist/build/h5

# 构建+部署前准备
npm run build:h5

echo ""
echo "=== 部署到 Cloudflare Pages ==="
npx wrangler pages deploy "$BUILD_DIR" #--project-name run-lab
