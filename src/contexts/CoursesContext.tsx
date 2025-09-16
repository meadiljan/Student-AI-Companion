"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import * as Icons from "lucide-react";

export interface Lecture {
  id: number;
  title: string;
  duration: string;
  status: "completed" | "current" | "upcoming";
  pdfFile?: File;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  icon: keyof typeof Icons;
  color: string;
  lectures?: Lecture[];
}

interface CoursesContextType {
  courses: Course[];
  addCourse: (course: Course) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  getCourse: (courseId: string) => Course | undefined;
  addLectureToCourse: (courseId: string, lecture: Lecture) => void;
  updateLecture: (courseId: string, lectureId: number, updates: Partial<Lecture>) => void;
  deleteLecture: (courseId: string, lectureId: number) => void;
  completeLecture: (courseId: string, lectureId: number) => void;
  uncompleteLecture: (courseId: string, lectureId: number) => void;
  calculateCourseProgress: (courseId: string) => number;
}

// Initial courses data
const initialCoursesData: Course[] = [
  {
    id: "advanced-typography",
    title: "Advanced Typography",
    instructor: "Prof. Elara Vance",
    progress: 75,
    icon: "Type",
    color: "bg-blue-500",
    lectures: [
      { id: 1, title: "The History of Serif", duration: "45 min", status: "completed" },
      { id: 2, title: "Understanding Kerning and Tracking", duration: "55 min", status: "completed" },
      { id: 3, title: "Webfont Performance and Optimization", duration: "60 min", status: "current" },
      { id: 4, title: "The Magic of Variable Fonts", duration: "50 min", status: "upcoming" },
      { id: 5, title: "Final Project Briefing", duration: "30 min", status: "upcoming" },
    ],
  },
  {
    id: "ux-for-mobile",
    title: "UX for Mobile",
    instructor: "Dr. Arion Quinn",
    progress: 40,
    icon: "Smartphone",
    color: "bg-purple-500",
    lectures: [
      { id: 1, title: "Mobile-First Design Principles", duration: "50 min", status: "completed" },
      { id: 2, title: "Gesture-Based Navigation", duration: "45 min", status: "current" },
      { id: 3, title: "Accessibility on Small Screens", duration: "55 min", status: "upcoming" },
      { id: 4, title: "Prototyping with Figma", duration: "75 min", status: "upcoming" },
    ],
  },
  {
    id: "digital-illustration",
    title: "Digital Illustration",
    instructor: "Aria Beaumont",
    progress: 90,
    icon: "PenTool",
    color: "bg-pink-500",
    lectures: [
      { id: 1, title: "Introduction to Procreate", duration: "60 min", status: "completed" },
      { id: 2, title: "Mastering Layers and Masks", duration: "70 min", status: "completed" },
      { id: 3, title: "Color Theory in Digital Art", duration: "65 min", status: "completed" },
      { id: 4, title: "Advanced Brush Techniques", duration: "75 min", status: "current" },
      { id: 5, title: "Portfolio Project", duration: "120 min", status: "upcoming" },
    ],
  },
  {
    id: "web-development",
    title: "Web Development",
    instructor: "Prof. Leo Rivera",
    progress: 60,
    icon: "Code",
    color: "bg-green-500",
    lectures: [
      { id: 1, title: "HTML & CSS Fundamentals", duration: "90 min", status: "completed" },
      { id: 2, title: "JavaScript for Beginners", duration: "120 min", status: "completed" },
      { id: 3, title: "Introduction to React", duration: "120 min", status: "current" },
      { id: 4, title: "State Management with Redux", duration: "90 min", status: "upcoming" },
    ],
  },
  {
    id: "art-history",
    title: "Art History",
    instructor: "Dr. Helena Shaw",
    progress: 25,
    icon: "Landmark",
    color: "bg-orange-500",
    lectures: [
      { id: 1, title: "Renaissance Masters", duration: "75 min", status: "current" },
      { id: 2, title: "Impressionism and Post-Impressionism", duration: "75 min", status: "upcoming" },
      { id: 3, title: "Modern Art Movements", duration: "90 min", status: "upcoming" },
    ],
  },
  {
    id: "calculus-i",
    title: "Calculus I",
    instructor: "Prof. Kenji Tanaka",
    progress: 85,
    icon: "Sigma",
    color: "bg-red-500",
    lectures: [
      { id: 1, title: "Limits and Continuity", duration: "60 min", status: "completed" },
      { id: 2, title: "Derivatives", duration: "75 min", status: "completed" },
      { id: 3, title: "Integrals", duration: "75 min", status: "completed" },
      { id: 4, title: "Final Exam Review", duration: "120 min", status: "current" },
    ],
  },
];

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(initialCoursesData);

  const addCourse = (course: Course) => {
    setCourses(prev => [...prev, { ...course, lectures: course.lectures || [] }]);
  };

  const updateCourse = (courseId: string, updates: Partial<Course>) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === courseId ? { ...course, ...updates } : course
      )
    );
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  };

  const getCourse = (courseId: string): Course | undefined => {
    return courses.find(course => course.id === courseId);
  };

  const addLectureToCourse = (courseId: string, lecture: Lecture) => {
    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id === courseId) {
          const existingLectures = course.lectures || [];
          const newLecture = {
            ...lecture,
            // Set first lecture as current, others as upcoming
            status: existingLectures.length === 0 ? "current" as const : "upcoming" as const
          };
          const updatedLectures = [...existingLectures, newLecture];
          
          // Calculate progress immediately with the new lecture count
          const completedCount = updatedLectures.filter(l => l.status === "completed").length;
          const newProgress = updatedLectures.length > 0 ? Math.round((completedCount / updatedLectures.length) * 100) : 0;
          
          return { ...course, lectures: updatedLectures, progress: newProgress };
        }
        return course;
      });
      
      return updated;
    });
  };

  const updateLecture = (courseId: string, lectureId: number, updates: Partial<Lecture>) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? {
              ...course, 
              lectures: (course.lectures || []).map(lecture => 
                lecture.id === lectureId ? { ...lecture, ...updates } : lecture
              )
            }
          : course
      )
    );
  };

  const deleteLecture = (courseId: string, lectureId: number) => {
    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id === courseId) {
          const updatedLectures = (course.lectures || []).filter(lecture => lecture.id !== lectureId);
          
          // Calculate progress immediately with the new lecture count
          const completedCount = updatedLectures.filter(l => l.status === "completed").length;
          const newProgress = updatedLectures.length > 0 ? Math.round((completedCount / updatedLectures.length) * 100) : 0;
          
          return { ...course, lectures: updatedLectures, progress: newProgress };
        }
        return course;
      });
      
      return updated;
    });
  };

  const calculateCourseProgress = (courseId: string): number => {
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.lectures || course.lectures.length === 0) {
      return 0;
    }
    
    const completedLectures = course.lectures.filter(lecture => lecture.status === "completed").length;
    return Math.round((completedLectures / course.lectures.length) * 100);
  };

  const updateCourseProgress = (courseId: string) => {
    const progress = calculateCourseProgress(courseId);
    setCourses(prev => 
      prev.map(course => 
        course.id === courseId ? { ...course, progress } : course
      )
    );
  };

  const completeLecture = (courseId: string, lectureId: number) => {
    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id === courseId) {
          const lectures = course.lectures || [];
          
          // Find the current lecture's position in the array
          const currentLectureIndex = lectures.findIndex(l => l.id === lectureId);
          
          const updatedLectures = lectures.map((lecture, index) => {
            if (lecture.id === lectureId) {
              // Mark current lecture as completed
              return { ...lecture, status: "completed" as const };
            }
            
            // Make the next lecture in sequence available (current)
            if (index === currentLectureIndex + 1 && lecture.status === "upcoming") {
              return { ...lecture, status: "current" as const };
            }
            
            return lecture;
          });
          
          // Calculate progress immediately with the updated lectures
          const completedCount = updatedLectures.filter(l => l.status === "completed").length;
          const newProgress = updatedLectures.length > 0 ? Math.round((completedCount / updatedLectures.length) * 100) : 0;
          
          return { ...course, lectures: updatedLectures, progress: newProgress };
        }
        return course;
      });
      
      return updated;
    });
  };

  const uncompleteLecture = (courseId: string, lectureId: number) => {
    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id === courseId) {
          const lectures = course.lectures || [];
          
          // Find the current lecture's position in the array
          const currentLectureIndex = lectures.findIndex(l => l.id === lectureId);
          
          const updatedLectures = lectures.map((lecture, index) => {
            if (lecture.id === lectureId) {
              // Change completed lecture back to current
              return { ...lecture, status: "current" as const };
            }
            
            // Make subsequent lectures upcoming again if they were current
            if (index > currentLectureIndex && lecture.status === "current") {
              return { ...lecture, status: "upcoming" as const };
            }
            
            return lecture;
          });
          
          // Calculate progress immediately with the updated lectures
          const completedCount = updatedLectures.filter(l => l.status === "completed").length;
          const newProgress = updatedLectures.length > 0 ? Math.round((completedCount / updatedLectures.length) * 100) : 0;
          
          return { ...course, lectures: updatedLectures, progress: newProgress };
        }
        return course;
      });
      
      return updated;
    });
  };

  return (
    <CoursesContext.Provider value={{
      courses,
      addCourse,
      updateCourse,
      deleteCourse,
      getCourse,
      addLectureToCourse,
      updateLecture,
      deleteLecture,
      completeLecture,
      uncompleteLecture,
      calculateCourseProgress
    }}>
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CoursesContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};