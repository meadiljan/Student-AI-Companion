"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  title: string;
  value: string;
  changePercentage: string;
  changeDirection: "up" | "down";
  isDark?: boolean;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  changePercentage,
  changeDirection,
  isDark = false,
}) => (
  <Card
    className={cn(
      "rounded-3xl shadow-sm flex-1 min-w-[180px]",
      isDark ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
    )}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle
        className={cn(
          "text-sm font-medium",
          isDark ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p
        className={cn(
          "text-xs mt-1 flex items-center",
          changeDirection === "up" ? "text-green-500" : "text-red-500",
          isDark && changeDirection === "up" && "text-green-300",
          isDark && changeDirection === "down" && "text-red-300",
        )}
      >
        {changeDirection === "up" ? (
          <ArrowUp className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDown className="h-3 w-3 mr-1" />
        )}
        {changePercentage} from last semester
      </p>
    </CardContent>
  </Card>
);

const OverviewCards = () => {
  const cardsData: OverviewCardProps[] = [ // Explicitly type the array
    {
      title: "Active Hours",
      value: "39.5h",
      changePercentage: "12.4%",
      changeDirection: "up",
      isDark: true,
    },
    {
      title: "Active Users",
      value: "16,815",
      changePercentage: "1.7%",
      changeDirection: "up",
    },
    {
      title: "New Users",
      value: "1,457",
      changePercentage: "2.9%",
      changeDirection: "down",
    },
    {
      title: "CGPA",
      value: "3.85",
      changePercentage: "0.12",
      changeDirection: "up",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Button 
          variant="default" 
          size="sm" 
          className="h-9 gap-2 rounded-2xl text-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Setup Account
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardsData.map((card, index) => (
          <OverviewCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

export default OverviewCards;