export type Priority = 'low' | 'medium' | 'high';
export type Status = 'completed' | 'in-progress' | 'pending' | 'overdue';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  priority: Priority;
  status: Status;
  course: string;
  tags: string[];
  completed: boolean;
  starred: boolean;
}
