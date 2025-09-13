"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
      "rounded-xl shadow-sm flex-1 min-w-[180px]",
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
        {changePercentage} from last month
      </p>
    </CardContent>
  </Card>
);

const OverviewCards = () => {
  const [activeFilter, setActiveFilter] = useState("Month");
  const startDate = new Date(2024, 8, 1); // September 1, 2024
  const endDate = new Date(2024, 8, 30); // September 30, 2024

  const cardsData: OverviewCardProps[] = [ // Explicitly type the array
    {
      title: "Total Revenue",
      value: "$23,902",
      changePercentage: "4.2%",
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
      title: "Total Mentors",
      value: "2,023",
      changePercentage: "0.9%",
      changeDirection: "up",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-end space-x-2 mb-4">
        <div className="flex space-x-1 rounded-full bg-muted p-1">
          {["Day", "Week", "Month", "Year"].map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full text-sm">
          <Calendar className="h-4 w-4" />
          <span>
            {format(startDate, "d MMM yyyy")} - {format(endDate, "d MMM yyyy")}
          </span>
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