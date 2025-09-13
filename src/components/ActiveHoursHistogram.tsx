"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const data = [
  { day: "S", hoursSpent: 1.8 },
  { day: "M", hoursSpent: 4.5 },
  { day: "T", hoursSpent: 3.0 },
  { day: "W", hoursSpent: 4.2 },
  { day: "T", hoursSpent: 7.0 },
  { day: "F", hoursSpent: 3.5 },
  { day: "S", hoursSpent: 3.2 },
];

const ActiveHoursHistogram = () => {
  return (
    <Card className="rounded-xl shadow-sm bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-foreground text-lg font-semibold">Actively Hours</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full text-sm"
            >
              Weekly
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            <DropdownMenuItem>Daily</DropdownMenuItem>
            <DropdownMenuItem>Weekly</DropdownMenuItem>
            <DropdownMenuItem>Monthly</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-between p-4 pt-0">
        <div className="h-[200px] w-full md:w-2/3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 0,
                left: -20,
                bottom: 0,
              }}
              barCategoryGap="20%" // Adjust gap between bars
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                domain={[0, 10]} // Set domain up to 10 hours
                tickFormatter={(value) => `${value}h`}
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
                width={30}
                ticks={[0, 2, 4, 6, 8, 10]} // Explicitly set ticks for 0h, 2h, 4h, 6h, 8h, 10h
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value}h`, "Hours Spent"]}
              />
              <Bar
                dataKey="hoursSpent"
                fill="hsl(var(--primary))"
                radius={[8, 8, 4, 4]} // Rounded corners for top and slight rounding for bottom
                barSize={24} // Make bars thicker
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-4 mt-6 md:mt-0 md:w-1/3 md:pl-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Time spent</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">28</span>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                85%
              </Badge>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Lessons taken</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">60</span>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                79%
              </Badge>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Exam passed</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">10</span>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                100%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveHoursHistogram;