"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTasks } from "@/contexts/TasksContext";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

const TasksList = () => {
  const { tasks, toggleCompleted } = useTasks();

  // Helper function to format due date from ISO string
  const formatDueDate = (dueDate: string, dueTime?: string) => {
    try {
      const date = parseISO(dueDate);
      
      if (isToday(date)) {
        return `Today${dueTime ? `, ${dueTime}` : ''}`;
      } else if (isTomorrow(date)) {
        return `Tomorrow${dueTime ? `, ${dueTime}` : ''}`;
      } else if (isPast(date)) {
        return `${format(date, 'MMM d')}${dueTime ? `, ${dueTime}` : ''} (Overdue)`;
      } else {
        return `${format(date, 'MMM d')}${dueTime ? `, ${dueTime}` : ''}`;
      }
    } catch {
      return dueDate; // fallback if parsing fails
    }
  };

  // Helper function to get display status
  const getDisplayStatus = (task: any) => {
    if (task.completed) return "Completed";
    
    try {
      const date = parseISO(task.dueDate);
      if (isPast(date) && !task.completed) return "Overdue";
    } catch {
      // fallback
    }
    
    switch (task.status) {
      case "in-progress": return "In Progress";
      case "pending": return "Upcoming";
      case "completed": return "Completed";
      case "overdue": return "Overdue";
      default: return "Upcoming";
    }
  };

  // Show only first 6 tasks
  const displayTasks = tasks.slice(0, 6);

  return (
    <Card className="rounded-3xl shadow-sm bg-card flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground">My Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 pb-4">
        <ScrollArea className="h-[280px] px-4">
          <div className="space-y-3">
            {displayTasks.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm mt-8">No tasks yet.</p>
            ) : (
              displayTasks.map((task) => {
                const displayStatus = getDisplayStatus(task);
                const formattedDueDate = formatDueDate(task.dueDate, task.dueTime);
                
                return (
                  <div key={task.id} className="flex items-start justify-between py-2">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleCompleted(task.id)}
                        className="rounded-sm mt-0.5 flex-shrink-0"
                      />
                      <div className="grid gap-1 leading-none flex-1 min-w-0">
                        <label
                          htmlFor={`task-${task.id}`}
                          className={cn(
                            "text-sm font-medium text-foreground cursor-pointer truncate",
                            task.completed && "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {formattedDueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <Badge
                        variant={
                          displayStatus === "Completed"
                            ? "default"
                            : displayStatus === "Overdue"
                            ? "destructive"
                            : displayStatus === "In Progress"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs px-2 py-1"
                      >
                        {displayStatus}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TasksList;