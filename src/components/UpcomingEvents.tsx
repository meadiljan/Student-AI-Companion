"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import WeekCalendar from "./WeekCalendar";
import WeeklyEventTimeline from "./WeeklyEventTimeline"; // Import the new component
import { startOfWeek, setHours, setMinutes, startOfDay, addDays } from "date-fns";

interface Event {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  title: string;
  type: string;
  color: string;
}

// Helper to create a Date object with specific time for a given date
const createDateTime = (baseDate: Date, hour: number, minute: number) => {
  return setMinutes(setHours(startOfDay(baseDate), hour), minute);
};

const allEvents: Event[] = [
  {
    id: "1",
    date: new Date(2025, 1, 17), // Monday, Feb 17
    startTime: createDateTime(new Date(2025, 1, 17), 9, 30),
    endTime: createDateTime(new Date(2025, 1, 17), 10, 30),
    title: "Team Meetup",
    type: "Team Meetup",
    color: "bg-orange-500", // Matching image
  },
  {
    id: "2",
    date: new Date(2025, 1, 18), // Tuesday, Feb 18
    startTime: createDateTime(new Date(2025, 1, 18), 11, 30),
    endTime: createDateTime(new Date(2025, 1, 18), 12, 30),
    title: "Illustration",
    type: "Illustration",
    color: "bg-gray-900", // Matching image (black)
  },
  {
    id: "3",
    date: new Date(2025, 1, 19), // Wednesday, Feb 19
    startTime: createDateTime(new Date(2025, 1, 19), 10, 0),
    endTime: createDateTime(new Date(2025, 1, 19), 11, 0),
    title: "Research",
    type: "Research",
    color: "bg-blue-600", // Matching image
  },
  {
    id: "4",
    date: new Date(2025, 1, 20), // Thursday, Feb 20
    startTime: createDateTime(new Date(2025, 1, 20), 13, 0),
    endTime: createDateTime(new Date(2025, 1, 20), 14, 0),
    title: "Presentation",
    type: "Presentation",
    color: "bg-orange-500", // Matching image
  },
  {
    id: "5",
    date: new Date(2025, 1, 22), // Saturday, Feb 22
    startTime: createDateTime(new Date(2025, 1, 22), 15, 0),
    endTime: createDateTime(new Date(2025, 1, 22), 16, 0),
    title: "Report",
    type: "Report",
    color: "bg-green-500", // Matching image
  },
];

const UpcomingEvents = () => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date(2025, 1, 19)); // Initial date for the calendar

  // Calculate the start of the week for the selected date (Monday)
  const currentWeekStart = selectedDate
    ? startOfWeek(selectedDate, { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  // Filter events to only show those within the current week displayed by the calendar
  const eventsForCurrentWeek = React.useMemo(() => {
    const weekEnd = addDays(currentWeekStart, 6); // Sunday of the current week
    return allEvents.filter(event =>
      event.date >= currentWeekStart && event.date <= weekEnd
    );
  }, [currentWeekStart]);


  return (
    <Card className="rounded-xl shadow-sm bg-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-foreground">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <WeekCalendar selected={selectedDate} onSelect={setSelectedDate} events={allEvents} />
        <ScrollArea className="flex-1">
          <WeeklyEventTimeline events={eventsForCurrentWeek} weekStart={currentWeekStart} />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;