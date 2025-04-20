package models

import (
	"time"
)

// Priority levels for todos
const (
	PriorityLow    = "low"
	PriorityMedium = "medium"
	PriorityHigh   = "high"
)

// Todo represents a todo item
type Todo struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	Title       string     `json:"title" gorm:"size:255;not null"`
	Description string     `json:"description" gorm:"type:text"`
	Completed   bool       `json:"completed" gorm:"default:false"`
	Priority    string     `json:"priority" gorm:"default:'medium';size:10"`
	Category    string     `json:"category" gorm:"size:50;default:'general'"`
	DueDate     *time.Time `json:"due_date" gorm:"default:null"`
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for the model
func (Todo) TableName() string {
	return "todos"
}
