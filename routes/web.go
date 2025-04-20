package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/todo-app/app/controllers"
)

// SetupWebRoutes sets up all the web routes
func SetupWebRoutes(router *gin.Engine) {
	webController := &controllers.WebController{}

	// SPA route - serve the SPA for all routes
	router.GET("/", webController.ServeSPA)

	// Legacy routes for backward compatibility
	// These will be handled by the SPA via client-side routing
	router.GET("/todos/create", webController.ServeSPA)
	router.GET("/todos/:id/edit", webController.ServeSPA)

	// API fallback for POST/PUT/DELETE actions if JS is disabled
	// In a full SPA these would typically be removed, but keeping for compatibility
	router.POST("/todos", webController.Create)
	router.POST("/todos/:id", webController.Update)
	router.GET("/todos/:id/delete", webController.Delete)
	router.GET("/todos/:id/toggle", webController.ToggleComplete)
}
