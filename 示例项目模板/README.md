# 简单应用示例 - 待办事项API

这是一个最小化的FastAPI应用示例，展示如何从零开始搭建并Docker化。

## 功能
- 创建待办事项
- 查看所有待办事项
- 更新待办事项状态
- 删除待办事项

## 快速开始

### 本地开发
```bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 运行应用
uvicorn app.main:app --reload
```

访问: http://localhost:8000
API文档: http://localhost:8000/docs

### Docker运行
```bash
# 构建镜像
docker build -t todo-app:latest .

# 运行容器
docker run -d -p 8000:8000 --name todo-app todo-app:latest

# 查看日志
docker logs todo-app

# 停止容器
docker stop todo-app
```
