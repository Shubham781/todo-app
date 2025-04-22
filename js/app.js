let editingTaskId = null;

function displayTasks() {
    const taskList = document.getElementById('taskList');
    const completedTaskList = document.getElementById('completedTaskList');
    taskList.innerHTML = '';
    completedTaskList.innerHTML = '';

    const taskArray = window.tasks || [];

    // Sort tasks by deadline
    taskArray.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    if (taskArray.length === 0) {
        taskList.innerHTML = '<div class="no-tasks">No tasks yet</div>';
        return;
    }

    taskArray.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-header">
                    <h3>${task.name}</h3>
                </div>
                <p>${task.description || 'No description'}</p>
                <small>Due: ${new Date(task.deadline).toLocaleString()}</small>
            </div>
            ${!task.completed ? `
            <div class="task-actions">
                <button onclick="toggleTask(${task.id})" class="completed-btn" aria-label="Mark as Completed">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="editTask(${task.id})" class="edit-btn" aria-label="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmDelete(${task.id})" class="delete-btn" aria-label="Delete Task">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ` : ''}
        `;

        if (task.completed) {
            completedTaskList.appendChild(taskElement);
        } else {
            taskList.appendChild(taskElement);
        }
    });
}

async function toggleTask(id) {
    try {
        const task = window.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            await updateTask(task);
        }
    } catch (err) {
        console.error('Error toggling task:', err);
        alert('Failed to update task status');
    }
}

function confirmDelete(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(id);
    }
}

function editTask(id) {
    const task = window.tasks.find(t => t.id === id);
    if (task) {
        editingTaskId = id;
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDesc').value = task.description || '';
        document.getElementById('taskDeadline').value = task.deadline;
        modal.style.display = 'block';
    }
}

// Modal functionality
const modal = document.getElementById('taskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeBtn = document.querySelector('.close');

addTaskBtn.onclick = () => {
    modal.style.display = 'block';
    editingTaskId = null;
    document.getElementById('taskForm').reset();

    // Set default datetime to current time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    document.getElementById('taskDeadline').value =
        `${year}-${month}-${day}T${hours}:${minutes}`;
};

closeBtn.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

document.getElementById('taskDeadline').addEventListener('click', function(e) {
    e.stopPropagation();
    this.showPicker();
});

// Check browser compatibility
document.addEventListener('DOMContentLoaded', async () => {
    if (!('showSaveFilePicker' in window)) {
        alert('Your browser may not support all features. Using fallback storage.');
    }

    // Initialize global display functions
    window.displayTasks = displayTasks;
    window.toggleTask = toggleTask;
    window.editTask = editTask;
    window.confirmDelete = confirmDelete;

    // Initialize file system and load tasks
    await initializeFileSystem();
});

// Form submission
document.getElementById('taskForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nameInput = document.getElementById('taskName');
    const deadlineInput = document.getElementById('taskDeadline');

    // Validate inputs
    if (!nameInput.value.trim()) {
        alert('Task name is required');
        return;
    }

    const deadlineDate = new Date(deadlineInput.value);
    if (isNaN(deadlineDate.getTime())) {
        alert('Please enter a valid deadline');
        return;
    }

    const task = {
        id: editingTaskId || Date.now(),
        name: nameInput.value.trim(),
        description: document.getElementById('taskDesc').value.trim(),
        deadline: deadlineInput.value,
        completed: editingTaskId
            ? window.tasks.find(t => t.id === editingTaskId)?.completed || false
            : false
    };

    try {
        if (editingTaskId) {
            await updateTask(task);
        } else {
            await addTask(task);
        }
        modal.style.display = 'none';
        this.reset();
        editingTaskId = null;
    } catch (err) {
        console.error('Error saving task:', err);
        alert('Error saving task. Please try again.');
    }
});

// Make functions global
window.toggleTask = toggleTask;
window.editTask = editTask;
window.confirmDelete = confirmDelete;
window.displayTasks = displayTasks;
window.deleteTask = deleteTask;
window.updateTask = updateTask;
window.addTask = addTask;
