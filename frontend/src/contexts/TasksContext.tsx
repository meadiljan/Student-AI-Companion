"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { listTasks as listTasksApi, createTask as createTaskApi, updateTaskApi, deleteTaskApi } from "@/services/agentApi";
import { generateTaskDescription } from "@/services/aiDescriptionService";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  priority: "low" | "medium" | "high";
  status: "completed" | "in-progress" | "pending" | "overdue";
  course: string;
  tags: string[];
  completed: boolean;
  starred: boolean;
}

interface TasksContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id"> & { id?: string }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  toggleStarred: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Hydrate from backend - no more automatic seeding
  useEffect(() => {
    (async () => {
      try {
        const serverTasks = await listTasksApi();
        setTasks(serverTasks);
      } catch (e) {
        // If server is not available, start with empty tasks
        console.error("Failed to hydrate tasks from backend; starting with empty list", e);
        setTasks([]);
      }
    })();
  }, []);

  const addTask = async (taskData: Omit<Task, "id"> & { id?: string }) => {
    try {
      const { id: _ignore, ...payload } = taskData as any;
      
      // Auto-generate description if not provided or empty
      if (!payload.description || payload.description.trim() === '') {
        console.log('Generating AI description for task:', payload.title);
        payload.description = await generateTaskDescription(payload.title);
        console.log('Generated description:', payload.description);
      }
      
      const created = await createTaskApi(payload as Omit<Task, 'id'>);
      setTasks(prev => [...prev, created]);
    } catch (e) {
      console.error("Create task API failed", e);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updated = await updateTaskApi(id, updates);
      setTasks(prev => prev.map(task => task.id === id ? updated : task));
    } catch (e) {
      console.error("Update task API failed", e);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteTaskApi(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (e) {
      console.error("Delete task API failed", e);
    }
  };

  const toggleCompleted = async (id: string) => {
    try {
      const current = tasks.find(t => t.id === id);
      if (!current) return;
      const nextCompleted = !current.completed;
      const nextStatus: Task['status'] = nextCompleted ? 'completed' : 'pending';
      const updated = await updateTaskApi(id, { completed: nextCompleted, status: nextStatus });
      setTasks(prev => prev.map(task => task.id === id ? updated : task));
    } catch (e) {
      console.error("Toggle complete API failed", e);
    }
  };

  const toggleStarred = async (id: string) => {
    try {
      const current = tasks.find(t => t.id === id);
      if (!current) return;
      const updated = await updateTaskApi(id, { starred: !current.starred });
      setTasks(prev => prev.map(task => task.id === id ? updated : task));
    } catch (e) {
      console.error("Toggle star API failed", e);
    }
  };

  const refreshTasks = async () => {
    try {
      const serverTasks = await listTasksApi();
      setTasks(serverTasks);
    } catch (e) {
      console.error("Refresh tasks API failed", e);
    }
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleCompleted,
        toggleStarred,
        refreshTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within an TasksProvider");
  }
  return context;
};