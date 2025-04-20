package controllers

import (
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/todo-app/app/models"
	"github.com/yourusername/todo-app/database"
)

// TodoController handles todo operations
type TodoController struct{}

// PaginationResponse holds pagination metadata
type PaginationResponse struct {
	Total       int64       `json:"total"`
	PerPage     int         `json:"per_page"`
	CurrentPage int         `json:"current_page"`
	LastPage    int         `json:"last_page"`
	Data        interface{} `json:"data"`
}

// Index returns all todos with pagination and filtering
func (tc *TodoController) Index(c *gin.Context) {
	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10 // Default to 10 or cap at 100
	}

	var todos []models.Todo
	var total int64

	// Build query with filters
	query := database.GetDB().Model(&models.Todo{})

	// Filter by completion status if provided
	completedStr := c.Query("completed")
	if completedStr != "" {
		completed, err := strconv.ParseBool(completedStr)
		if err == nil {
			query = query.Where("completed = ?", completed)
		}
	}

	// Filter by priority if provided
	priority := c.Query("priority")
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}

	// Filter by category if provided
	category := c.Query("category")
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// Filter by due date range if provided
	dueDateStart := c.Query("due_date_start")
	if dueDateStart != "" {
		query = query.Where("due_date >= ?", dueDateStart)
	}

	dueDateEnd := c.Query("due_date_end")
	if dueDateEnd != "" {
		query = query.Where("due_date <= ?", dueDateEnd)
	}

	// Search functionality
	search := c.Query("search")
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title LIKE ? OR description LIKE ?", searchTerm, searchTerm)
	}

	// Count total records with filters
	query.Count(&total)

	// Determine sort order
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortDir := c.DefaultQuery("sort_dir", "desc")

	// Validate sort parameters to prevent SQL injection
	validFields := map[string]bool{
		"created_at": true,
		"updated_at": true,
		"title":      true,
		"due_date":   true,
		"priority":   true,
		"category":   true,
	}

	validDirs := map[string]bool{
		"asc":  true,
		"desc": true,
	}

	if !validFields[sortBy] {
		sortBy = "created_at"
	}

	if !validDirs[sortDir] {
		sortDir = "desc"
	}

	// Calculate offset
	offset := (page - 1) * perPage

	// Get paginated records
	result := query.Limit(perPage).Offset(offset).Order(sortBy + " " + sortDir).Find(&todos)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// Calculate last page
	lastPage := int(math.Ceil(float64(total) / float64(perPage)))

	// Return paginated response
	c.JSON(http.StatusOK, PaginationResponse{
		Total:       total,
		PerPage:     perPage,
		CurrentPage: page,
		LastPage:    lastPage,
		Data:        todos,
	})
}

// Show returns a specific todo
func (tc *TodoController) Show(c *gin.Context) {
	id := c.Param("id")
	var todo models.Todo

	result := database.GetDB().First(&todo, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, todo)
}

// Store creates a new todo
func (tc *TodoController) Store(c *gin.Context) {
	var todo models.Todo
	if err := c.ShouldBindJSON(&todo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate priority
	if todo.Priority != "" &&
		todo.Priority != models.PriorityLow &&
		todo.Priority != models.PriorityMedium &&
		todo.Priority != models.PriorityHigh {
		todo.Priority = models.PriorityMedium
	}

	// Set default category if empty
	if strings.TrimSpace(todo.Category) == "" {
		todo.Category = "general"
	}

	result := database.GetDB().Create(&todo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, todo)
}

// Update updates a todo
func (tc *TodoController) Update(c *gin.Context) {
	id := c.Param("id")
	var todo models.Todo

	// Check if todo exists
	result := database.GetDB().First(&todo, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	// Bind the JSON input to the todo
	if err := c.ShouldBindJSON(&todo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate priority
	if todo.Priority != "" &&
		todo.Priority != models.PriorityLow &&
		todo.Priority != models.PriorityMedium &&
		todo.Priority != models.PriorityHigh {
		todo.Priority = models.PriorityMedium
	}

	// Set default category if empty
	if strings.TrimSpace(todo.Category) == "" {
		todo.Category = "general"
	}

	// Update the todo
	database.GetDB().Save(&todo)
	c.JSON(http.StatusOK, todo)
}

// Delete deletes a todo
func (tc *TodoController) Delete(c *gin.Context) {
	id := c.Param("id")
	var todo models.Todo

	// Check if todo exists
	result := database.GetDB().First(&todo, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	// Delete the todo
	database.GetDB().Delete(&todo)
	c.JSON(http.StatusOK, gin.H{"message": "Todo deleted successfully"})
}

// ToggleComplete toggles the completed status of a todo
func (tc *TodoController) ToggleComplete(c *gin.Context) {
	id := c.Param("id")
	var todo models.Todo

	// Check if todo exists
	result := database.GetDB().First(&todo, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	// Toggle completed status
	todo.Completed = !todo.Completed
	database.GetDB().Save(&todo)
	c.JSON(http.StatusOK, todo)
}

// GetCategories returns all unique categories
func (tc *TodoController) GetCategories(c *gin.Context) {
	var categories []string
	database.GetDB().Model(&models.Todo{}).Distinct().Pluck("category", &categories)
	c.JSON(http.StatusOK, categories)
}
