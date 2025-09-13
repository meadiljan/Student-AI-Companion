"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import WeekCalendar from "./WeekCalendar"; // Import the new WeekCalendar

interface Event {
  date: Date;
  time: string;
  title: string;
  type: "Team Meetup" | "Illustration" | "Research" | "Presentation" | "Report";
  color: string;
}

const events: Event[] = [
  {
    date: new Date(2025, 1, 17), // February 17, 2025
    time: "9:30 - 10:30",
    title: "Team Meetup",
    type: "Team Meetup",
    color: "bg-red-500",
  },
  {
    date: new Date(2025, 1, 18), // February 18, 2025
    time: "11:30 - 12:30",
    title: "Illustration Project",
    type: "Illustration",
    color: "bg-blue-500",
  },
  {
    date: new Date(2025, 1, 19), // February 19, 2025
    time: "14:00 - 15:00",
    title: "Research Presentation",
    type: "Research",
    color: "bg-green-500",
  },
  {
    date: new Date(2025, 1, 20), // February 20, 2025
    time: "10:00 - 11:00",
    title: "Client Presentation",
    type: "Presentation",
    color: "bg-yellow-500",
  },
  {
    date: new Date(2025, 1, 21), // February 21, 2025
    time: "16:00 - 17:00",
    title: "Monthly Report",
    type: "Report",
    color: "bg-purple-500",
  },
];

const UpcomingEvents = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2025, 1, 19)); // Set initial date to Feb 19, 2025

  const filteredEvents = events.filter(event =>
    date && event.date.toDateString() === date.toDateString()
  );

  return (
    <Card className="rounded-xl shadow-sm bg-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-foreground">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <WeekCalendar selected={date} onSelect={setDate} events={events} />
        <ScrollArea className="flex-1 p-4">
          {filteredEvents.length > 0 ? (
            <div className="space-y-3">
              {filteredEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={cn("h-2 w-2 rounded-full", event.color)} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">No events for this day.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;