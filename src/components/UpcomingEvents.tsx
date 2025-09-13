"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"; // Keeping ScrollArea for potential future vertical scroll if needed, but using a div for horizontal
import { cn } from "@/lib/utils";
import WeekCalendar from "./WeekCalendar";
import { format, setHours, setMinutes, isToday, differenceInMinutes, addMinutes, isSameDay } from "date-fns";

interface Event {
  id: string;
  start: Date;
  end: Date;
  title: string;
  type: "Team Meetup" | "Illustration" | "Research" | "Presentation" | "Report";
  color: string;
}

const events: Event[] = [
  {
    id: "1",
    start: new Date(2025, 1, 17, 9, 30), // Feb 17, 2025, 9:30 AM
    end: new Date(2025, 1, 17, 10, 30), // Feb 17, 2025, 10:30 AM
    title: "Team Meetup",
    type: "Team Meetup",
    color: "bg-red-500",
  },
  {
    id: "2",
    start: new Date(2025, 1, 18, 11, 30), // Feb 18, 2025, 11:30 AM
    end: new Date(2025, 1, 18, 12, 30), // Feb 18, 2025, 12:30 PM
    title: "Illustration Project",
    type: "Illustration",
    color: "bg-blue-500",
  },
  {
    id: "3",
    start: new Date(2025, 1, 19, 14, 0), // Feb 19, 2025, 2:00 PM
    end: new Date(2025, 1, 19, 15, 0), // Feb 19, 2025, 3:00 PM
    title: "Research Presentation",
    type: "Research",
    color: "bg-green-500",
  },
  {
    id: "4",
    start: new Date(2025, 1, 20, 10, 0), // Feb 20, 2025, 10:00 AM
    end: new Date(2025, 1, 20, 11, 0), // Feb 20, 2025, 11:00 AM
    title: "Client Presentation",
    type: "Presentation",
    color: "bg-yellow-500",
  },
  {
    id: "5",
    start: new Date(2025, 1, 21, 16, 0), // Feb 21, 2025, 4:00 PM
    end: new Date(2025, 1, 21, 17, 0), // Feb 21, 2025, 5:00 PM
    title: "Monthly Report",
    type: "Report",
    color: "bg-purple-500",
  },
  {
    id: "6",
    start: new Date(2025, 1, 19, 9, 0), // Feb 19, 2025, 9:00 AM
    end: new Date(2025, 1, 19, 10, 0), // Feb 19, 2025, 10:00 AM
    title: "Morning Study Session",
    type: "Research",
    color: "bg-indigo-500",
  },
  {
    id: "7",
    start: new Date(2025, 1, 19, 10, 0), // Feb 19, 2025, 10:00 AM
    end: new Date(2025, 1, 19, 10, 45), // Feb 19, 2025, 10:45 AM
    title: "Quick Break",
    type: "Team Meetup",
    color: "bg-gray-400",
  },
];

const timelineStartHour = 7; // 7 AM
const timelineEndHour = 22; // 10 PM (exclusive, so up to 21:59)
const totalTimelineHours = timelineEndHour - timelineStartHour;
const hourWidthPx = 120; // Width of each hour slot in pixels (e.g., 120px per hour)
const eventRowHeightPx = 100; // Fixed height for the row where events are displayed

const generateTimeSlots = () => {
  const slots = [];
  for (let i = timelineStartHour; i < timelineEndHour; i++) {
    slots.push(setMinutes(setHours(new Date(), i), 0));
  }
  return slots;
};

const UpcomingEvents = () => {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 1, 19));
  const [currentTimeIndicatorLeft, setCurrentTimeIndicatorLeft] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null); // Ref for the scrollable area

  const timeSlots = generateTimeSlots();

  const filteredEvents = useMemo(() => {
    if (!date) return [];
    return events
      .filter(event => isSameDay(event.start, date))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [date]);

  // Real-time indicator logic
  useEffect(() => {
    if (!date || !isToday(date) || !timelineRef.current) {
      setCurrentTimeIndicatorLeft(null);
      return;
    }

    const updateCurrentTimeIndicator = () => {
      const now = new Date();
      const minutesFromTimelineStart = (now.getHours() - timelineStartHour) * 60 + now.getMinutes();
      const left = (minutesFromTimelineStart / 60) * hourWidthPx;
      setCurrentTimeIndicatorLeft(left);
    };

    updateCurrentTimeIndicator();
    const interval = setInterval(updateCurrentTimeIndicator, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, [date]);

  return (
    <Card className="rounded-xl shadow-sm bg-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-foreground">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <WeekCalendar selected={date} onSelect={setDate} events={events.map(e => ({ date: e.start }))} />
        <div className="flex-1 overflow-x-auto p-4" ref={timelineRef}> {/* Horizontal scroll container */}
          <div className="relative" style={{ minWidth: `${totalTimelineHours * hourWidthPx}px` }}>
            {/* Time labels */}
            <div className="flex border-b border-border pb-2 mb-2">
              {timeSlots.map((slot, index) => (
                <div
                  key={format(slot, "HH:mm")}
                  className="flex-shrink-0 text-center text-xs text-muted-foreground"
                  style={{ width: `${hourWidthPx}px` }}
                >
                  {format(slot, "h a")}
                </div>
              ))}
            </div>

            {/* Events container */}
            <div className="relative" style={{ height: `${eventRowHeightPx}px` }}>
              {/* Events */}
              {filteredEvents.map((event) => {
                const startMinutesFromTimelineStart = (event.start.getHours() - timelineStartHour) * 60 + event.start.getMinutes();
                const durationMinutes = differenceInMinutes(event.end, event.start);

                const left = (startMinutesFromTimelineStart / 60) * hourWidthPx;
                const width = (durationMinutes / 60) * hourWidthPx;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute top-0 rounded-md p-2 text-xs text-white overflow-hidden",
                      event.color,
                    )}
                    style={{ left: `${left}px`, width: `${width}px`, height: "100%" }}
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-[0.65rem] opacity-90">{format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}</p>
                  </div>
                );
              })}

              {/* Current time indicator */}
              {currentTimeIndicatorLeft !== null && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-red-500 z-20"
                  style={{ left: `${currentTimeIndicatorLeft}px` }}
                >
                  <div className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          </div>
          {filteredEvents.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-4">No events for this day.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;