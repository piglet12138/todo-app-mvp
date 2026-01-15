# 从零开始搭建Docker应用指南

## 📚 需要了解的基础知识

### 1. **技术栈选择**

#### 后端框架选择
- **FastAPI** (推荐) - 现代、快速、易学，适合API开发
  - 自动生成API文档
  - 类型提示支持
  - 异步支持
- **Flask** - 轻量级，灵活
- **Django** - 功能全面，适合大型项目

#### 编程语言
- **Python 3.11+** (推荐，基于你现有项目)
- Node.js / TypeScript
- Go / Rust (性能要求高时)

### 2. **Docker基础知识**

#### 核心概念
- **镜像(Image)**: 应用的只读模板
- **容器(Container)**: 镜像的运行实例
- **Dockerfile**: 构建镜像的指令文件
- **docker-compose.yml**: 多容器编排配置

#### 基本命令
```bash
# 构建镜像
docker build -t myapp:latest .

# 运行容器
docker run -d -p 8000:8000 --name myapp myapp:latest

# 查看运行中的容器
docker ps

# 查看日志
docker logs myapp

# 停止容器
docker stop myapp

# 删除容器
docker rm myapp
```

### 3. **项目结构规划**

```
myapp/
├── app/
│   ├── __init__.py
│   ├── main.py          # 应用入口
│   ├── models.py        # 数据模型
│   ├── routes.py        # 路由定义
│   └── utils.py         # 工具函数
├── static/              # 静态文件(HTML/CSS/JS)
├── requirements.txt     # Python依赖
├── .env                 # 环境变量(不要提交到git)
├── .env.example         # 环境变量示例
├── .dockerignore        # Docker忽略文件
├── Dockerfile           # Docker构建文件
├── docker-compose.yml   # Docker编排文件(可选)
└── README.md            # 项目说明
```

### 4. **开发环境准备**

#### 必需工具
1. **Python 3.11+**
   ```bash
   python --version
   pip --version
   ```

2. **Docker & Docker Compose**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **代码编辑器**
   - VS Code / Cursor (推荐)
   - PyCharm

#### 推荐VS Code插件
- Python
- Docker
- Remote - Containers

### 5. **开发流程**

#### 阶段1: 本地开发
1. 创建虚拟环境
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # 或 venv\Scripts\activate  # Windows
   ```

2. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

3. 运行应用
   ```bash
   python app/main.py
   # 或 uvicorn app.main:app --reload
   ```

#### 阶段2: Docker化
1. 编写Dockerfile
2. 测试构建
   ```bash
   docker build -t myapp:dev .
   docker run -p 8000:8000 myapp:dev
   ```

#### 阶段3: 部署
1. 推送到镜像仓库(可选)
2. 在服务器上拉取并运行

### 6. **关键文件详解**

#### Dockerfile最佳实践
```dockerfile
# 1. 使用官方基础镜像
FROM python:3.11-slim

# 2. 设置工作目录
WORKDIR /app

# 3. 先复制依赖文件(利用Docker缓存)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 复制应用代码
COPY . .

# 5. 暴露端口
EXPOSE 8000

# 6. 设置启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### requirements.txt示例
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
pydantic==2.5.0
```

#### .dockerignore示例
```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
venv/
env/
.git
.gitignore
.env
*.log
```

### 7. **环境变量管理**

#### 使用.env文件
```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost/db
API_KEY=your-secret-key
DEBUG=True
```

#### 在代码中读取
```python
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("API_KEY")
```

#### Docker中传递环境变量
```bash
# 方式1: 使用.env文件
docker run --env-file .env myapp

# 方式2: 直接传递
docker run -e API_KEY=xxx myapp
```

### 8. **常见问题解决**

#### 问题1: 容器内无法访问宿主机服务
- 使用 `host.docker.internal` (Docker Desktop)
- 或使用 `--network host` (Linux)

#### 问题2: 文件修改不生效
- 开发时使用volume挂载: `-v $(pwd):/app`
- 生产环境重新构建镜像

#### 问题3: 端口被占用
- 检查端口占用: `lsof -i :8000`
- 修改映射端口: `-p 8001:8000`

### 9. **学习路径建议**

#### 第1周: 基础应用
- [ ] 创建简单的FastAPI应用
- [ ] 实现1-2个API端点
- [ ] 本地测试运行

#### 第2周: Docker化
- [ ] 编写Dockerfile
- [ ] 构建并运行容器
- [ ] 理解镜像和容器的关系

#### 第3周: 完善功能
- [ ] 添加数据库(如SQLite/PostgreSQL)
- [ ] 实现CRUD操作
- [ ] 添加错误处理

#### 第4周: 部署实践
- [ ] 使用docker-compose编排
- [ ] 配置生产环境
- [ ] 部署到服务器

### 10. **推荐学习资源**

- **FastAPI官方文档**: https://fastapi.tiangolo.com/
- **Docker官方文档**: https://docs.docker.com/
- **Docker Compose文档**: https://docs.docker.com/compose/

## 🚀 下一步行动

1. **确定应用功能**: 你想实现什么功能？(例如：待办事项、博客、API服务等)
2. **选择技术栈**: 基于功能需求选择合适的技术
3. **搭建项目骨架**: 创建基础项目结构
4. **逐步实现功能**: 从简单到复杂
5. **Docker化**: 编写Dockerfile并测试
6. **部署**: 在服务器上运行

---

**提示**: 基于你现有的`mail_server_sg`项目，你已经有了很好的参考模板。可以参考其中的Dockerfile和项目结构来搭建新应用。
