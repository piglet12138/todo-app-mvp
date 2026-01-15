// Todo App - 前端JavaScript代码

// API基础URL
const API_BASE = '/api';

// 当前筛选状态
let currentFilter = 'all';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 表单提交
    document.getElementById('todoForm').addEventListener('submit', handleAddTodo);
    
    // 筛选按钮
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFilter = e.target.dataset.filter;
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadTodos();
        });
    });
}

// 处理添加待办事项
async function handleAddTodo(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!title) {
        alert('请输入待办事项标题');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description || null
            })
        });
        
        if (response.ok) {
            document.getElementById('todoForm').reset();
            loadTodos();
        } else {
            throw new Error('添加失败');
        }
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('添加待办事项失败，请重试');
    }
}

// 加载所有待办事项
async function loadTodos() {
    const todosList = document.getElementById('todosList');
    todosList.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/todos`);
        if (!response.ok) throw new Error('加载失败');
        
        const todos = await response.json();
        displayTodos(todos);
        updateStats(todos);
    } catch (error) {
        console.error('Error loading todos:', error);
        todosList.innerHTML = '<div class="empty-state">加载失败，请刷新页面重试</div>';
    }
}

// 显示待办事项列表
function displayTodos(todos) {
    const todosList = document.getElementById('todosList');
    
    // 根据筛选条件过滤
    let filteredTodos = todos;
    if (currentFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    } else if (currentFilter === 'pending') {
        filteredTodos = todos.filter(t => !t.completed);
    }
    
    if (filteredTodos.length === 0) {
        todosList.innerHTML = '<div class="empty-state">暂无待办事项<br>添加一个开始吧！</div>';
        return;
    }
    
    todosList.innerHTML = filteredTodos.map(todo => createTodoHTML(todo)).join('');
    
    // 为每个待办事项添加事件监听
    filteredTodos.forEach(todo => {
        setupTodoEventListeners(todo.id);
    });
}

// 创建待办事项HTML
function createTodoHTML(todo) {
    const date = new Date(todo.created_at).toLocaleString('zh-CN');
    const completedClass = todo.completed ? 'completed' : '';
    
    return `
        <div class="todo-item ${completedClass}" data-id="${todo.id}">
            <div class="todo-header">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
            </div>
            ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
            <div class="todo-meta">
                <div class="todo-date">创建时间: ${date}</div>
                <div class="todo-actions">
                    ${!todo.completed ? 
                        `<button class="btn btn-small btn-complete" onclick="toggleComplete(${todo.id})">完成</button>` : 
                        `<button class="btn btn-small btn-complete" onclick="toggleComplete(${todo.id})">取消完成</button>`
                    }
                    <button class="btn btn-small btn-edit" onclick="editTodo(${todo.id})">编辑</button>
                    <button class="btn btn-small btn-delete" onclick="deleteTodo(${todo.id})">删除</button>
                </div>
            </div>
        </div>
    `;
}

// 设置待办事项事件监听
function setupTodoEventListeners(todoId) {
    // 事件已经在HTML中通过onclick绑定
}

// 切换完成状态
async function toggleComplete(todoId) {
    try {
        const response = await fetch(`${API_BASE}/todos/${todoId}`);
        if (!response.ok) throw new Error('获取待办事项失败');
        
        const todo = await response.json();
        
        const updateResponse = await fetch(`${API_BASE}/todos/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                completed: !todo.completed
            })
        });
        
        if (updateResponse.ok) {
            loadTodos();
        } else {
            throw new Error('更新失败');
        }
    } catch (error) {
        console.error('Error toggling complete:', error);
        alert('操作失败，请重试');
    }
}

// 编辑待办事项
async function editTodo(todoId) {
    try {
        const response = await fetch(`${API_BASE}/todos/${todoId}`);
        if (!response.ok) throw new Error('获取待办事项失败');
        
        const todo = await response.json();
        const todoItem = document.querySelector(`[data-id="${todoId}"]`);
        
        // 切换到编辑模式
        todoItem.classList.add('editing');
        todoItem.innerHTML = `
            <form class="edit-form" onsubmit="saveEdit(event, ${todoId})">
                <input type="text" id="edit-title-${todoId}" value="${escapeHtml(todo.title)}" required>
                <textarea id="edit-description-${todoId}" rows="3">${escapeHtml(todo.description || '')}</textarea>
                <div class="edit-form-actions">
                    <button type="submit" class="btn btn-small btn-save">保存</button>
                    <button type="button" class="btn btn-small btn-cancel" onclick="cancelEdit(${todoId})">取消</button>
                </div>
            </form>
        `;
    } catch (error) {
        console.error('Error editing todo:', error);
        alert('加载待办事项失败，请重试');
    }
}

// 保存编辑
async function saveEdit(e, todoId) {
    e.preventDefault();
    
    const title = document.getElementById(`edit-title-${todoId}`).value.trim();
    const description = document.getElementById(`edit-description-${todoId}`).value.trim();
    
    if (!title) {
        alert('标题不能为空');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/todos/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description || null
            })
        });
        
        if (response.ok) {
            loadTodos();
        } else {
            throw new Error('保存失败');
        }
    } catch (error) {
        console.error('Error saving edit:', error);
        alert('保存失败，请重试');
    }
}

// 取消编辑
function cancelEdit(todoId) {
    loadTodos();
}

// 删除待办事项
async function deleteTodo(todoId) {
    if (!confirm('确定要删除这个待办事项吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/todos/${todoId}`, {
            method: 'DELETE'
        });
        
        if (response.ok || response.status === 204) {
            loadTodos();
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('删除失败，请重试');
    }
}

// 更新统计信息
function updateStats(todos) {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = pending;
}

// HTML转义函数（防止XSS攻击）
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
