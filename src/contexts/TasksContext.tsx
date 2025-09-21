"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

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
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleCompleted: (id: string) => void;
  toggleStarred: (id: string) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Typography Research Paper",
    description: "Complete research on modern typography trends and their impact on digital design",
    dueDate: "2025-09-15",
    dueTime: "10:30 AM",
    priority: "high",
    status: "in-progress",
    course: "Design",
    tags: ["research", "typography", "design"],
    completed: false,
    starred: true,
  },
  {
    id: "2",
    title: "Inclusive Design Case Study",
    description: "Analyze accessibility features in popular applications",
    dueDate: "2025-09-16",
    dueTime: "2:00 PM",
    priority: "medium",
    status: "pending",
    course: "UX Design",
    tags: ["accessibility", "case-study"],
    completed: false,
    starred: false,
  },
  {
    id: "3",
    title: "Drawing Portfolio",
    description: "Complete 10 digital illustrations for portfolio submission",
    dueDate: "2025-09-23",
    dueTime: "11:59 PM",
    priority: "high",
    status: "pending",
    course: "Digital Art",
    tags: ["portfolio", "illustration"],
    completed: false,
    starred: false,
  },
  {
    id: "4",
    title: "History Essay",
    description: "Write essay on Renaissance art influence",
    dueDate: "2025-09-13",
    dueTime: "5:00 PM",
    priority: "medium",
    status: "overdue",
    course: "Art History",
    tags: ["essay", "history"],
    completed: false,
    starred: false,
  },
  {
    id: "5",
    title: "Math Problem Set",
    description: "Complete calculus problems 1-20",
    dueDate: "2025-09-20",
    dueTime: "9:00 AM",
    priority: "low",
    status: "pending",
    course: "Mathematics",
    tags: ["math", "calculus"],
    completed: true,
    starred: false,
  },
];

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const toggleCompleted = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              status: !task.completed ? "completed" : "pending"
            }
          : task
      )
    );
  };

  const toggleStarred = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, starred: !task.starred }
          : task
      )
    );
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