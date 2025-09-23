import type { Task } from '@/contexts/TasksContext';

const BASE_URL = (import.meta as any).env?.VITE_AGENT_API_URL || 'http://localhost:8787';

export type ListQuery = Partial<{
  course: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  starred: boolean;
  overdue: boolean;
  today: boolean;
  thisWeek: boolean;
  search: string;
}>;

export async function listTasks(query?: ListQuery): Promise<Task[]> {
  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, String(v));
    });
  }
  const res = await fetch(`${BASE_URL}/tasks?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to list tasks');
  const data = await res.json();
  return data.tasks as Task[];
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error('Failed to create task');
  const data = await res.json();
  return data.task as Task;
}

export async function updateTaskApi(id: string, updates: Partial<Task>): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  const data = await res.json();
  return data.task as Task;
}

export async function deleteTaskApi(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete task');
}

export type BulkOperation = 'delete' | 'complete' | 'star' | 'update' | 'clear-completed' | 'clear-overdue';

export async function bulkTasks(params: {
  operation: BulkOperation;
  criteria?: ListQuery;
  taskIds?: string[];
  update?: Partial<Task>;
}): Promise<{ affected: number }>{
  const res = await fetch(`${BASE_URL}/tasks/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to bulk operate');
  return res.json();
}

export async function analytics(): Promise<{ total: number; completed: number; overdue: number; highPriorityOpen: number }>{
  const res = await fetch(`${BASE_URL}/tasks/analytics`);
  if (!res.ok) throw new Error('Failed analytics');
  return res.json();
}
