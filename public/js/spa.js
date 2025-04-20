// Todo App SPA JavaScript

// State management
const state = {
    todos: [],
    categories: [],
    stats: {
        total: 0,
        active: 0,
        completed: 0
    },
    filters: {
        filter: 'all',       // all, active, completed
        search: '',
        priority: '',
        category: '',
        sortBy: 'created_at',
        sortDir: 'desc',
        page: 1,
        perPage: 10
    }
};

// Router configuration
const routes = {
    '/': homeView,
    '/create': createView,
    '/edit/:id': editView,
};

// DOM elements
const appContainer = document.getElementById('app-container');
const themeToggle = document.getElementById('theme-toggle');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set up theme toggle
    initThemeToggle();
    
    // Set up router
    window.addEventListener('hashchange', router);
    
    // Initial route
    router();
});

// Simple router implementation
function router() {
    const url = location.hash.slice(1) || '/';
    let matchedRoute = null;
    let params = {};
    
    // Find matching route
    for (const path in routes) {
        const pathSegments = path.split('/');
        const urlSegments = url.split('/');
        
        if (pathSegments.length !== urlSegments.length) continue;
        
        let match = true;
        for (let i = 0; i < pathSegments.length; i++) {
            if (pathSegments[i].startsWith(':')) {
                // Route parameter
                params[pathSegments[i].slice(1)] = urlSegments[i];
            } else if (pathSegments[i] !== urlSegments[i]) {
                match = false;
                break;
            }
        }
        
        if (match) {
            matchedRoute = routes[path];
            break;
        }
    }
    
    // Execute the matched route handler
    if (matchedRoute) {
        matchedRoute(params);
    } else {
        // Fallback to home if no route matches
        homeView();
    }
}

// Theme toggle functionality
function initThemeToggle() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        themeToggle.checked = true;
    }
    
    // Toggle theme when switch is clicked
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
}

// API Service
const api = {
    // Get all todos with filters
    async getTodos() {
        const { filter, search, priority, category, sortBy, sortDir, page, perPage } = state.filters;
        let url = `/api/todos?page=${page}&per_page=${perPage}&sort_by=${sortBy}&sort_dir=${sortDir}`;
        
        if (filter === 'active') url += '&completed=false';
        if (filter === 'completed') url += '&completed=true';
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (priority) url += `&priority=${encodeURIComponent(priority)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching todos:', error);
            return { data: [], total: 0 };
        }
    },
    
    // Get a single todo by ID
    async getTodo(id) {
        try {
            const response = await fetch(`/api/todos/${id}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching todo ${id}:`, error);
            return null;
        }
    },
    
    // Create a new todo
    async createTodo(todo) {
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todo)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating todo:', error);
            return null;
        }
    },
    
    // Update a todo
    async updateTodo(id, todo) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todo)
            });
            return await response.json();
        } catch (error) {
            console.error(`Error updating todo ${id}:`, error);
            return null;
        }
    },
    
    // Delete a todo
    async deleteTodo(id) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error(`Error deleting todo ${id}:`, error);
            return null;
        }
    },
    
    // Toggle todo completion status
    async toggleTodo(id) {
        try {
            const response = await fetch(`/api/todos/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            return await response.json();
        } catch (error) {
            console.error(`Error toggling todo ${id}:`, error);
            return null;
        }
    },
    
    // Get all categories
    async getCategories() {
        try {
            const response = await fetch('/api/categories');
            return await response.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }
};

// View Handlers
async function homeView() {
    showLoading();
    
    // Load the home template
    const template = document.getElementById('home-template');
    const content = template.content.cloneNode(true);
    
    // Replace the app container content
    clearAppContainer();
    appContainer.appendChild(content);
    
    // Set up event listeners for the home view
    setupHomeEventListeners();
    
    // Load data
    await Promise.all([
        loadTodos(),
        loadCategories()
    ]);
    
    // Update UI with loaded data
    renderTodos();
    renderCategories();
    renderStats();
    renderFilters();
    renderPagination();
    
    hideLoading();
}

async function createView() {
    showLoading();
    
    // Load the create template
    const template = document.getElementById('create-template');
    const content = template.content.cloneNode(true);
    
    // Replace the app container content
    clearAppContainer();
    appContainer.appendChild(content);
    
    // Load categories for the datalist
    await loadCategories();
    populateCategoryDatalist('category-list');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('create-due-date').setAttribute('min', today);
    
    // Set up event listeners
    document.getElementById('create-todo-form').addEventListener('submit', handleCreateTodo);
    document.getElementById('create-cancel-btn').addEventListener('click', () => window.location.hash = '#/');
    
    hideLoading();
}

