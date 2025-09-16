"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, X } from "lucide-react";
import * as Icons from "lucide-react";

type Course = {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  icon: keyof typeof Icons;
  color: string;
};

const initialCoursesData: Course[] = [
  {
    id: "advanced-typography",
    title: "Advanced Typography",
    instructor: "Prof. Elara Vance",
    progress: 75,
    icon: "Type",
    color: "bg-blue-500",
  },
  {
    id: "ux-for-mobile",
    title: "UX for Mobile",
    instructor: "Dr. Arion Quinn",
    progress: 40,
    icon: "Smartphone",
    color: "bg-purple-500",
  },
  {
    id: "digital-illustration",
    title: "Digital Illustration",
    instructor: "Aria Beaumont",
    progress: 90,
    icon: "PenTool",
    color: "bg-pink-500",
  },
  {
    id: "web-development",
    title: "Web Development",
    instructor: "Prof. Leo Rivera",
    progress: 60,
    icon: "Code",
    color: "bg-green-500",
  },
  {
    id: "art-history",
    title: "Art History",
    instructor: "Dr. Helena Shaw",
    progress: 25,
    icon: "Landmark",
    color: "bg-orange-500",
  },
  {
    id: "calculus-i",
    title: "Calculus I",
    instructor: "Prof. Kenji Tanaka",
    progress: 85,
    icon: "Sigma",
    color: "bg-red-500",
  },
];

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>(initialCoursesData);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    instructor: "",
    icon: "Book" as keyof typeof Icons,
    color: "bg-blue-500"
  });

  const addNewCourse = () => {
    if (!newCourse.title.trim() || !newCourse.instructor.trim()) return;

    const course: Course = {
      id: newCourse.title.toLowerCase().replace(/\s+/g, '-'),
      title: newCourse.title,
      instructor: newCourse.instructor,
      progress: 0,
      icon: newCourse.icon,
      color: newCourse.color
    };

    setCourses(prev => [...prev, course]);
    setNewCourse({ title: "", instructor: "", icon: "Book", color: "bg-blue-500" });
    setShowNewCourseModal(false);
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  };

  const iconOptions: (keyof typeof Icons)[] = [
    "Book", "Code", "PenTool", "Smartphone", "Type", "Landmark", 
    "Sigma", "Calculator", "Palette", "Music", "Camera", "Globe"
  ];

  const colorOptions = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", 
    "bg-orange-500", "bg-red-500", "bg-yellow-500", "bg-indigo-500"
  ];

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
            <Button
              onClick={() => setShowNewCourseModal(true)}
              className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link to={`/courses/${course.id}`} key={course.id} className="no-underline">
              <CourseCard {...course} onDelete={deleteCourse} />
            </Link>
          ))}
        </div>
      </div>

      {/* Add Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Create New Course</h2>
              <button
                onClick={() => setShowNewCourseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Course Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Course Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder="Enter course title"
                />
              </div>
              
              {/* Instructor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instructor</label>
                <input
                  type="text"
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, instructor: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder="Enter instructor name"
                />
              </div>
              
              {/* Icon Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Course Icon</label>
                <div className="grid grid-cols-6 gap-3">
                  {iconOptions.map((iconName) => {
                    const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
                    return (
                      <button
                        key={iconName}
                        onClick={() => setNewCourse(prev => ({ ...prev, icon: iconName }))}
                        className={`p-3 rounded-2xl border-2 transition-all hover:bg-gray-50 ${
                          newCourse.icon === iconName 
                            ? 'border-black bg-black text-white' 
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Color Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Course Color</label>
                <div className="flex gap-3 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCourse(prev => ({ ...prev, color }))}
                      className={`w-10 h-10 rounded-full ${color} ${
                        newCourse.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewCourseModal(false)}
                  className="rounded-2xl px-6 py-3 h-12 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addNewCourse}
                  disabled={!newCourse.title.trim() || !newCourse.instructor.trim()}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-2xl px-6 py-3 h-12 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;