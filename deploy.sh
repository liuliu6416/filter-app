#!/bin/bash
# 滤镜 PWA 部署脚本 - 一键推送到 GitHub Pages
# 使用: bash deploy.sh

set -e

echo "🎨 滤镜 PWA 部署工具"
echo "===================="
echo ""

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
  echo "❌ 请在 pwa 目录下运行此脚本"
  exit 1
fi

# 检查是否有未提交的更改
if [ -d ".git" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "📝 有未提交的更改，先提交..."
    git add -A
    git commit -m "Update filter app" || true
  fi
else
  echo "🔧 初始化 Git 仓库..."
  git init
  git add -A
  git commit -m "Initial commit: 滤镜 PWA"
fi

echo ""
echo "下一步需要手动操作："
echo ""
echo "1. 在 GitHub 上创建新仓库（如 filter-app）"
echo "   👉 https://github.com/new"
echo ""
echo "2. 运行以下命令（替换 YOUR_USERNAME 为你的 GitHub 用户名）："
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/filter-app.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 在 GitHub 仓库 Settings > Pages 中："
echo "   - Source 选择 'Deploy from a branch'"
echo "   - Branch 选择 'main'，文件夹选 '/ (root)'"
echo "   - 点击 Save"
echo ""
echo "4. 等待 1-2 分钟，你的网址就是："
echo "   👉 https://YOUR_USERNAME.github.io/filter-app/"
echo ""
echo "这个网址是永久的，手机打开就能用！"