async function editView(params) {
    showLoading();
    
    const id = params.id;
    if (!id) {
        window.location.hash = '#/';
        return;
    }
    
    // Load the edit template
    const template = document.getElementById('edit-template');
    const content = template.content.cloneNode(true);
    
    // Replace the app container content
    clearAppContainer();
    appContainer.appendChild(content);
    
    // Load todo data and categories
    const [todo] = await Promise.all([
        api.getTodo(id),
        loadCategories()
    ]);
    
    if (!todo) {
        window.location.hash = '#/';
        return;
    }
    
    // Populate the form with todo data
    document.getElementById('edit-todo-id').value = todo.id;
    document.getElementById('edit-title').value = todo.title;
    document.getElementById('edit-description').value = todo.description;
    
    // Set priority
    document.getElementById(`edit-priority-${todo.priority}`).checked = true;
    
    // Set due date if present
    if (todo.due_date) {
        const dueDate = new Date(todo.due_date);
        document.getElementById('edit-due-date').value = dueDate.toISOString().split('T')[0];
    }
    
    // Set category
    document.getElementById('edit-category').value = todo.category;
    
    // Set completed status
    document.getElementById('edit-completed').checked = todo.completed;
    
    // Display timestamps
    const createdAt = new Date(todo.created_at).toLocaleString();
    const updatedAt = new Date(todo.updated_at).toLocaleString();
    let timeInfo = `<i class="bi bi-calendar3 me-1"></i> Created: ${createdAt}`;
    
    if (todo.created_at !== todo.updated_at) {
        timeInfo += `<span class="ms-3"><i class="bi bi-arrow-clockwise me-1"></i> Last Updated: ${updatedAt}</span>`;
    }
    
    document.getElementById('created-info').innerHTML = timeInfo;
    
    // Populate category datalist
    populateCategoryDatalist('edit-category-list');
    
    // Set up event listeners
    document.getElementById('edit-todo-form').addEventListener('submit', handleUpdateTodo);
    document.getElementById('edit-cancel-btn').addEventListener('click', () => window.location.hash = '#/');
    document.getElementById('edit-delete-btn').addEventListener('click', () => handleDeleteTodo(todo.id));
    
    hideLoading();
}

// Event Handlers
function setupHomeEventListeners() {
    // Search form
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.filters.search = searchInput.value;
        state.filters.page = 1; // Reset to first page
        loadTodos().then(() => {
            renderTodos();
            renderPagination();
        });
    });
    
    searchInput.addEventListener('input', () => {
        if (searchInput.value === '' && state.filters.search !== '') {
            state.filters.search = '';
            state.filters.page = 1; // Reset to first page
            loadTodos().then(() => {
                renderTodos();
                renderPagination();
            });
        }
    });
    
    // Sort selectors
    document.getElementById('sort-by').addEventListener('change', (e) => {
        state.filters.sortBy = e.target.value;
        loadTodos().then(() => renderTodos());
    });
    
    document.getElementById('sort-dir').addEventListener('change', (e) => {
        state.filters.sortDir = e.target.value;
        loadTodos().then(() => renderTodos());
    });
}

async function handleCreateTodo(e) {
    e.preventDefault();
    
    const form = e.target;
    const title = document.getElementById('create-title').value;
    const description = document.getElementById('create-description').value;
    const priority = form.querySelector('input[name="priority"]:checked').value;
    const category = document.getElementById('create-category').value || 'general';
    const dueDateInput = document.getElementById('create-due-date').value;
    
    const todo = {
        title,
        description,
        priority,
        category,
        completed: false
    };
    
    if (dueDateInput) {
        todo.due_date = new Date(dueDateInput).toISOString();
    }
    
    const result = await api.createTodo(todo);
    if (result) {
        window.location.hash = '#/';
    }
}

async function handleUpdateTodo(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-todo-id').value;
    const title = document.getElementById('edit-title').value;
    const description = document.getElementById('edit-description').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const category = document.getElementById('edit-category').value || 'general';
    const dueDateInput = document.getElementById('edit-due-date').value;
    const completed = document.getElementById('edit-completed').checked;
    
    const todo = {
        title,
        description,
        priority,
        category,
        completed
    };
    
    if (dueDateInput) {
        todo.due_date = new Date(dueDateInput).toISOString();
    }
    
    const result = await api.updateTodo(id, todo);
    if (result) {
        window.location.hash = '#/';
    }
}

