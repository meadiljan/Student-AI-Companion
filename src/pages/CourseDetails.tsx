"use client";

import React from "react";
import { useParams, Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, PlayCircle, Lock, Clapperboard } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for all courses, including lectures
const coursesData = [
  {
    id: "advanced-typography",
    title: "Advanced Typography",
    instructor: "Prof. Elara Vance",
    progress: 75,
    icon: "Type" as keyof typeof Icons,
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
    icon: "Smartphone" as keyof typeof Icons,
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
    icon: "PenTool" as keyof typeof Icons,
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
    icon: "Code" as keyof typeof Icons,
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
    icon: "Landmark" as keyof typeof Icons,
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
    icon: "Sigma" as keyof typeof Icons,
    color: "bg-red-500",
    lectures: [
        { id: 1, title: "Limits and Continuity", duration: "60 min", status: "completed" },
        { id: 2, title: "Derivatives", duration: "75 min", status: "completed" },
        { id: 3, title: "Integrals", duration: "75 min", status: "completed" },
        { id: 4, title: "Final Exam Review", duration: "120 min", status: "current" },
    ],
  },
];

const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = coursesData.find(c => c.id === courseId);

  if (!course) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Course Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The course you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-6 rounded-2xl">
          <Link to="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />;
      case "current":
        return <PlayCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />;
      case "upcoming":
        return <Lock className="h-6 w-6 text-gray-400 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const IconComponent = Icons[course.icon] as React.ElementType;

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link to="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground mt-2 text-lg">{course.instructor}</p>
          </div>
          <div className={cn("p-4 rounded-2xl text-white", course.color)}>
            {IconComponent && <IconComponent className="h-8 w-8" />}
          </div>
        </div>
      </div>

      <Card className="mb-6 rounded-3xl border-0 bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Course Progress</h3>
            <span className="text-lg font-bold text-foreground">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-3" />
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-foreground mb-4">Lectures</h2>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-3">
          {course.lectures.map((lecture, index) => (
            <Card
              key={lecture.id}
              className={cn(
                "rounded-2xl border-0 transition-all",
                lecture.status === "current" ? "bg-primary/5" : "bg-muted/50",
                lecture.status === "completed" && "opacity-60"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {getStatusIcon(lecture.status)}
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {index + 1}. {lecture.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{lecture.duration}</p>
                </div>
                {lecture.status === "current" && (
                  <Button className="rounded-xl">Start Lecture</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;