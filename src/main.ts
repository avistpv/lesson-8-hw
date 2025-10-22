import './style.css'
import {getAllTasks, createTask, deleteTask, patchTask, type Task} from './utilities'

const taskList = document.getElementById('task-list') as HTMLDivElement
const loadingElement = document.getElementById('loading') as HTMLDivElement
const errorElement = document.getElementById('error') as HTMLDivElement
const taskForm = document.getElementById('task-form') as HTMLFormElement
const modal = document.getElementById('task-modal') as HTMLDivElement
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement
const modalDescription = document.getElementById('modal-description') as HTMLSpanElement
const modalStatus = document.getElementById('modal-status') as HTMLSpanElement
const modalPriority = document.getElementById('modal-priority') as HTMLSpanElement
const modalCreated = document.getElementById('modal-created') as HTMLSpanElement
const closeModalBtn = document.getElementById('close-modal') as HTMLButtonElement
const toggleStatusBtn = document.getElementById('toggle-status-btn') as HTMLButtonElement
const deleteTaskBtn = document.getElementById('delete-task-btn') as HTMLButtonElement

let currentTask: Task | null = null

function showLoading() {
    loadingElement.classList.remove('hidden')
    errorElement.classList.add('hidden')
    taskList.classList.add('hidden')
}

function showError(message: string) {
    loadingElement.classList.add('hidden')
    errorElement.classList.remove('hidden')
    errorElement.textContent = message
    taskList.classList.add('hidden')
}

function hideLoadingAndError() {
    loadingElement.classList.add('hidden')
    errorElement.classList.add('hidden')
    taskList.classList.remove('hidden')
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getStatusIcon(status: string): string {
    switch (status) {
        case 'completed':
            return '✓'
        case 'in-progress':
            return '⟳'
        default:
            return '⋯'
    }
}

function createTaskTile(task: Task): HTMLDivElement {
    const tile = document.createElement('div')
    tile.className = 'task-tile'
    tile.onclick = () => openTaskModal(task)

    tile.innerHTML = `
    <div class="task-icon ${task.status.replace('-', '-')}">
      ${getStatusIcon(task.status)}
    </div>
    <div class="task-content">
      <h3 class="task-name">${task.name}</h3>
      <div class="task-status">${task.status}</div>
    </div>
  `

    return tile
}

function renderTasks(tasks: Task[]) {
    hideLoadingAndError()

    if (tasks.length === 0) {
        taskList.innerHTML = `
      <div class="empty-state">
        <h3>No tasks found</h3>
        <p>Create your first task to get started!</p>
      </div>
    `
        return
    }

    taskList.innerHTML = ''
    tasks.forEach(task => {
        const tile = createTaskTile(task)
        taskList.appendChild(tile)
    })
}

async function loadTasks() {
    try {
        console.log('Loading tasks from API...')
        showLoading()

        const tasks = await getAllTasks()
        console.log('Tasks loaded successfully:', tasks)
        renderTasks(tasks)
    } catch (error) {
        console.error('Error loading tasks:', error)
        showError(`Failed to load tasks: ${error.message}. Please check if the server is running.`)
    }
}

async function handleFormSubmit(event: Event) {
    event.preventDefault()

    const formData = new FormData(taskForm)
    const taskData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as 'pending' | 'in-progress' | 'completed',
        priority: formData.get('priority') as 'low' | 'medium' | 'high',
        deadline: formData.get('deadline') as string
    }

    if (!taskData.name || !taskData.description) {
        alert('Please fill in all required fields')
        return
    }

    try {
        console.log('Creating new task...', taskData)
        const newTask = await createTask({
            name: taskData.name,
            description: taskData.deadline
                ? `${taskData.description}\n\nDeadline: ${new Date(taskData.deadline).toLocaleDateString()}`
                : taskData.description,
            status: taskData.status,
            priority: taskData.priority
        })

        console.log('Task created successfully:', newTask)

        taskForm.reset()
        await loadTasks()

        const submitBtn = taskForm.querySelector('button[type="submit"]') as HTMLButtonElement
        const originalText = submitBtn.textContent
        submitBtn.textContent = '✓ Task Created!'
        submitBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)'

        setTimeout(() => {
            submitBtn.textContent = originalText
            submitBtn.style.background = ''
        }, 2000)

    } catch (error) {
        console.error('Error creating task:', error)
        alert('Failed to create task. Please try again.')
    }
}

function openTaskModal(task: Task) {
    currentTask = task
    modalTitle.textContent = task.name
    modalDescription.textContent = task.description
    modalStatus.textContent = task.status
    modalPriority.textContent = task.priority
    modalCreated.textContent = formatDate(task.createdAt)

    toggleStatusBtn.textContent = task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'

    modal.classList.remove('hidden')
}

function closeTaskModal() {
    modal.classList.add('hidden')
    currentTask = null
}

async function toggleTaskStatus() {
    if (!currentTask) return

    try {
        const newStatus = currentTask.status === 'completed' ? 'pending' : 'completed'
        await patchTask({id: currentTask.id, status: newStatus})
        currentTask.status = newStatus
        modalStatus.textContent = newStatus
        toggleStatusBtn.textContent = newStatus === 'completed' ? 'Mark Incomplete' : 'Mark Complete'
        await loadTasks()
    } catch (error) {
        console.error('Error updating task:', error)
        alert('Failed to update task status')
    }
}

async function deleteCurrentTask() {
    if (!currentTask) return
    if (!confirm(`Are you sure you want to delete "${currentTask.name}"?`)) return
    try {
        await deleteTask(currentTask.id)
        closeTaskModal()
        await loadTasks()
    } catch (error) {
        console.error('Error deleting task:', error)
        alert('Failed to delete task')
    }
}

closeModalBtn.addEventListener('click', closeTaskModal)
toggleStatusBtn.addEventListener('click', toggleTaskStatus)
deleteTaskBtn.addEventListener('click', deleteCurrentTask)
taskForm.addEventListener('submit', handleFormSubmit)
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeTaskModal()
    }
})
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeTaskModal()
    }
})

loadTasks()