async function handleDeleteTodo(id) {
    if (confirm('Are you sure you want to delete this todo?')) {
        const result = await api.deleteTodo(id);
        if (result) {
            window.location.hash = '#/';
        }
    }
}

async function handleToggleTodo(id) {
    const result = await api.toggleTodo(id);
    if (result) {
        // Find and update the todo in the state
        const index = state.todos.findIndex(todo => todo.id === id);
        if (index !== -1) {
            state.todos[index].completed = result.completed;
            renderTodos();
            renderStats();
        }
    }
}

// Data loading functions
async function loadTodos() {
    const result = await api.getTodos();
    state.todos = result.data || [];
    state.stats.total = result.total || 0;
    state.stats.completed = state.todos.filter(todo => todo.completed).length;
    state.stats.active = state.stats.total - state.stats.completed;
    return result;
}

async function loadCategories() {
    state.categories = await api.getCategories();
    return state.categories;
}

// Rendering functions
function renderTodos() {
    const container = document.getElementById('todos-container');
    if (!container) return;
    
    if (state.todos.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info p-4 text-center">
                <i class="bi bi-info-circle display-5 d-block mb-3"></i>
                <h4>No todos found</h4>
                <p>
                    ${state.filters.search || state.filters.priority || state.filters.category 
                        ? 'No todos match your current filters. Try adjusting your search criteria.'
                        : 'Start by creating your first todo!'}
                </p>
                ${state.filters.search || state.filters.priority || state.filters.category 
                    ? '<a href="#/" class="btn btn-primary mt-2"><i class="bi bi-x-circle me-1"></i>Clear Filters</a>'
                    : '<a href="#/create" class="btn btn-primary mt-2"><i class="bi bi-plus-lg me-1"></i>Create New Todo</a>'}
            </div>
        `;
        return;
    }
    
    let html = '';
    
    html += `
        <div class="filter-container d-flex justify-content-between align-items-center mb-3">
            <div>
                <span class="text-muted">Showing ${state.todos.length} of ${state.stats.total} items</span>
            </div>
            <div>
                <select id="per-page-select" class="form-select form-select-sm per-page-dropdown me-2">
                    <option value="10" ${state.filters.perPage === 10 ? 'selected' : ''}>10</option>
                    <option value="20" ${state.filters.perPage === 20 ? 'selected' : ''}>20</option>
                    <option value="50" ${state.filters.perPage === 50 ? 'selected' : ''}>50</option>
                </select>
                <label class="form-label align-self-center mb-0">per page</label>
            </div>
        </div>
    `;
    
    state.todos.forEach(todo => {
        // Format the due date if present
        let dueDateHtml = '';
        if (todo.due_date) {
            const now = new Date();
            const dueDate = new Date(todo.due_date);
            const diffDays = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
            const formattedDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
            
            let dueDateLabel = '';
            if (diffDays < 0) {
                dueDateLabel = '(Overdue)';
            } else if (diffDays === 0) {
                dueDateLabel = '(Today)';
            } else if (diffDays === 1) {
                dueDateLabel = '(Tomorrow)';
            } else if (diffDays < 7) {
                dueDateLabel = '(This week)';
            }
            
            dueDateHtml = `
                <span class="due-date ${diffDays < 0 ? 'overdue' : ''}">
                    <i class="bi ${diffDays < 0 ? 'bi-exclamation-circle' : 'bi-calendar-check'} me-1"></i>
                    ${formattedDate}
                    ${dueDateLabel}
                </span>
            `;
        }
        
        // Format the timestamps
        const createdAt = new Date(todo.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit'
        });
        
        html += `
            <div class="todo-card p-3 ${todo.completed ? 'completed' : ''} priority-${todo.priority}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="d-flex align-items-center">
                            <a href="#/" class="btn-toggle me-2 toggle-todo" data-id="${todo.id}" title="${todo.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                                <i class="bi ${todo.completed ? 'bi-check-circle-fill text-success' : 'bi-circle'} fs-4"></i>
                            </a>
                            <h5 class="todo-title mb-0">${todo.title}</h5>
                            <span class="priority-badge priority-${todo.priority}">
                                ${todo.priority === 'low' ? '<i class="bi bi-arrow-down-circle me-1"></i>Low' : 
                                  todo.priority === 'medium' ? '<i class="bi bi-dash-circle me-1"></i>Medium' : 
                                  '<i class="bi bi-arrow-up-circle me-1"></i>High'}
                            </span>
                            ${dueDateHtml}
                        </div>
                        <p class="todo-description mb-2">${todo.description}</p>
                        <div class="d-flex flex-wrap">
                            <span class="status-badge ${todo.completed ? 'badge-completed' : 'badge-pending'}">
                                ${todo.completed ? 
                                  '<i class="bi bi-check-circle me-1"></i>Completed' : 
                                  '<i class="bi bi-clock me-1"></i>Pending'}
                            </span>
                            <small class="text-muted ms-3 me-3">Created: ${createdAt}</small>
                            <span class="category-tag">
                                <i class="bi bi-tag-fill me-1"></i>${todo.category}
                            </span>
                        </div>
                    </div>
                    <div class="btn-group">
                        <a href="#/edit/${todo.id}" class="btn btn-action btn-edit">
                            <i class="bi bi-pencil-square me-1"></i>Edit
                        </a>
                        <button class="btn btn-action btn-delete delete-todo" data-id="${todo.id}">
                            <i class="bi bi-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to the toggle buttons
    document.querySelectorAll('.toggle-todo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(btn.getAttribute('data-id'));
            handleToggleTodo(id);
        });
    });
    
    // Add event listeners to the delete buttons
    document.querySelectorAll('.delete-todo').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            handleDeleteTodo(id);
        });
    });
    
    // Add event listener to the per page selector
    const perPageSelect = document.getElementById('per-page-select');
    if (perPageSelect) {
        perPageSelect.addEventListener('change', (e) => {
            state.filters.perPage = parseInt(e.target.value);
            state.filters.page = 1; // Reset to first page
            loadTodos().then(() => {
                renderTodos();
                renderPagination();
            });
        });
    }
}

