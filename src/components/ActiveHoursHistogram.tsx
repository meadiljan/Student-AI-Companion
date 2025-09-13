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
      <CardContent className="flex flex-col p-4 pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 0,
                left: 10,
                bottom: 0,
              }}
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                domain={[0, 8]}
                tickFormatter={(value) => `${value}h`}
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
                width={40}
                ticks={[0, 2, 4, 6, 8]}
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
                radius={[8, 8, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveHoursHistogram;