"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", score: 4000 },
  { name: "Feb", score: 3000 },
  { name: "Mar", score: 2000 },
  { name: "Apr", score: 2780 },
  { name: "May", score: 1890 },
  { name: "Jun", score: 2390 },
  { name: "Jul", score: 3490 },
];

const PerformanceOverview = () => {
  return (
    <Card className="rounded-xl shadow-sm bg-card h-full">
      <CardHeader>
        <CardTitle className="text-foreground">Performance Overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] p-0 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
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
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceOverview;