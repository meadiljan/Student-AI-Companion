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

const data = [
  { day: "Sun", hoursSpent: 2.8 },
  { day: "Mon", hoursSpent: 6.5 },
  { day: "Tue", hoursSpent: 4.8 },
  { day: "Wed", hoursSpent: 7.2 },
  { day: "Thu", hoursSpent: 8.5 },
  { day: "Fri", hoursSpent: 5.5 },
  { day: "Sat", hoursSpent: 4.2 },
];

const ActiveHoursHistogram = () => {
  return (
    <Card className="rounded-3xl shadow-sm bg-card flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-foreground text-lg font-semibold">Active Hours</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col p-4 pt-0 pb-4">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 15,
                left: 15,
                bottom: 15,
              }}
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground font-medium"
                tick={{ fontSize: 14 }}
              />
              <YAxis
                domain={[0, 10]}
                tickFormatter={(value) => `${value}h`}
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
                width={50}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "1rem",
                  fontSize: "14px",
                  padding: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontSize: "14px", fontWeight: "600" }}
                itemStyle={{ color: "hsl(var(--foreground))", fontSize: "14px" }}
                formatter={(value: number) => [`${value}h`, "Hours Spent"]}
              />
              <Bar
                dataKey="hoursSpent"
                fill="hsl(var(--primary))"
                radius={[12, 12, 12, 12]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveHoursHistogram;