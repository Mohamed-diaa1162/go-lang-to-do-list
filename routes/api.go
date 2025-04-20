package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/todo-app/app/controllers"
)

// SetupAPIRoutes sets up all the API routes
func SetupAPIRoutes(router *gin.Engine) {
	todoController := &controllers.TodoController{}
	api := router.Group("/api")
	{
		// Todo routes
		api.GET("/todos", todoController.Index)
		api.GET("/todos/:id", todoController.Show)
		api.POST("/todos", todoController.Store)
		api.PUT("/todos/:id", todoController.Update)
		api.DELETE("/todos/:id", todoController.Delete)
		api.PATCH("/todos/:id/toggle", todoController.ToggleComplete)

		// Utility routes
		api.GET("/categories", todoController.GetCategories)
	}
}