function renderStats() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stats-card mb-3">
            <div class="d-flex align-items-center">
                <div class="stats-icon me-3 p-3 rounded-circle" style="background-color: rgba(67, 97, 238, 0.1);">
                    <i class="bi bi-list-check text-primary fs-4"></i>
                </div>
                <div>
                    <div class="stats-number">${state.stats.total}</div>
                    <div class="stats-label">Total Todos</div>
                </div>
            </div>
        </div>
        
        <div class="stats-card mb-3">
            <div class="d-flex align-items-center">
                <div class="stats-icon me-3 p-3 rounded-circle" style="background-color: rgba(46, 204, 113, 0.1);">
                    <i class="bi bi-check2-all text-success fs-4"></i>
                </div>
                <div>
                    <div class="stats-number">${state.stats.completed}</div>
                    <div class="stats-label">Completed</div>
                </div>
            </div>
        </div>
        
        <div class="stats-card mb-3">
            <div class="d-flex align-items-center">
                <div class="stats-icon me-3 p-3 rounded-circle" style="background-color: rgba(248, 150, 30, 0.1);">
                    <i class="bi bi-hourglass-split text-warning fs-4"></i>
                </div>
                <div>
                    <div class="stats-number">${state.stats.active}</div>
                    <div class="stats-label">Pending</div>
                </div>
            </div>
        </div>
    `;
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    let html = '';
    state.categories.forEach(category => {
        html += `
            <a href="#/" class="category-tag mb-2 category-filter" data-category="${category}">
                <i class="bi bi-tag-fill me-1"></i>${category}
            </a>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to the category tags
    document.querySelectorAll('.category-filter').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters.category = tag.getAttribute('data-category');
            state.filters.page = 1; // Reset to first page
            loadTodos().then(() => {
                renderTodos();
                renderFilters();
                renderPagination();
            });
        });
    });
}

