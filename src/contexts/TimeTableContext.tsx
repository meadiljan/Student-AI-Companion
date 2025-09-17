"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useCourses } from "./CoursesContext";
import { useCalendarEvents } from "./CalendarEventsContext";

export interface TimeSlot {
  id: string;
  courseId: string;
  courseName: string;
  instructor: string;
  location: string;
  day: number; // 0-6 (Monday-Sunday)
  startTime: string;
  endTime: string;
  color: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam';
  recurring: boolean;
}

interface TimeTableContextType {
  timeSlots: TimeSlot[];
  addTimeSlot: (slot: Omit<TimeSlot, 'id'>) => void;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;
  syncToCalendar: () => void;
  generateFromCourses: () => void;
}

const TimeTableContext = createContext<TimeTableContextType | undefined>(undefined);

export const TimeTableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const { courses } = useCourses();
  const { addEvent } = useCalendarEvents();

  const generateFromCourses = useCallback(() => {
    if (courses.length === 0) return;
    
    const defaultSchedule = [
      { day: 0, startTime: "09:00", endTime: "10:30", type: 'lecture' as const },
      { day: 1, startTime: "10:00", endTime: "11:30", type: 'lecture' as const },
      { day: 2, startTime: "14:00", endTime: "16:00", type: 'lab' as const },
      { day: 3, startTime: "11:00", endTime: "12:30", type: 'lecture' as const },
      { day: 4, startTime: "13:00", endTime: "14:30", type: 'tutorial' as const },
    ];

    const generatedSlots = courses.slice(0, 5).map((course, index) => {
      const schedule = defaultSchedule[index] || defaultSchedule[0];
      return {
        id: `${course.id}-generated-${index}`,
        courseId: course.id,
        courseName: course.title,
        instructor: course.instructor,
        location: `Room ${Math.floor(Math.random() * 200) + 100}`,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        color: course.color,
        type: schedule.type,
        recurring: true
      };
    });

    setTimeSlots(generatedSlots);
  }, [courses]);

  // Only generate once when courses are available
  useEffect(() => {
    if (courses.length > 0 && timeSlots.length === 0) {
      generateFromCourses();
    }
  }, [courses.length, timeSlots.length, generateFromCourses]);

  const addTimeSlot = (slot: Omit<TimeSlot, 'id'>) => {
    const newSlot: TimeSlot = {
      ...slot,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setTimeSlots(prev => [...prev, newSlot]);
  };

  const updateTimeSlot = (id: string, updates: Partial<TimeSlot>) => {
    setTimeSlots(prev => prev.map(slot => 
      slot.id === id ? { ...slot, ...updates } : slot
    ));
  };

  const deleteTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const syncToCalendar = () => {
    const today = new Date();
    const currentWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));

    timeSlots.forEach(slot => {
      // Create events for the current week and next 4 weeks if recurring
      const weeksToCreate = slot.recurring ? 5 : 1;
      
      for (let week = 0; week < weeksToCreate; week++) {
        const eventDate = new Date(currentWeek);
        eventDate.setDate(eventDate.getDate() + (week * 7) + slot.day);
        
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        
        const formatTime = (hour: number, minute: number) => {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        };

        const startTime12 = formatTime(startHour, startMinute);
        const endTime12 = formatTime(endHour, endMinute);

        addEvent({
          title: `${slot.courseName} (${slot.type})`,
          date: eventDate,
          color: slot.color,
          time: startTime12,
          startTime: startTime12,
          endTime: endTime12
        });
      }
    });
  };

  return (
    <TimeTableContext.Provider value={{
      timeSlots,
      addTimeSlot,
      updateTimeSlot,
      deleteTimeSlot,
      syncToCalendar,
      generateFromCourses
    }}>
      {children}
    </TimeTableContext.Provider>
  );
};

export const useTimeTable = () => {
  const context = useContext(TimeTableContext);
  if (context === undefined) {
    throw new Error('useTimeTable must be used within a TimeTableProvider');
  }
  return context;
};