# Todo App MVP - 完整的待办事项Web应用

这是一个完整的全栈Web应用示例，包含前端（HTML/CSS/JavaScript）和后端（FastAPI），使用内存存储，无需数据库。

## 🎯 功能特性

- ✅ 添加待办事项（标题和描述）
- ✅ 查看所有待办事项
- ✅ 标记完成/取消完成
- ✅ 编辑待办事项
- ✅ 删除待办事项
- ✅ 筛选功能（全部/未完成/已完成）
- ✅ 实时统计（总数/已完成/未完成）
- ✅ 现代化UI设计
- ✅ 响应式布局（支持移动端）

## 📁 项目结构

```
todo-app-mvp/
├── app/
│   └── main.py          # FastAPI后端应用
├── static/
│   ├── index.html       # 前端HTML页面
│   ├── style.css        # 样式文件
│   └── app.js           # 前端JavaScript逻辑
├── requirements.txt     # Python依赖
├── Dockerfile           # Docker构建文件
├── docker-compose.yml   # Docker编排文件
└── README.md            # 项目说明
```

## 🚀 快速开始

### 方式一：本地运行（推荐用于开发）

1. **创建虚拟环境**
   ```bash
   cd todo-app-mvp
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # 或 venv\Scripts\activate  # Windows
   ```

2. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

3. **运行应用**
   ```bash
   uvicorn app.main:app --reload
   ```

4. **访问应用**
   - 打开浏览器访问: http://localhost:8000
   - API文档: http://localhost:8000/docs

### 方式二：Docker运行

**⚠️ 如果遇到权限错误，请先解决Docker权限问题（见下方说明）**

1. **使用Docker Compose（推荐）**
   ```bash
   cd todo-app-mvp
   docker-compose up --build
   ```
   
   如果遇到权限问题，使用：
   ```bash
   sudo docker-compose up --build
   ```

2. **或使用Docker命令**
   ```bash
   # 构建镜像
   docker build -t todo-app:latest .
   
   # 如果遇到权限问题，使用：
   sudo docker build -t todo-app:latest .

   # 运行容器
   docker run -d -p 8000:8000 --name todo-app todo-app:latest
   
   # 如果遇到权限问题，使用：
   sudo docker run -d -p 8000:8000 --name todo-app todo-app:latest
   ```

3. **访问应用**
   - 打开浏览器访问: http://localhost:8000

### 查看日志
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f todo-app
```

### 停止应用
```bash
# Docker Compose
docker-compose down

# Docker
docker stop todo-app
docker rm todo-app
```

## 📚 技术栈

### 后端
- **FastAPI**: 现代、快速的Python Web框架
- **Uvicorn**: ASGI服务器
- **Pydantic**: 数据验证

### 前端
- **HTML5**: 页面结构
- **CSS3**: 样式设计（包含渐变、动画等现代特性）
- **Vanilla JavaScript**: 原生JS，无框架依赖

### 部署
- **Docker**: 容器化部署
- **Docker Compose**: 容器编排

## 🔧 API端点

所有API端点都在 `/api` 路径下：

- `GET /api/todos` - 获取所有待办事项
- `GET /api/todos/{id}` - 获取单个待办事项
- `POST /api/todos` - 创建新待办事项
- `PUT /api/todos/{id}` - 更新待办事项
- `DELETE /api/todos/{id}` - 删除待办事项
- `GET /api/health` - 健康检查

## 💡 学习要点

### 1. 前后端分离架构
- 前端通过 `/static` 路径提供静态文件
- 后端API在 `/api` 路径下
- 使用 `fetch` API进行前后端通信

### 2. FastAPI静态文件服务
```python
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")
```

### 3. CORS处理
当前配置允许前端访问后端API（同源，无需CORS）。如果前后端分离部署，需要添加CORS中间件。

### 4. 数据存储
当前使用内存存储（列表），应用重启后数据会丢失。生产环境应使用数据库。

## 🎨 自定义开发

### 修改样式
编辑 `static/style.css` 文件

### 修改功能
- 后端逻辑: `app/main.py`
- 前端逻辑: `static/app.js`
- 页面结构: `static/index.html`

### 添加新功能
1. 在后端添加新的API端点
2. 在前端添加对应的UI和JavaScript函数
3. 测试功能是否正常

## 📝 下一步学习方向

1. **添加数据库**
   - SQLite（简单）
   - PostgreSQL（生产环境）
   - 使用SQLAlchemy ORM

2. **用户认证**
   - JWT Token
   - OAuth2登录

3. **前端框架**
   - React / Vue.js
   - 组件化开发

4. **部署**
   - 云服务器部署
   - CI/CD自动化部署
   - Nginx反向代理

## ❓ 常见问题

**Q: Docker命令出现 "permission denied" 错误？**  
A: 这是Docker权限问题。有两种解决方案：
1. **推荐**：将用户添加到docker组（永久解决）
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker  # 或重新登录
   ```
2. **临时**：在所有docker命令前加 `sudo`
   ```bash
   sudo docker build -t todo-app .
   sudo docker-compose up --build
   ```
   详细说明请查看 `Docker权限问题解决方案.md`

**Q: 数据丢失了？**  
A: 当前使用内存存储，重启应用后数据会丢失。这是为了简化学习，生产环境应使用数据库。

**Q: 如何修改端口？**  
A: 修改 `Dockerfile` 中的 `EXPOSE` 和启动命令，以及 `docker-compose.yml` 中的端口映射。

**Q: 如何添加HTTPS？**  
A: 可以使用Nginx反向代理，或参考 `mail_server_sg` 项目中的HTTPS配置。

## 📄 许可证

本项目仅用于学习目的。

---

**祝你学习愉快！** 🎉
