"use client";

import React, { useState } from "react";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Search, Plus, type LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

type Course = {
  title: string;
  instructor: string;
  progress: number;
  icon: keyof typeof Icons;
  color: string;
};

const initialCoursesData: Course[] = [
  {
    title: "Advanced Typography",
    instructor: "Prof. Elara Vance",
    progress: 75,
    icon: "Type",
    color: "bg-blue-500",
  },
  {
    title: "UX for Mobile",
    instructor: "Dr. Arion Quinn",
    progress: 40,
    icon: "Smartphone",
    color: "bg-purple-500",
  },
  {
    title: "Digital Illustration",
    instructor: "Aria Beaumont",
    progress: 90,
    icon: "PenTool",
    color: "bg-pink-500",
  },
  {
    title: "Web Development",
    instructor: "Prof. Leo Rivera",
    progress: 60,
    icon: "Code",
    color: "bg-green-500",
  },
  {
    title: "Art History",
    instructor: "Dr. Helena Shaw",
    progress: 25,
    icon: "Landmark",
    color: "bg-orange-500",
  },
  {
    title: "Calculus I",
    instructor: "Prof. Kenji Tanaka",
    progress: 85,
    icon: "Sigma",
    color: "bg-red-500",
  },
];

const iconOptions: (keyof typeof Icons)[] = ["Type", "Smartphone", "PenTool", "Code", "Landmark", "Sigma", "BookOpen", "Target"];
const colorOptions = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-green-500", "bg-orange-500", "bg-red-500", "bg-indigo-500", "bg-teal-500"];

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>(initialCoursesData);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    instructor: "",
    icon: iconOptions[0],
    color: colorOptions[0],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCourse(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCourse = () => {
    if (!newCourse.title || !newCourse.instructor) return;

    const courseToAdd: Course = {
      ...newCourse,
      progress: 0,
    };

    setCourses(prev => [...prev, courseToAdd]);
    setNewCourse({ title: "", instructor: "", icon: iconOptions[0], color: colorOptions[0] });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground mt-2">
              Continue your learning journey.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search courses..."
                className="pl-10 rounded-2xl border-0 bg-muted focus:ring-2 focus:ring-black"
              />
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-11 px-5">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground">Create a New Course</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="title" className="text-sm font-medium text-gray-700">Course Title</label>
                    <Input id="title" name="title" value={newCourse.title} onChange={handleInputChange} className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent h-12" placeholder="e.g., Advanced Typography" />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="instructor" className="text-sm font-medium text-gray-700">Instructor Name</label>
                    <Input id="instructor" name="instructor" value={newCourse.instructor} onChange={handleInputChange} className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent h-12" placeholder="e.g., Prof. Elara Vance" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Icon</label>
                    <div className="flex flex-wrap gap-3">
                      {iconOptions.map(iconName => {
                        const IconComponent = Icons[iconName] as React.ElementType;
                        return (
                          <button
                            key={iconName}
                            onClick={() => setNewCourse(prev => ({ ...prev, icon: iconName }))}
                            className={cn(
                              "h-10 w-10 flex items-center justify-center rounded-xl border transition-all",
                              newCourse.icon === iconName ? "ring-2 ring-primary ring-offset-2" : "text-muted-foreground"
                            )}
                          >
                            <IconComponent className="h-5 w-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Color</label>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewCourse(prev => ({ ...prev, color }))}
                          className={cn(
                            "h-10 w-10 rounded-xl",
                            color,
                            newCourse.color === color && "ring-2 ring-primary ring-offset-2"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" className="rounded-2xl px-6 py-3 h-12 text-gray-600 hover:bg-gray-100">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" onClick={handleCreateCourse} className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6 py-3 h-12 font-medium">
                     <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <CourseCard key={index} {...course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Courses;