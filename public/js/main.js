// Main JavaScript file for Todo App

document.addEventListener('DOMContentLoaded', function() {
    // Confirm deletions
    const deleteLinks = document.querySelectorAll('.delete-todo');
    deleteLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this todo?')) {
                e.preventDefault();
            }
        });
    });

    // AJAX toggle status (if needed)
    const toggleButtons = document.querySelectorAll('.toggle-status');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const todoId = this.getAttribute('data-id');
            
            fetch(`/api/todos/${todoId}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                // Refresh the page or update the UI
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    });
}); 