"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, subWeeks, addWeeks, isSameDay, isToday, setHours, setMinutes, differenceInMinutes } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarEvents } from "@/contexts/CalendarEventsContext";

interface Event {
  id: string;
  start: Date;
  end: Date;
  title: string;
  type: "Team Meetup" | "Illustration" | "Research" | "Presentation" | "Report";
  color: string;
}

const UpcomingEvents = () => {
  const { events: calendarEvents, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentTimeIndicatorTop, setCurrentTimeIndicatorTop] = useState<number | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday as start of week
  );
  const timelineRef = useRef<HTMLDivElement>(null);

  // Edit event state
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    color: "bg-blue-500"
  });

  // Additional state for edit modal
  const [editShowDatePicker, setEditShowDatePicker] = useState(false);
  const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Refs for dropdowns
  const editDatePickerRef = useRef<HTMLDivElement>(null);
  const startTimeDropdownRef = useRef<HTMLDivElement>(null);
  const endTimeDropdownRef = useRef<HTMLDivElement>(null);

  // Hover tooltip state
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: any;
    position: { x: number; y: number };
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to handle hover with delay
  const handleEventMouseEnter = (event: any, position: { x: number; y: number }) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredEvent({ event, position });
  };

  const handleEventMouseLeave = () => {
    // Set a delay before closing the tooltip to allow mouse to move to tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEvent(null);
    }, 150); // 150ms delay
  };

  const handleTooltipMouseEnter = () => {
    // Clear timeout when mouse enters tooltip
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    // Close tooltip when mouse leaves tooltip
    setHoveredEvent(null);
  };

  // Calculate duration between start and end time
  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return "";
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  };

  // Helper function to format date string without timezone conversion
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle edit event
  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: formatDateString(event.date),
      time: event.time || "",
      startTime: event.startTime || "09:00 AM",
      endTime: event.endTime || "10:00 AM",
      color: event.color
    });
    setShowEditEventModal(true);
  };

  // Handle delete event
  const handleDeleteEvent = (event: any) => {
    deleteEvent(event.id);
  };

  // Generate time options for dropdowns
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const displayMinute = minute.toString().padStart(2, '0');
        times.push(`${displayHour}:${displayMinute} ${period}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Generate calendar grid for date picker (reusing the existing logic)
  const generateCalendarGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = currentDate.getTime() === today.getTime();
        const dateString = formatDateString(currentDate);
        const isSelected = newEvent.date === dateString;
        
        days.push({
          date: currentDate,
          isCurrentMonth,
          isToday,
          isSelected,
          dateString: dateString
        });
      }
      weeks.push(days);
    }
    
    return weeks;
  };

  // Submit event handler
  const submitEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    const eventDate = new Date(newEvent.date);
    const updatedEventData = {
      title: newEvent.title,
      date: eventDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color,
      time: newEvent.startTime
    };

    if (editingEvent) {
      updateEvent(editingEvent.id, updatedEventData);
      setShowEditEventModal(false);
      setEditingEvent(null);
    }

    setNewEvent({ title: "", date: "", time: "", startTime: "09:00 AM", endTime: "10:00 AM", color: "bg-blue-500" });
  };

  // Timeline configuration
  const timelineStartHour = 0; // 12 AM (midnight)
  const timelineEndHour = 24; // 12 AM (next day, exclusive)
  const totalTimelineHours = timelineEndHour - timelineStartHour;
  const hourHeightPx = 64; // Height of each hour slot in pixels

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = timelineStartHour; i < timelineEndHour; i++) {
      slots.push(setMinutes(setHours(new Date(), i), 0));
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get week days for week view
  const daysInWeek = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) =>
      addDays(currentWeekStart, i)
    );
  }, [currentWeekStart]);

  // Convert calendar events to timeline format and filter for selected date with overlap handling
  const filteredEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    const eventsForDay = calendarEvents
      .filter(event => isSameDay(event.date, selectedDate))
      .map(event => {
        let startTime = new Date(event.date);
        let endTime = new Date(event.date);
        
        if (event.startTime) {
          const [time, period] = event.startTime.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 += 12;
          if (period === 'AM' && hours === 12) hour24 = 0;
          
          startTime = new Date(event.date);
          startTime.setHours(hour24, minutes, 0, 0);
        }
        
        if (event.endTime) {
          const [time, period] = event.endTime.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 += 12;
          if (period === 'AM' && hours === 12) hour24 = 0;
          
          endTime = new Date(event.date);
          endTime.setHours(hour24, minutes, 0, 0);
        } else {
          // Default to 1 hour duration if no end time
          endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 1);
        }
        
        return {
          ...event,
          start: startTime,
          end: endTime,
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Calculate event positions with improved overlap handling
    const eventsWithPositions = eventsForDay.map((event, index) => {
      const startMinutesFromTimelineStart = (event.start.getHours() - timelineStartHour) * 60 + event.start.getMinutes();
      const durationMinutes = differenceInMinutes(event.end, event.start);
      
      const top = (startMinutesFromTimelineStart / 60) * hourHeightPx;
      const height = (durationMinutes / 60) * hourHeightPx;
      
      // Overlap detection logic
      const currentStart = event.start.getHours() * 60 + event.start.getMinutes();
      const currentEnd = event.end.getHours() * 60 + event.end.getMinutes();
      
      const overlappingEvents = eventsForDay.filter((otherEvent) => {
        const otherStart = otherEvent.start.getHours() * 60 + otherEvent.start.getMinutes();
        const otherEnd = otherEvent.end.getHours() * 60 + otherEvent.end.getMinutes();
        return (currentStart < otherEnd && currentEnd > otherStart);
      });
      
      const overlappingEventsBeforeThis = overlappingEvents.filter((otherEvent) => {
        const otherEventIndex = eventsForDay.findIndex(e => e.id === otherEvent.id);
        return otherEventIndex < index;
      });
      
      const totalOverlappingEvents = overlappingEvents.length;
      const columnIndex = overlappingEventsBeforeThis.length;
      
      const widthPercentage = totalOverlappingEvents > 1 ? 100 / totalOverlappingEvents : 100;
      const leftOffsetPercentage = totalOverlappingEvents > 1 ? (columnIndex * widthPercentage) : 0;
      
      return {
        ...event,
        top,
        height,
        leftOffsetPercentage,
        widthPercentage,
        isVisible: event.end.getHours() >= timelineStartHour && event.start.getHours() < timelineEndHour
      };
    });

    return eventsWithPositions;
  }, [selectedDate, calendarEvents, timelineStartHour, hourHeightPx]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Real-time indicator logic
  useEffect(() => {
    if (!selectedDate || !isToday(selectedDate) || !timelineRef.current) {
      setCurrentTimeIndicatorTop(null);
      return;
    }

    const updateCurrentTimeIndicator = () => {
      const now = new Date();
      const minutesFromTimelineStart = (now.getHours() - timelineStartHour) * 60 + now.getMinutes();
      const top = (minutesFromTimelineStart / 60) * hourHeightPx;
      setCurrentTimeIndicatorTop(top);
    };

    updateCurrentTimeIndicator();
    const interval = setInterval(updateCurrentTimeIndicator, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedDate, timelineStartHour, hourHeightPx]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (editShowDatePicker && editDatePickerRef.current && 
          !editDatePickerRef.current.contains(target)) {
        setEditShowDatePicker(false);
      }
      
      if (showStartTimeDropdown && startTimeDropdownRef.current &&
          !startTimeDropdownRef.current.contains(target)) {
        setShowStartTimeDropdown(false);
      }
      
      if (showEndTimeDropdown && endTimeDropdownRef.current &&
          !endTimeDropdownRef.current.contains(target)) {
        setShowEndTimeDropdown(false);
      }
    };

    if (editShowDatePicker || showStartTimeDropdown || showEndTimeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editShowDatePicker, showStartTimeDropdown, showEndTimeDropdown]);

  return (
    <Card className="rounded-3xl shadow-sm bg-card flex flex-col">
      <CardHeader>
        <CardTitle className="text-foreground">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        {/* Week View */}
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
              const hasEvent = calendarEvents.some(event => isSameDay(event.date, day));
              const isSelected = selectedDate && isSameDay(selectedDate, day);
              const isCurrentDay = isToday(day);

              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2 rounded-2xl h-auto transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    {
                      "bg-black text-white hover:bg-gray-800": isCurrentDay,
                      "bg-primary text-primary-foreground hover:bg-primary/90": isSelected && !isCurrentDay,
                      "bg-muted text-muted-foreground hover:bg-muted/80": !isSelected && !isCurrentDay,
                    }
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="text-xs font-medium uppercase">
                    {format(day, "EEE")}
                  </span>
                  <span className="text-lg font-bold">
                    {format(day, "d")}
                  </span>
                  {hasEvent && (
                    <span className={cn(
                      "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                      (isCurrentDay || isSelected) ? "bg-white/70" : "bg-primary"
                    )}></span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Timeline View */}
        <ScrollArea className="h-80 p-4 scrollbar-hide">
          <div className="relative grid grid-cols-[auto_1fr] gap-x-2" ref={timelineRef} style={{ minHeight: `${totalTimelineHours * hourHeightPx}px` }}>
            {/* Time labels and grid lines */}
            {timeSlots.map((slot, index) => (
              <React.Fragment key={format(slot, "HH:mm")}>
                <div
                  className={cn(
                    "text-right text-xs text-muted-foreground pt-2",
                    index === 0 ? "self-start" : "self-stretch"
                  )}
                  style={{ height: `${hourHeightPx}px` }}
                >
                  {format(slot, "h a")}
                </div>
                <div className="relative border-b border-border" style={{ height: `${hourHeightPx}px` }}>
                  {/* This div acts as the horizontal grid line */}
                </div>
              </React.Fragment>
            ))}

            {/* Events with intelligent overlapping */}
            <div className="absolute col-start-2 col-end-3 inset-0">
              {filteredEvents.map((event) => {
                if (!event.isVisible) return null;
                
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute rounded-md p-2 text-xs text-white overflow-hidden shadow-md border border-white/20 cursor-pointer",
                      event.color,
                    )}
                    style={{ 
                      top: `${event.top}px`, 
                      height: `${Math.max(event.height, 40)}px`,
                      left: `${event.leftOffsetPercentage}%`,
                      width: `${event.widthPercentage - 2}%`,
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleEventMouseEnter(event, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }}
                    onMouseLeave={handleEventMouseLeave}
                  >
                    <p className="font-medium leading-tight truncate" title={event.title}>
                      {event.title}
                    </p>
                    <p className="text-[0.65rem] opacity-90 leading-tight">
                      {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current time indicator */}
            {currentTimeIndicatorTop !== null && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center"
                style={{ top: `${currentTimeIndicatorTop}px` }}
              >
                {/* Red dot */}
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 relative z-10" />
                {/* Red line */}
                <div className="flex-1 h-px bg-red-500 ml-1" />
              </div>
            )}
          </div>
          {filteredEvents.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-4">No events for this day.</p>
          )}
        </ScrollArea>
      </CardContent>

      {/* Event Hover Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed z-40 bg-white/90 backdrop-blur-md text-gray-800 rounded-xl shadow-lg border border-white/20 p-4 max-w-xs"
          style={{
            left: `${hoveredEvent.position.x}px`,
            top: `${hoveredEvent.position.y}px`,
            transform: 'translateX(-50%)'
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${hoveredEvent.event.color}`}></div>
                <h4 className="font-semibold text-sm text-gray-800">{hoveredEvent.event.title}</h4>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoveredEvent(null);
                    handleEditEvent(hoveredEvent.event);
                  }}
                  title="Edit event"
                >
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-gray-600"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button 
                  className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoveredEvent(null);
                    handleDeleteEvent(hoveredEvent.event);
                  }}
                  title="Delete event"
                >
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-red-600"
                  >
                    <path d="M3 6h18"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>{hoveredEvent.event.date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              
              {hoveredEvent.event.startTime && hoveredEvent.event.endTime && (
                <>
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{hoveredEvent.event.startTime} - {hoveredEvent.event.endTime}</span>
                  </div>
                  {calculateDuration(hoveredEvent.event.startTime, hoveredEvent.event.endTime) && (
                    <div className="flex items-center gap-2">
                      <span>⏱️</span>
                      <span>{calculateDuration(hoveredEvent.event.startTime, hoveredEvent.event.endTime)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Edit Event</h3>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditEventModal(false);
                  setEditingEvent(null);
                  setNewEvent({ title: "", date: "", time: "", startTime: "09:00 AM", endTime: "10:00 AM", color: "bg-blue-500" });
                }}
                className="rounded-2xl"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setEditShowDatePicker(!editShowDatePicker)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-left bg-white flex items-center justify-between"
                  >
                    <span className={newEvent.date ? "text-gray-900" : "text-gray-500"}>
                      {newEvent.date ? new Date(newEvent.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : "Select date"}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {editShowDatePicker && (
                    <div 
                      ref={editDatePickerRef}
                      className="absolute z-50 mt-2 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 w-80 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarGrid(calendarDate).map((week, weekIndex) =>
                          week.map((day, dayIndex) => (
                            <button
                              key={`${weekIndex}-${dayIndex}`}
                              onClick={() => {
                                setNewEvent(prev => ({...prev, date: day.dateString}));
                                setEditShowDatePicker(false);
                              }}
                              className={`
                                p-2 text-sm rounded-xl transition-all duration-200 hover:bg-gray-100
                                ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                                ${day.isToday ? 'bg-black text-white hover:bg-gray-800' : ''}
                                ${day.isSelected ? 'bg-gray-100 text-black ring-2 ring-black' : ''}
                              `}
                            >
                              {day.date.getDate()}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time Duration
                </label>
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <div className="flex items-center gap-2 w-full">
                    {/* Start Time Dropdown */}
                    <div className="relative flex-1" ref={startTimeDropdownRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStartTimeDropdown(!showStartTimeDropdown);
                          setShowEndTimeDropdown(false);
                        }}
                        className="w-full text-left bg-transparent border-none outline-none text-sm py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {newEvent.startTime}
                      </button>
                      {showStartTimeDropdown && (
                        <div 
                          className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {timeOptions.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewEvent(prev => ({ ...prev, startTime: time }));
                                setShowStartTimeDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl block"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-gray-500 text-sm">-</span>
                    
                    {/* End Time Dropdown */}
                    <div className="relative flex-1" ref={endTimeDropdownRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEndTimeDropdown(!showEndTimeDropdown);
                          setShowStartTimeDropdown(false);
                        }}
                        className="w-full text-left bg-transparent border-none outline-none text-sm py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {newEvent.endTime}
                      </button>
                      {showEndTimeDropdown && (
                        <div 
                          className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {timeOptions.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewEvent(prev => ({ ...prev, endTime: time }));
                                setShowEndTimeDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl block"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Color
                </label>
                <div className="flex gap-3 flex-wrap">
                  {["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-red-500"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full ${color} ${newEvent.color === color ? "ring-4 ring-gray-300" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditEventModal(false);
                  setEditingEvent(null);
                  setNewEvent({ title: "", date: "", time: "", startTime: "09:00 AM", endTime: "10:00 AM", color: "bg-blue-500" });
                }}
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={submitEvent}
                className="flex-1 bg-black hover:bg-gray-800 text-white rounded-2xl"
              >
                Update Event
              </Button>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
};

export default UpcomingEvents;