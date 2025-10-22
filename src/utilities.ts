export interface Task {
  id: number | string;
  name: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface CreateTaskData {
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateTaskData {
  id: number | string;
  name?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

const BASE_URL = '/api';

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export async function createTask(taskData: CreateTaskData): Promise<Task> {
  const newTask = {
    ...taskData,
    createdAt: new Date().toISOString(),
  };

  return apiRequest<Task>(`${BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(newTask),
  });
}

export async function getAllTasks(): Promise<Task[]> {
  return apiRequest<Task[]>(`${BASE_URL}/tasks`);
}

export async function getTaskById(id: number | string): Promise<Task> {
  return apiRequest<Task>(`${BASE_URL}/tasks/${id}`);
}

export async function updateTask(id: number | string, taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  return apiRequest<Task>(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
}

export async function patchTask(updateData: UpdateTaskData): Promise<Task> {
  const { id, ...dataToUpdate } = updateData;
  return apiRequest<Task>(`${BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dataToUpdate),
  });
}

export async function deleteTask(id: number | string): Promise<void> {
  await apiRequest<void>(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  return apiRequest<Task[]>(`${BASE_URL}/tasks?status=${status}`);
}

export async function getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
  return apiRequest<Task[]>(`${BASE_URL}/tasks?priority=${priority}`);
}

export async function searchTasksByName(name: string): Promise<Task[]> {
  return apiRequest<Task[]>(`${BASE_URL}/tasks?name_like=${encodeURIComponent(name)}`);
}
