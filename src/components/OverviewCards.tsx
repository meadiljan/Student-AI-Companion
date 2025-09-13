"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Award, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  progress?: number;
  colorClass: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  icon: Icon,
  progress,
  colorClass,
}) => (
  <Card className="rounded-xl shadow-sm flex-1 min-w-[180px] bg-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={cn("h-4 w-4", colorClass)} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {progress !== undefined && (
        <Progress value={progress} className={cn("h-2 mt-2", colorClass)} />
      )}
    </CardContent>
  </Card>
);

const OverviewCards = () => {
  const cardsData = [
    {
      title: "Course in Progress",
      value: 18,
      icon: BookOpen,
      progress: 70,
      colorClass: "text-orange-500",
    },
    {
      title: "Course Completed",
      value: 23,
      icon: CheckCircle,
      progress: 90,
      colorClass: "text-green-500",
    },
    {
      title: "Certificates Earned",
      value: 15,
      icon: Award,
      progress: 80,
      colorClass: "text-blue-500",
    },
    {
      title: "Community Support",
      value: 87,
      icon: Users,
      progress: 60,
      colorClass: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {cardsData.map((card, index) => (
        <OverviewCard key={index} {...card} />
      ))}
    </div>
  );
};

export default OverviewCards;