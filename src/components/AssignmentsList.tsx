"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  grade: string;
  status: "Completed" | "In Progress" | "Upcoming" | "Overdue";
}

const assignments: Assignment[] = [
  {
    id: "1",
    title: "Typography test",
    dueDate: "Today, 10:30 AM",
    grade: "190/200",
    status: "Completed",
  },
  {
    id: "2",
    title: "Inclusive design test",
    dueDate: "Tomorrow, 10:30 AM",
    grade: "Final grade",
    status: "In Progress",
  },
  {
    id: "3",
    title: "Drawing test",
    dueDate: "23.11, 10:30 PM",
    grade: "-/200",
    status: "Upcoming",
  },
  {
    id: "4",
    title: "History Essay",
    dueDate: "Yesterday, 5:00 PM",
    grade: "N/A",
    status: "Overdue",
  },
  {
    id: "5",
    title: "Math Homework",
    dueDate: "Next Monday, 9:00 AM",
    grade: "N/A",
    status: "Upcoming",
  },
  {
    id: "6",
    title: "Science Project",
    dueDate: "This Friday, 3:00 PM",
    grade: "N/A",
    status: "In Progress",
  },
];

const AssignmentsList = () => {
  return (
    <Card className="rounded-xl shadow-sm bg-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-foreground">My Assignments</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[250px] p-4">
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`assignment-${assignment.id}`}
                    checked={assignment.status === "Completed"}
                    className="rounded-sm"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`assignment-${assignment.id}`}
                      className={cn(
                        "text-sm font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        assignment.status === "Completed" && "line-through text-muted-foreground",
                      )}
                    >
                      {assignment.title}
                    </label>
                    <p className="text-xs text-muted-foreground">{assignment.dueDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{assignment.grade}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      assignment.status === "Completed" && "bg-green-100 text-green-700 border-green-200",
                      assignment.status === "In Progress" && "bg-blue-100 text-blue-700 border-blue-200",
                      assignment.status === "Upcoming" && "bg-gray-100 text-gray-700 border-gray-200",
                      assignment.status === "Overdue" && "bg-red-100 text-red-700 border-red-200",
                    )}
                  >
                    {assignment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AssignmentsList;