# Docker权限问题解决方案

## 问题描述
运行 `docker` 命令时出现：
```
permission denied while trying to connect to the Docker daemon socket
```

## 解决方案

### 方案一：将用户添加到docker组（推荐，永久解决）

1. **将当前用户添加到docker组**
   ```bash
   sudo usermod -aG docker $USER
   ```
   需要输入你的用户密码

2. **使组权限生效**
   
   有两种方式：
   
   **方式A：重新登录**（推荐）
   - 完全退出当前会话并重新登录
   - 或者重启系统
   
   **方式B：使用newgrp命令**（临时生效）
   ```bash
   newgrp docker
   ```
   注意：这会启动一个新的shell，组权限只在当前shell中生效

3. **验证是否成功**
   ```bash
   groups  # 应该能看到 docker 组
   docker ps  # 应该能正常运行，不再需要sudo
   ```

### 方案二：使用sudo（临时方案）

如果暂时不想修改用户组，可以在所有docker命令前加 `sudo`：

```bash
# 构建镜像
sudo docker build -t todo-app .

# 运行容器
sudo docker run -d -p 8000:8000 --name todo-app todo-app:latest

# 查看日志
sudo docker logs todo-app

# 停止容器
sudo docker stop todo-app

# 删除容器
sudo docker rm todo-app
```

**或者使用docker-compose：**
```bash
sudo docker-compose up --build
```

### 方案三：修改docker.sock权限（不推荐）

```bash
sudo chmod 666 /var/run/docker.sock
```

⚠️ **警告**：这种方法会降低安全性，不推荐在生产环境使用。

## 推荐操作步骤

1. **执行添加用户到docker组**（需要密码）
   ```bash
   sudo usermod -aG docker $USER
   ```

2. **重新登录或使用newgrp**
   ```bash
   newgrp docker
   ```

3. **验证**
   ```bash
   docker ps
   ```

4. **如果成功，就可以正常使用docker命令了**
   ```bash
   cd "/home/yao/mail bot/daily_report/todo-app-mvp"
   docker build -t todo-app .
   docker-compose up --build
   ```

## 为什么会出现这个问题？

Docker守护进程默认只允许root用户和docker组的成员访问。这是Linux的安全机制，防止未授权用户访问Docker。

## 注意事项

- 添加到docker组后，用户实际上获得了root权限（因为可以运行容器）
- 只在信任的环境中使用此方法
- 如果是在共享服务器上，请谨慎操作
