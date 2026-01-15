#!/bin/bash
# 快速启动脚本

echo "🚀 启动 Todo App MVP"
echo "===================="

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖..."
pip install -q -r requirements.txt

# 启动应用
echo "✅ 启动应用..."
echo "访问地址: http://localhost:8000"
echo "按 Ctrl+C 停止应用"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
