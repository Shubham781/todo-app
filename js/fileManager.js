let fileHandle;

async function initializeFileSystem() {
    try {
        if ('showSaveFilePicker' in window) {
            try {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'tasks.txt',
                    types: [{
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt'] },
                    }],
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn('File picker error:', err);
                }
                await loadFromLocalStorage(); // Fallback to localStorage
                return;
            }
        }
        await loadTasks();
    } catch (err) {
        console.warn('Using localStorage fallback:', err);
        await loadFromLocalStorage(); // Fallback to localStorage
    }
}

async function saveTasksToFile() {
    try {
        if (!Array.isArray(window.tasks)) {
            throw new Error('Invalid tasks data');
        }
        if (fileHandle) {
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(window.tasks, null, 2));
            await writable.close();
        } else {
            localStorage.setItem('tasks', JSON.stringify(window.tasks));
        }
    } catch (err) {
        console.error('Error saving tasks:', err);
        try {
            localStorage.setItem('tasks', JSON.stringify(window.tasks)); // Fallback to localStorage
        } catch (localErr) {
            console.error('Failed to save to localStorage:', localErr);
        }
    }
}

async function loadTasks() {
    try {
        if (fileHandle) {
            const file = await fileHandle.getFile();
            const contents = await file.text();
            window.tasks = contents ? JSON.parse(contents) : [];
        } else {
            await loadFromLocalStorage(); // Fallback to localStorage
        }
        window.displayTasks();
    } catch (err) {
        console.error('Error loading tasks:', err);
        await loadFromLocalStorage(); // Fallback to localStorage
    }
}

async function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem('tasks');
    window.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    window.displayTasks();
}

async function addTask(task) {
    window.tasks.push(task);
    await saveTasksToFile();
    window.displayTasks();
}

async function updateTask(task) {
    const index = window.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
        window.tasks[index] = task;
        await saveTasksToFile();
        window.displayTasks();
    }
}

async function deleteTask(id) {
    window.tasks = window.tasks.filter(t => t.id !== id);
    await saveTasksToFile();
    window.displayTasks();
}

window.initializeFileSystem = initializeFileSystem;
window.addTask = addTask;
window.updateTask = updateTask;
window.deleteTask = deleteTask;