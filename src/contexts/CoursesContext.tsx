"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

export interface Lecture {
  id: string;
  title: string;
  fileType: "pdf" | "video" | "doc";
}

export interface Course {
  id: string;
  title: string;
  color: "blue" | "green" | "purple" | "red" | "pink" | "yellow";
  lectures: Lecture[];
}

interface CoursesContextType {
  courses: Course[];
  addCourse: (course: Omit<Course, "id" | "lectures">) => void;
  addLectureToCourse: (courseId: string, lecture: Omit<Lecture, "id">) => void;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

const initialCourses: Course[] = [
  {
    id: "1",
    title: "Typography & Design",
    color: "blue",
    lectures: [
      { id: uuidv4(), title: "Introduction to Serif Fonts.pdf", fileType: "pdf" },
      { id: uuidv4(), title: "The Psychology of Color.pdf", fileType: "pdf" },
    ],
  },
  {
    id: "2",
    title: "Inclusive Design",
    color: "green",
    lectures: [
      { id: uuidv4(), title: "Accessibility Guidelines.pdf", fileType: "pdf" },
    ],
  },
  {
    id: "3",
    title: "Digital Illustration",
    color: "purple",
    lectures: [
      { id: uuidv4(), title: "Vector Art Basics.pdf", fileType: "pdf" },
      { id: uuidv4(), title: "Portfolio Creation Guide.pdf", fileType: "pdf" },
    ],
  },
];

export const CoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const addCourse = (courseData: Omit<Course, "id" | "lectures">) => {
    const newCourse: Course = {
      ...courseData,
      id: uuidv4(),
      lectures: [],
    };
    setCourses(prev => [...prev, newCourse]);
  };

  const addLectureToCourse = (courseId: string, lectureData: Omit<Lecture, "id">) => {
    const newLecture: Lecture = {
      ...lectureData,
      id: uuidv4(),
    };
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId
          ? { ...course, lectures: [...course.lectures, newLecture] }
          : course
      )
    );
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        addCourse,
        addLectureToCourse,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CoursesContext);
  if (context === undefined) {
    throw new Error("useCourses must be used within a CoursesProvider");
  }
  return context;
};