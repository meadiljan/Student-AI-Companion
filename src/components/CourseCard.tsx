"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Course } from "@/contexts/CoursesContext";

interface CourseCardProps {
  course: Course;
  onAddLecture: (courseId: string) => void;
}

const colorVariants = {
  blue: "border-blue-500/50 hover:border-blue-500",
  green: "border-green-500/50 hover:border-green-500",
  purple: "border-purple-500/50 hover:border-purple-500",
  red: "border-red-500/50 hover:border-red-500",
  pink: "border-pink-500/50 hover:border-pink-500",
  yellow: "border-yellow-500/50 hover:border-yellow-500",
};

const CourseCard: React.FC<CourseCardProps> = ({ course, onAddLecture }) => {
  return (
    <Card
      className={cn(
        "bg-white/5 backdrop-blur-lg border rounded-3xl shadow-lg transition-all duration-300 flex flex-col",
        colorVariants[course.color]
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-foreground">{course.title}</CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xl"
          onClick={() => onAddLecture(course.id)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lecture
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 h-48">
          <div className="space-y-3 pr-4">
            {course.lectures.length > 0 ? (
              course.lectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                >
                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-foreground truncate">{lecture.title}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No lectures yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CourseCard;