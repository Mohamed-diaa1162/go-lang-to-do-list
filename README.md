# Go Todo Application

A simple Todo application built with Go, Gin framework, and MySQL database with a Laravel-like structure.

## Features

- RESTful API for CRUD operations on todos
- Web interface with Bootstrap styling
- MySQL database integration with GORM

## Project Structure

```
├── app
│   ├── controllers     # Controllers for handling requests
│   ├── models          # Database models
│   ├── views           # HTML templates
│   └── middleware      # Middleware functions
├── config              # Application configuration
├── database            # Database connection and migrations
├── public              # Static assets
├── routes              # Route definitions
└── main.go             # Application entry point
```

## Requirements

- Go 1.18 or higher
- MySQL database

## Setup

1. Clone this repository
2. Create a MySQL database named `go_todo_app`
3. Update the `.env` file with your database credentials
4. Run the application:

```bash
go run main.go
```

## API Endpoints

- `GET /api/todos` - Get all todos
- `GET /api/todos/:id` - Get a specific todo
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo
- `PATCH /api/todos/:id/toggle` - Toggle todo completion status

## Web Routes

- `GET /` - Home page with todo list
- `GET /todos/create` - Form to create a new todo
- `POST /todos` - Submit new todo
- `GET /todos/:id/edit` - Form to edit a todo
- `POST /todos/:id` - Update a todo
- `GET /todos/:id/delete` - Delete a todo 