let fileHandle;

async function initializeFileSystem() {
    try {
        if ('showDirectoryPicker' in window) {
            // Allow the user to select the directory
            const dirHandle = await window.showDirectoryPicker();
            console.log('Directory selected:', dirHandle);

            // Get or create the tasks.txt file
            fileHandle = await dirHandle.getFileHandle('tasks.txt', { create: true });
            console.log('File handle initialized:', fileHandle);
        } else {
            console.warn('File System Access API not supported. Falling back to localStorage.');
            await loadFromLocalStorage();
        }
        await loadTasks();
    } catch (err) {
        console.error('Error initializing file system:', err);
        await loadFromLocalStorage(); // Fallback to localStorage
    }
}

async function saveTasksToFile() {
    try {
        if (!Array.isArray(window.tasks)) {
            throw new Error('Invalid tasks data');
        }
        if (fileHandle) {
            // Ensure the file handle has write permissions
            const writable = await fileHandle.createWritable();
            console.log('Writing tasks to file:', window.tasks);
            await writable.write(JSON.stringify(window.tasks, null, 2));
            await writable.close();
            console.log('Tasks successfully saved to file.');
        } else {
            console.warn('File handle is not initialized. Falling back to localStorage.');
            localStorage.setItem('tasks', JSON.stringify(window.tasks));
        }
    } catch (err) {
        console.error('Error saving tasks to file:', err);
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
window.saveTasksToFile = saveTasksToFile;