#!/bin/bash
# Docker权限修复脚本

echo "🔧 修复Docker权限..."
echo "===================="
echo ""
echo "请执行以下命令（需要输入密码）："
echo ""
echo "sudo usermod -aG docker yao"
echo ""
echo "执行后，请选择以下方式之一使权限生效："
echo "1. 重新登录系统（推荐）"
echo "2. 或执行: newgrp docker"
echo ""
echo "验证命令："
echo "docker ps"
echo ""
