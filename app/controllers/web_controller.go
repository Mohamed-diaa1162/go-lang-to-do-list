package controllers

import (
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/todo-app/app/models"
	"github.com/yourusername/todo-app/database"
)

// WebController handles web views
type WebController struct{}

// ServeSPA renders the SPA HTML page
func (wc *WebController) ServeSPA(c *gin.Context) {
	c.HTML(http.StatusOK, "spa.html", gin.H{
		"title": "Todo App - SPA",
	})
}

// Home renders the home page
func (wc *WebController) Home(c *gin.Context) {
	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 50 {
		perPage = 10 // Default to 10 or cap at 50 for UI
	}

	var todos []models.Todo
	var total int64

	// Build query with filters
	query := database.GetDB().Model(&models.Todo{})

	// Get filter parameters
	filter := c.DefaultQuery("filter", "all")
	search := c.Query("search")
	priority := c.Query("priority")
	category := c.Query("category")

	// Apply completion filter
	switch filter {
	case "active":
		query = query.Where("completed = ?", false)
	case "completed":
		query = query.Where("completed = ?", true)
	}

	// Apply search filter if provided
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title LIKE ? OR description LIKE ?", searchTerm, searchTerm)
	}

	// Apply priority filter if provided
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}

	// Apply category filter if provided
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// Count total records with filters
	query.Count(&total)

	// Calculate offset
	offset := (page - 1) * perPage

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

	// Get paginated records
	query.Limit(perPage).Offset(offset).Order(sortBy + " " + sortDir).Find(&todos)

	// Calculate pagination metadata
	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	startPage := page - 2
	if startPage < 1 {
		startPage = 1
	}

	endPage := startPage + 4
	if endPage > lastPage {
		endPage = lastPage
		startPage = endPage - 4
		if startPage < 1 {
			startPage = 1
		}
	}

	// Get all available categories
	var categories []string
	database.GetDB().Model(&models.Todo{}).Distinct().Pluck("category", &categories)

	// Counters for dashboard stats
	var activeCount, completedCount int64
	database.GetDB().Model(&models.Todo{}).Where("completed = ?", false).Count(&activeCount)
	database.GetDB().Model(&models.Todo{}).Where("completed = ?", true).Count(&completedCount)

	// Generate date string for due date filtering
	today := time.Now().Format("2006-01-02")

	c.HTML(http.StatusOK, "index.html", gin.H{
		"title":          "Todo App",
		"todos":          todos,
		"total":          total,
		"activeCount":    activeCount,
		"completedCount": completedCount,
		"currentPage":    page,
		"perPage":        perPage,
		"lastPage":       lastPage,
		"startPage":      startPage,
		"endPage":        endPage,
		"filter":         filter,
		"search":         search,
		"priority":       priority,
		"category":       category,
		"categories":     categories,
		"sortBy":         sortBy,
		"sortDir":        sortDir,
		"today":          today,
	})
}

// CreateForm renders the create todo form
func (wc *WebController) CreateForm(c *gin.Context) {
	// Get all available categories
	var categories []string
	database.GetDB().Model(&models.Todo{}).Distinct().Pluck("category", &categories)

	// If no categories exist yet, add "general"
	if len(categories) == 0 {
		categories = append(categories, "general")
	}

	c.HTML(http.StatusOK, "create.html", gin.H{
		"title":      "Create Todo",
		"categories": categories,
	})
}

// EditForm renders the edit todo form
func (wc *WebController) EditForm(c *gin.Context) {
	id := c.Param("id")
	var todo models.Todo

	result := database.GetDB().First(&todo, id)
	if result.Error != nil {
		c.Redirect(http.StatusFound, "/")
		return
	}

	// Get all available categories
	var categories []string
	database.GetDB().Model(&models.Todo{}).Distinct().Pluck("category", &categories)

	// Make sure the current category is in the list
	categoryExists := false
	for _, cat := range categories {
		if cat == todo.Category {
			categoryExists = true
			break
		}
	}

	if !categoryExists && todo.Category != "" {
		categories = append(categories, todo.Category)
	}

	c.HTML(http.StatusOK, "edit.html", gin.H{
		"title":      "Edit Todo",
		"todo":       todo,
		"categories": categories,
	})
}

// Create handles the todo creation form submission
func (wc *WebController) Create(c *gin.Context) {
	title := c.PostForm("title")
	description := c.PostForm("description")
	priority := c.PostForm("priority")
	category := c.PostForm("category")
	dueDate := c.PostForm("due_date")

	// Validate priority
	if priority != models.PriorityLow &&
		priority != models.PriorityMedium &&
		priority != models.PriorityHigh {
		priority = models.PriorityMedium
	}

	// Set default category if empty
	if strings.TrimSpace(category) == "" {
		category = "general"
	}

	// Create the new todo
	todo := models.Todo{
		Title:       title,
		Description: description,
		Priority:    priority,
		Category:    category,
		Completed:   false,
	}

	// Parse due date if provided
	if dueDate != "" {
		parsedDate, err := time.Parse("2006-01-02", dueDate)
		if err == nil {
			todo.DueDate = &parsedDate
		}
	}

	database.GetDB().Create(&todo)
	c.Redirect(http.StatusFound, "/")
}

// Update handles the todo update form submission
func (wc *WebController) Update(c *gin.Context) {
	id := c.Param("id")
	var todo models.Todo

	// Check if todo exists
	result := database.GetDB().First(&todo, id)
	if result.Error != nil {
		c.Redirect(http.StatusFound, "/")
		return
	}

	todo.Title = c.PostForm("title")
	todo.Description = c.PostForm("description")
	todo.Priority = c.PostForm("priority")
	todo.Category = c.PostForm("category")
	completed, _ := strconv.ParseBool(c.PostForm("completed"))
	todo.Completed = completed

	// Validate priority
	if todo.Priority != models.PriorityLow &&
		todo.Priority != models.PriorityMedium &&
		todo.Priority != models.PriorityHigh {
		todo.Priority = models.PriorityMedium
	}

	// Set default category if empty
	if strings.TrimSpace(todo.Category) == "" {
		todo.Category = "general"
	}

	// Handle due date
	dueDate := c.PostForm("due_date")
	if dueDate != "" {
		parsedDate, err := time.Parse("2006-01-02", dueDate)
		if err == nil {
			todo.DueDate = &parsedDate
		}
	} else {
		// Clear due date if field is empty
		todo.DueDate = nil
	}

	database.GetDB().Save(&todo)
	c.Redirect(http.StatusFound, "/")
}

// Delete handles the todo deletion
func (wc *WebController) Delete(c *gin.Context) {
	id := c.Param("id")
	database.GetDB().Delete(&models.Todo{}, id)
	c.Redirect(http.StatusFound, "/")
}

// ToggleComplete handles the todo completion toggle
func (wc *WebController) ToggleComplete(c *gin.Context) {
	id := c.Param("id")
	var todo models.Todo

	result := database.GetDB().First(&todo, id)
	if result.Error != nil {
		c.Redirect(http.StatusFound, "/")
		return
	}

	todo.Completed = !todo.Completed
	database.GetDB().Save(&todo)

	// Redirect back to the page they came from, or home if referer is not set
	c.Redirect(http.StatusFound, c.DefaultQuery("redirect", "/"))
}
