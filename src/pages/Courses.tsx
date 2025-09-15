"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCourses, Course } from "@/contexts/CoursesContext";
import CourseCard from "@/components/CourseCard";
import { cn } from "@/lib/utils";

const colorOptions: { value: Course["color"]; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "red", label: "Red" },
  { value: "pink", label: "Pink" },
  { value: "yellow", label: "Yellow" },
];

const Courses = () => {
  const { courses, addCourse, addLectureToCourse } = useCourses();
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);

  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseColor, setNewCourseColor] = useState<Course["color"]>("blue");
  const [newLectureTitle, setNewLectureTitle] = useState("");

  const handleOpenAddLecture = (courseId: string) => {
    setCurrentCourseId(courseId);
    setShowAddLectureModal(true);
  };

  const handleAddCourse = () => {
    if (newCourseTitle.trim()) {
      addCourse({ title: newCourseTitle, color: newCourseColor });
      setNewCourseTitle("");
      setNewCourseColor("blue");
      setShowAddCourseModal(false);
    }
  };

  const handleAddLecture = () => {
    if (newLectureTitle.trim() && currentCourseId) {
      addLectureToCourse(currentCourseId, {
        title: newLectureTitle.endsWith(".pdf") ? newLectureTitle : `${newLectureTitle}.pdf`,
        fileType: "pdf",
      });
      setNewLectureTitle("");
      setCurrentCourseId(null);
      setShowAddLectureModal(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-foreground">Courses</h1>
        <Button
          onClick={() => setShowAddCourseModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-12 px-6 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Course
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} onAddLecture={handleOpenAddLecture} />
        ))}
      </div>

      {/* Add Course Modal */}
      <Dialog open={showAddCourseModal} onOpenChange={setShowAddCourseModal}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Add a New Course</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Course Title (e.g., Digital Illustration)"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
            />
            <Select onValueChange={(value: Course["color"]) => setNewCourseColor(value)} defaultValue={newCourseColor}>
              <SelectTrigger>
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", `bg-${option.value}-500`)} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddCourseModal(false)}>Cancel</Button>
            <Button onClick={handleAddCourse}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lecture Modal */}
      <Dialog open={showAddLectureModal} onOpenChange={setShowAddLectureModal}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Add a New Lecture</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Lecture Title (e.g., Introduction.pdf)"
              value={newLectureTitle}
              onChange={(e) => setNewLectureTitle(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddLectureModal(false)}>Cancel</Button>
            <Button onClick={handleAddLecture}>Add Lecture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;