"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
  time?: string;
  startTime?: string;
  endTime?: string;
}

interface CalendarEventsContextType {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id">) => CalendarEvent;
  updateEvent: (id: number, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: number) => void;
}

const CalendarEventsContext = createContext<CalendarEventsContextType | undefined>(undefined);

const initialEvents: CalendarEvent[] = [
  {
    id: 1,
    title: "Morning Study Session",
    date: new Date(2025, 8, 19, 9, 0), // Sep 19, 2025, 9:00 AM
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    color: "bg-indigo-500",
  },
  {
    id: 2,
    title: "Quick Break", 
    date: new Date(2025, 8, 19, 10, 0), // Sep 19, 2025, 10:00 AM
    startTime: "10:00 AM",
    endTime: "10:45 AM", 
    color: "bg-gray-400",
  },
  {
    id: 3,
    title: "Team Meetup",
    date: new Date(2025, 8, 17, 9, 30), // Sep 17, 2025, 9:30 AM
    startTime: "9:30 AM",
    endTime: "10:30 AM",
    color: "bg-red-500",
  },
  {
    id: 4,
    title: "Illustration Project",
    date: new Date(2025, 8, 18, 11, 30), // Sep 18, 2025, 11:30 AM
    startTime: "11:30 AM",
    endTime: "12:30 PM",
    color: "bg-blue-500",
  },
  {
    id: 5,
    title: "Research Presentation",
    date: new Date(2025, 8, 20, 14, 0), // Sep 20, 2025, 2:00 PM
    startTime: "2:00 PM",
    endTime: "3:00 PM",
    color: "bg-green-500",
  },
];

export const CalendarEventsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  const addEvent = (eventData: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = (id: number, updates: Partial<CalendarEvent>) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === id ? { ...event, ...updates } : event
      )
    );
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  return (
    <CalendarEventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </CalendarEventsContext.Provider>
  );
};

export const useCalendarEvents = () => {
  const context = useContext(CalendarEventsContext);
  if (context === undefined) {
    throw new Error("useCalendarEvents must be used within a CalendarEventsProvider");
  }
  return context;
};