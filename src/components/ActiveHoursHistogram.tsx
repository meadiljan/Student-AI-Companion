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
  { hour: "8 AM", sessions: 30 },
  { hour: "9 AM", sessions: 50 },
  { hour: "10 AM", sessions: 75 },
  { hour: "11 AM", sessions: 90 },
  { hour: "12 PM", sessions: 80 },
  { hour: "1 PM", sessions: 65 },
  { hour: "2 PM", sessions: 70 },
  { hour: "3 PM", sessions: 85 },
  { hour: "4 PM", sessions: 60 },
  { hour: "5 PM", sessions: 40 },
];

const ActiveHoursHistogram = () => {
  return (
    <Card className="rounded-xl shadow-sm bg-card h-full">
      <CardHeader>
        <CardTitle className="text-foreground">Active Hours</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] p-0 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar
              dataKey="sessions"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]} // Top-left, Top-right, Bottom-right, Bottom-left
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ActiveHoursHistogram;