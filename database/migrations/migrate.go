package migrations

import (
	"log"

	"github.com/yourusername/todo-app/app/models"
	"github.com/yourusername/todo-app/database"
)

// Migrate runs database migrations
func Migrate() {
	db := database.GetDB()

	// Create enum values (for MySQL compatibility)
	err := db.Exec("ALTER DATABASE IF EXISTS `go_todo_app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci").Error
	if err != nil {
		log.Printf("Warning: Failed to set character set: %v", err)
	}

	// Add your models here to auto-migrate
	err = db.AutoMigrate(&models.Todo{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Check if priority column exists and has default value
	var result []string
	db.Raw("SHOW COLUMNS FROM todos LIKE 'priority'").Pluck("Default", &result)

	// If priority column was just created or has no default, update existing records
	if len(result) == 0 || result[0] == "" {
		// Update existing records to set defaults for new columns
		db.Exec("UPDATE todos SET priority = ? WHERE priority IS NULL OR priority = ''", models.PriorityMedium)
		db.Exec("UPDATE todos SET category = ? WHERE category IS NULL OR category = ''", "general")
		log.Println("Updated existing todos with default values for new fields")
	}

	log.Println("Database migration completed")
}
