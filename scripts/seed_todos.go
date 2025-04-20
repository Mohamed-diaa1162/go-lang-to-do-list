package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/yourusername/todo-app/app/models"
	"github.com/yourusername/todo-app/config"
	"github.com/yourusername/todo-app/database"
)

// Sample data for random generation
var (
	titles = []string{
		"Complete project", "Review code", "Write documentation", "Fix bug", "Implement feature",
		"Update dependencies", "Refactor code", "Create test cases", "Deploy application", "Send email",
		"Schedule meeting", "Prepare presentation", "Research topic", "Call client", "Submit report",
	}

	descriptions = []string{
		"This needs to be done ASAP", "Not urgent but important", "Take your time with this one",
		"This is a critical task", "Follow up with team", "Double check before completing",
		"Make sure to test thoroughly", "Document the process", "Get approval before proceeding",
		"Coordinate with other teams", "High priority task", "Low priority task", "Medium priority",
	}
)

func main() {
	start := time.Now()

	// Load configuration
	appConfig := config.LoadConfig()

	// Initialize database
	err := database.Initialize(appConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Connected to database")

	// Initialize random source with current time
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	// Create batch of todos
	batchSize := 100
	totalTodos := 10000

	for i := 0; i < totalTodos; i += batchSize {
		var todos []models.Todo
		currentBatch := batchSize
		if i+batchSize > totalTodos {
			currentBatch = totalTodos - i
		}

		// Create todos for this batch
		for j := 0; j < currentBatch; j++ {
			todo := models.Todo{
				Title:       titles[r.Intn(len(titles))] + " #" + fmt.Sprintf("%d", i+j+1),
				Description: descriptions[r.Intn(len(descriptions))],
				Completed:   r.Float32() < 0.3,                                           // 30% completed
				CreatedAt:   time.Now().Add(-time.Duration(r.Intn(30)) * 24 * time.Hour), // Random date within last 30 days
			}
			todos = append(todos, todo)
		}

		// Insert batch
		result := database.GetDB().Create(&todos)
		if result.Error != nil {
			log.Fatalf("Failed to insert todos: %v", result.Error)
		}

		log.Printf("Inserted todos %d to %d", i+1, i+currentBatch)
	}

	elapsed := time.Since(start)
	log.Printf("Created %d todos in %s", totalTodos, elapsed)
}
