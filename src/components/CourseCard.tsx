"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2 } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  icon: keyof typeof Icons;
  color: string;
  onDelete?: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, instructor, progress, icon, color, onDelete }) => {
  const IconComponent = Icons[icon] as React.ElementType;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-xl text-white", color)}>
            {IconComponent && <IconComponent className="h-6 w-6" />}
          </div>
          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Delete Course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{instructor}</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className="text-xs font-bold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Button variant="default" className={cn(
          "w-full mt-6 rounded-xl text-primary-foreground transition-all",
          progress === 100 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-primary hover:bg-primary/90"
        )}>
          {progress === 100 ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Course Completed
            </>
          ) : (
            "Continue Learning"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CourseCard;