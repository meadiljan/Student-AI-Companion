"use client";

import React from "react";
import { format, isSameDay, startOfDay, addMinutes, addDays, setHours, setMinutes, getDay } from "date-fns";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  title: string;
  type: string;
  color: string;
}

interface WeeklyEventTimelineProps {
  events: Event[];
  weekStart: Date; // The Monday of the current week
}

const START_HOUR = 8; // 8 AM
const END_HOUR = 18;  // 6 PM
const INTERVAL_MINUTES = 30; // 30-minute intervals

const WeeklyEventTimeline: React.FC<WeeklyEventTimelineProps> = ({ events, weekStart }) => {
  const timeSlots = React.useMemo(() => {
    const slots: Date[] = [];
    let currentTime = setMinutes(setHours(startOfDay(new Date()), START_HOUR), 0);
    while (currentTime.getHours() < END_HOUR || (currentTime.getHours() === END_HOUR && currentTime.getMinutes() === 0)) {
      slots.push(currentTime);
      currentTime = addMinutes(currentTime, INTERVAL_MINUTES);
    }
    return slots;
  }, []);

  const daysInWeek = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Calculate column span for an event based on its start and end time
  const getColumnSpan = (event: Event) => {
    const startMinutes = event.startTime.getHours() * 60 + event.startTime.getMinutes();
    const endMinutes = event.endTime.getHours() * 60 + event.endTime.getMinutes();
    const timelineStartMinutes = START_HOUR * 60;

    const startOffsetMinutes = startMinutes - timelineStartMinutes;
    const endOffsetMinutes = endMinutes - timelineStartMinutes;

    // +2 because the first column is for day labels, and grid columns are 1-indexed
    const startColumn = Math.floor(startOffsetMinutes / INTERVAL_MINUTES) + 2;
    const endColumn = Math.ceil(endOffsetMinutes / INTERVAL_MINUTES) + 2;

    return { start: startColumn, end: endColumn };
  };

  // Get grid row for a specific day (1-indexed)
  const getRowForDay = (day: Date) => {
    // Assuming weekStart is Monday (getDay() returns 1 for Monday, 0 for Sunday)
    // daysInWeek array is [Mon, Tue, ..., Sun]
    // dayIndex 0 (Mon) -> row 2 (after time labels)
    // dayIndex 1 (Tue) -> row 3
    // ...
    // dayIndex 6 (Sun) -> row 8
    const dayIndex = daysInWeek.findIndex(d => isSameDay(d, day));
    return dayIndex + 2;
  };

  return (
    <div className="p-4">
      <div
        className="relative grid border-t border-l rounded-xl overflow-hidden"
        style={{
          gridTemplateColumns: `auto repeat(${timeSlots.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(7, minmax(0, 1fr))`,
        }}
      >
        {/* Top-left empty corner */}
        <div className="border-b border-r h-10 bg-background"></div>

        {/* Time labels (horizontal) */}
        {timeSlots.map((time, index) => (
          <div
            key={index}
            className="flex items-center justify-center text-xs text-muted-foreground border-b border-r h-10 bg-background"
          >
            {format(time, "HH:mm")}
          </div>
        ))}

        {/* Day labels (vertical) and grid cells */}
        {daysInWeek.map((day, dayIndex) => (
          <React.Fragment key={dayIndex}>
            <div className="flex items-center justify-center text-sm font-medium text-foreground border-b border-r h-16 bg-background">
              {format(day, "EEE")}
            </div>
            {/* Grid cells for the day */}
            {timeSlots.map((_, timeIndex) => (
              <div key={timeIndex} className="border-b border-r h-16 bg-card"></div>
            ))}
          </React.Fragment>
        ))}

        {/* Events, positioned as grid items */}
        {events.map((event) => {
          const { start, end } = getColumnSpan(event);
          const row = getRowForDay(event.date);

          return (
            <div
              key={event.id}
              className={cn(
                "z-10 rounded-lg flex items-center justify-center text-xs text-white px-2 shadow-md",
                event.color,
              )}
              style={{
                gridColumnStart: start,
                gridColumnEnd: end,
                gridRowStart: row,
                gridRowEnd: row + 1, // Span only one row
                marginLeft: '2px', // Small margin to separate from grid lines
                marginRight: '2px',
              }}
            >
              <span className="truncate">{event.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyEventTimeline;