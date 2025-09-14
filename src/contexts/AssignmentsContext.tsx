"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Assignment {
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

interface AssignmentsContextType {
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, "id">) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  toggleCompleted: (id: string) => void;
  toggleStarred: (id: string) => void;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

const initialAssignments: Assignment[] = [
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

export const AssignmentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);

  const addAssignment = (assignmentData: Omit<Assignment, "id">) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: Date.now().toString(),
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id ? { ...assignment, ...updates } : assignment
      )
    );
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
  };

  const toggleCompleted = (id: string) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id
          ? {
              ...assignment,
              completed: !assignment.completed,
              status: !assignment.completed ? "completed" : "pending"
            }
          : assignment
      )
    );
  };

  const toggleStarred = (id: string) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id
          ? { ...assignment, starred: !assignment.starred }
          : assignment
      )
    );
  };

  return (
    <AssignmentsContext.Provider
      value={{
        assignments,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        toggleCompleted,
        toggleStarred,
      }}
    >
      {children}
    </AssignmentsContext.Provider>
  );
};

export const useAssignments = () => {
  const context = useContext(AssignmentsContext);
  if (context === undefined) {
    throw new Error("useAssignments must be used within an AssignmentsProvider");
  }
  return context;
};