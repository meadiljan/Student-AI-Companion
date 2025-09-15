"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link to={`/courses/${course.id}`} key={course.id} className="no-underline">
              <CourseCard {...course} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Courses;