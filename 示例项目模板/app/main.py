"""
简单的待办事项API应用
演示FastAPI基础功能和Docker部署
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 创建FastAPI应用实例
app = FastAPI(
    title="待办事项API",
    description="一个简单的待办事项管理API",
    version="1.0.0"
)

# 数据模型
class TodoItem(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    completed: bool = False
    created_at: Optional[str] = None

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

# 内存存储(实际应用中应使用数据库)
todos_db: List[TodoItem] = []
next_id = 1

@app.get("/")
async def root():
    """根路径，返回API信息"""
    return {
        "message": "欢迎使用待办事项API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/todos", response_model=List[TodoItem])
async def get_todos():
    """获取所有待办事项"""
    return todos_db

@app.get("/todos/{todo_id}", response_model=TodoItem)
async def get_todo(todo_id: int):
    """根据ID获取单个待办事项"""
    todo = next((t for t in todos_db if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项未找到")
    return todo

@app.post("/todos", response_model=TodoItem, status_code=201)
async def create_todo(todo: TodoCreate):
    """创建新的待办事项"""
    global next_id
    new_todo = TodoItem(
        id=next_id,
        title=todo.title,
        description=todo.description,
        completed=False,
        created_at=datetime.now().isoformat()
    )
    todos_db.append(new_todo)
    next_id += 1
    return new_todo

@app.put("/todos/{todo_id}", response_model=TodoItem)
async def update_todo(todo_id: int, todo_update: TodoUpdate):
    """更新待办事项"""
    todo = next((t for t in todos_db if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项未找到")
    
    if todo_update.title is not None:
        todo.title = todo_update.title
    if todo_update.description is not None:
        todo.description = todo_update.description
    if todo_update.completed is not None:
        todo.completed = todo_update.completed
    
    return todo

@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int):
    """删除待办事项"""
    global todos_db
    todo = next((t for t in todos_db if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项未找到")
    
    todos_db = [t for t in todos_db if t.id != todo_id]
    return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
