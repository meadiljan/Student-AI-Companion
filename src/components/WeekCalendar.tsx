"use client";

import React from "react";
import { format, addDays, startOfWeek, subWeeks, addWeeks, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeekCalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  events: { date: Date }[]; // To mark days with events
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({ selected, onSelect, events }) => {
  const [currentWeekStart, setCurrentWeekStart] = React.useState(
    startOfWeek(selected || new Date(), { weekStartsOn: 1 }) // Monday as start of week
  );

  React.useEffect(() => {
    if (selected) {
      setCurrentWeekStart(startOfWeek(selected, { weekStartsOn: 1 }));
    }
  }, [selected]);

  const daysInWeek = Array.from({ length: 7 }).map((_, i) =>
    addDays(currentWeekStart, i)
  );

  const handlePreviousWeek = () => {
    const newWeekStart = subWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeekStart);
    // Optionally, select the same day of the week in the new week
    if (selected) {
      const dayOfWeek = selected.getDay(); // 0 for Sunday, 1 for Monday
      const newSelected = addDays(newWeekStart, dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Adjust for Monday start
      onSelect(newSelected);
    } else {
      onSelect(newWeekStart);
    }
  };

  const handleNextWeek = () => {
    const newWeekStart = addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeekStart);
    // Optionally, select the same day of the week in the new week
    if (selected) {
      const dayOfWeek = selected.getDay();
      const newSelected = addDays(newWeekStart, dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      onSelect(newSelected);
    } else {
      onSelect(newWeekStart);
    }
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePreviousWeek} className="rounded-2xl">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-foreground">
          {format(currentWeekStart, "MMMM yyyy")}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextWeek} className="rounded-2xl">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {daysInWeek.map((day, index) => {
          const hasEvent = events.some(event => isSameDay(event.date, day));
          const isSelected = selected && isSameDay(selected, day);

          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-2xl h-auto",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                hasEvent && !isSelected && "bg-accent text-accent-foreground hover:bg-accent/80",
                !isSelected && "text-muted-foreground hover:bg-muted/50"
              )}
              onClick={() => onSelect(day)}
            >
              <span className="text-xs font-medium uppercase">
                {format(day, "EEE")}
              </span>
              <span className="text-lg font-bold">
                {format(day, "d")}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekCalendar;