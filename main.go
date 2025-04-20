package main

import (
	"fmt"
	"html/template"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/todo-app/config"
	"github.com/yourusername/todo-app/database"
	"github.com/yourusername/todo-app/database/migrations"
	"github.com/yourusername/todo-app/routes"
)

func main() {
	// Load configuration
	appConfig := config.LoadConfig()

	// Initialize database
	err := database.Initialize(appConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	migrations.Migrate()

	// Create a new Gin router
	router := gin.Default()

	// Define custom template functions
	router.SetFuncMap(template.FuncMap{
		"add": func(a, b int) int {
			return a + b
		},
		"sub": func(a, b int) int {
			return a - b
		},
		"mul": func(a, b int) int {
			return a * b
		},
		"div": func(a, b int) int {
			if b == 0 {
				return 0
			}
			return a / b
		},
		"divf": func(a, b float64) float64 {
			if b == 0 {
				return 0
			}
			return a / b
		},
		"iterate": func(start, end int) []int {
			var result []int
			for i := start; i <= end; i++ {
				result = append(result, i)
			}
			return result
		},
		"now": func() time.Time {
			return time.Now()
		},
	})

	// Load HTML templates
	router.LoadHTMLGlob("app/views/*")

	// Serve static files
	router.Static("/public", "./public")

	// Setup routes
	routes.SetupWebRoutes(router)
	routes.SetupAPIRoutes(router)

	// Start the server
	address := fmt.Sprintf(":%s", appConfig.AppPort)
	log.Printf("Server running on %s", address)
	if err := router.Run(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
