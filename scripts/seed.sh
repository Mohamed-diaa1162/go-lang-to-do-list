#!/bin/bash

echo "Seeding 10,000 todos to the database..."
go run scripts/seed_todos.go

echo "Seeding completed!" 