function renderFilters() {
    const container = document.getElementById('filter-buttons');
    if (!container) return;
    
    const { filter, priority, category } = state.filters;
    
    container.innerHTML = `
        <a href="#/" class="btn filter-btn me-2 mb-2 ${filter === 'all' ? 'active' : ''}" data-filter="all">
            <i class="bi bi-collection me-1"></i>All
        </a>
        <a href="#/" class="btn filter-btn me-2 mb-2 ${filter === 'active' ? 'active' : ''}" data-filter="active">
            <i class="bi bi-clock-history me-1"></i>Active
        </a>
        <a href="#/" class="btn filter-btn me-2 mb-2 ${filter === 'completed' ? 'active' : ''}" data-filter="completed">
            <i class="bi bi-check2-all me-1"></i>Completed
        </a>
        
        <div class="dropdown me-2 mb-2">
            <button class="btn filter-btn dropdown-toggle ${priority ? 'active' : ''}" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-flag me-1"></i>Priority
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item ${priority === 'low' ? 'active' : ''}" href="#/" data-priority="low">Low</a></li>
                <li><a class="dropdown-item ${priority === 'medium' ? 'active' : ''}" href="#/" data-priority="medium">Medium</a></li>
                <li><a class="dropdown-item ${priority === 'high' ? 'active' : ''}" href="#/" data-priority="high">High</a></li>
                ${priority ? '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="#/" data-priority="">Clear Filter</a></li>' : ''}
            </ul>
        </div>
        
        <div class="dropdown me-2 mb-2">
            <button class="btn filter-btn dropdown-toggle ${category ? 'active' : ''}" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-tag me-1"></i>Category
            </button>
            <ul class="dropdown-menu">
                ${state.categories.map(cat => `<li><a class="dropdown-item ${category === cat ? 'active' : ''}" href="#/" data-category="${cat}">${cat}</a></li>`).join('')}
                ${category ? '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="#/" data-category="">Clear Filter</a></li>' : ''}
            </ul>
        </div>
        
        ${priority || category || state.filters.search ? `
        <a href="#/" class="btn filter-btn mb-2 clear-all-filters">
            <i class="bi bi-x-circle me-1"></i>Clear All Filters
        </a>
        ` : ''}
    `;
    
    // Add event listeners to the filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters.filter = btn.getAttribute('data-filter');
            state.filters.page = 1; // Reset to first page
            loadTodos().then(() => {
                renderTodos();
                renderFilters();
                renderPagination();
            });
        });
    });
    
    // Add event listeners to the priority dropdown items
    document.querySelectorAll('[data-priority]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters.priority = item.getAttribute('data-priority');
            state.filters.page = 1; // Reset to first page
            loadTodos().then(() => {
                renderTodos();
                renderFilters();
                renderPagination();
            });
        });
    });
    
    // Add event listeners to the category dropdown items
    document.querySelectorAll('[data-category]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters.category = item.getAttribute('data-category');
            state.filters.page = 1; // Reset to first page
            loadTodos().then(() => {
                renderTodos();
                renderFilters();
                renderPagination();
            });
        });
    });
    
    // Add event listener to the clear all filters button
    const clearAllBtn = document.querySelector('.clear-all-filters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters.filter = 'all';
            state.filters.priority = '';
            state.filters.category = '';
            state.filters.search = '';
            document.getElementById('search-input').value = '';
            state.filters.page = 1; // Reset to first page
            loadTodos().then(() => {
                renderTodos();
                renderFilters();
                renderPagination();
            });
        });
    }
}

function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    const totalPages = Math.ceil(state.stats.total / state.filters.perPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    const currentPage = state.filters.page;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    let html = `
        <nav aria-label="Page navigation">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#/" data-page="${currentPage - 1}" aria-label="Previous">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
    `;
    
    // First page link if not in first few pages
    if (startPage > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#/" data-page="1">1</a>
            </li>
        `;
        
        if (startPage > 2) {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }
    
    // Page number links
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#/" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Last page link if not in last few pages
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
        
        html += `
            <li class="page-item">
                <a class="page-link" href="#/" data-page="${totalPages}">${totalPages}</a>
            </li>
        `;
    }
    
    html += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#/" data-page="${currentPage + 1}" aria-label="Next">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            </ul>
        </nav>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners to the pagination links
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.getAttribute('data-page'));
            if (page < 1 || page > totalPages || page === currentPage) return;
            
            state.filters.page = page;
            loadTodos().then(() => {
                renderTodos();
                renderPagination();
                window.scrollTo(0, 0);
            });
        });
    });
}

// Helper functions
function populateCategoryDatalist(listId) {
    const datalist = document.getElementById(listId);
    if (!datalist) return;
    
    datalist.innerHTML = state.categories.map(category => `<option value="${category}">`).join('');
}

function clearAppContainer() {
    appContainer.innerHTML = '';
}

function showLoading() {
    clearAppContainer();
    appContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function hideLoading() {
    const spinner = appContainer.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
} 