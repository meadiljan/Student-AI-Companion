import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventManager } from "@/utils/eventManager";
import { useCalendarEvents } from "@/contexts/CalendarEventsContext";
import { format } from "date-fns";
import TimeTable from "./TimeTable";

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
  time?: string;
  startTime?: string;
  endTime?: string;
}

type CalendarView = "month" | "week" | "today";

interface CalendarProps {
  onEventsChange?: (events: CalendarEvent[]) => void;
}

export interface CalendarRef {
  addEvent: (eventData: Omit<CalendarEvent, 'id'>) => void;
}

const Calendar = forwardRef<CalendarRef, CalendarProps>(({ onEventsChange }, ref) => {
  const { events: calendarEvents, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeTable, setShowTimeTable] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "09:00 AM",
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    color: "bg-blue-500"
  });
  const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editShowDatePicker, setEditShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Refs for dropdown elements
  const startTimeDropdownRef = useRef<HTMLDivElement>(null);
  const endTimeDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const editDatePickerRef = useRef<HTMLDivElement>(null);
  
  // Additional refs for edit modal dropdowns
  const editStartTimeDropdownRef = useRef<HTMLDivElement>(null);
  const editEndTimeDropdownRef = useRef<HTMLDivElement>(null);
  
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: CalendarEvent;
    position: { x: number; y: number };
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to handle hover with delay
  const handleEventMouseEnter = (event: CalendarEvent, position: { x: number; y: number }) => {
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
    
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let totalHours = hours;
      
      if (period === 'PM' && hours !== 12) totalHours += 12;
      if (period === 'AM' && hours === 12) totalHours = 0;
      
      return totalHours * 60 + minutes; // Convert to total minutes
    };
    
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes <= 0) return "";
    
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

  // Helper function to format date as YYYY-MM-DD without timezone conversion
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate calendar grid for date picker
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
  
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen for events from AI assistant
  useEffect(() => {
    const handleAIEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
      addEvent(eventData);
    };

    eventManager.addListener(handleAIEvent);

    return () => {
      eventManager.removeListener(handleAIEvent);
    };
  }, [calendarEvents]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addEvent: addLocalEvent
  }), [calendarEvents]);

  const handleAddEvent = () => {
    setShowAddEventModal(true);
    // Set default date to current date and default time
    setNewEvent(prev => ({
      ...prev,
      date: currentDate.toISOString().split('T')[0],
      time: prev.startTime || "09:00 AM"
    }));
  };

  // Method to add event from external sources (like AI assistant)
  const addLocalEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    // Use the context's addEvent function directly since the format matches
    addEvent(eventData);
    
    // Call callback if provided
    if (onEventsChange) {
      onEventsChange(calendarEvents);
    }
  };

  // Helper function to convert time string to Date
  const convertTimeStringToDate = (baseDate: Date, timeString: string): Date => {
    const date = new Date(baseDate);
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let adjustedHours = hours;
    
    if (period === 'PM' && hours !== 12) {
      adjustedHours += 12;
    } else if (period === 'AM' && hours === 12) {
      adjustedHours = 0;
    }
    
    date.setHours(adjustedHours, minutes, 0, 0);
    return date;
  };

  // Handle edit event
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date.toISOString().split('T')[0],
      time: event.time || "",
      startTime: event.startTime || "09:00 AM",
      endTime: event.endTime || "10:00 AM",
      color: event.color
    });
    setShowEditEventModal(true);
  };

  // Handle delete event
  const handleDeleteEvent = (event: CalendarEvent) => {
    deleteEvent(event.id);
    
    // Call callback if provided
    if (onEventsChange) {
      onEventsChange(calendarEvents);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside start time dropdown
      if (showStartTimeDropdown && startTimeDropdownRef.current && 
          !startTimeDropdownRef.current.contains(target)) {
        setShowStartTimeDropdown(false);
      }
      
      // Check if click is outside end time dropdown
      if (showEndTimeDropdown && endTimeDropdownRef.current && 
          !endTimeDropdownRef.current.contains(target)) {
        setShowEndTimeDropdown(false);
      }
      
      // Check if click is outside date picker
      if (showDatePicker && datePickerRef.current && 
          !datePickerRef.current.contains(target)) {
        setShowDatePicker(false);
      }
      
      // Check if click is outside edit date picker
      if (editShowDatePicker && editDatePickerRef.current && 
          !editDatePickerRef.current.contains(target)) {
        setEditShowDatePicker(false);
      }
    };

    if (showStartTimeDropdown || showEndTimeDropdown || showDatePicker || editShowDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStartTimeDropdown, showEndTimeDropdown, showDatePicker, editShowDatePicker]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Auto-hide hover tooltip when mouse moves away
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (hoveredEvent) {
      timeoutId = setTimeout(() => {
        setHoveredEvent(null);
      }, 3000); // Auto hide after 3 seconds
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [hoveredEvent]);

  const submitEvent = () => {
    if (newEvent.title && newEvent.date) {
      const eventDate = new Date(newEvent.date);
      
      if (editingEvent) {
        // Update existing event in context
        const updatedEventData = {
          title: newEvent.title,
          date: eventDate,
          color: newEvent.color,
          time: newEvent.time,
          startTime: newEvent.startTime,
          endTime: newEvent.endTime
        };
        updateEvent(editingEvent.id, updatedEventData);
        setShowEditEventModal(false);
        setEditingEvent(null);
        
        // Call callback if provided
        if (onEventsChange) {
          onEventsChange(calendarEvents);
        }
      } else {
        // Create new event
        addLocalEvent({
          title: newEvent.title,
          date: eventDate,
          color: newEvent.color,
          time: newEvent.time,
          startTime: newEvent.startTime,
          endTime: newEvent.endTime
        });
        setShowAddEventModal(false);
      }
      
      setNewEvent({ title: "", date: "", time: "", startTime: "09:00 AM", endTime: "10:00 AM", color: "bg-blue-500" });
    }
  };

  // Convert context events to local CalendarEvent format
  const convertContextEventsToLocal = (): CalendarEvent[] => {
    // Since the formats are now the same, just return calendarEvents
    return calendarEvents;
  };

  const getEventsForDate = (date: Date) => {
    const localEvents = convertContextEventsToLocal();
    return localEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return getEventsForDate(date);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Generate time options for dropdown
  const generateTimeOptions = () => {
    const times = [];
    
    // Generate AM times (1:00 AM to 12:59 AM)
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour}:${minute.toString().padStart(2, '0')}`;
        times.push(`${timeString} AM`);
      }
    }
    
    // Generate PM times (1:00 PM to 12:59 PM)
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour}:${minute.toString().padStart(2, '0')}`;
        times.push(`${timeString} PM`);
      }
    }
    
    return times;
  };
  
  const timeOptions = generateTimeOptions();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert Sunday (0) to be the last day (6), and shift everything else back by 1
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    // Open add event modal with the selected date
    setNewEvent(prev => ({
      ...prev,
      date: clickedDate.toISOString().split('T')[0],
      time: prev.startTime || "09:00 AM"
    }));
    setShowAddEventModal(true);
  };

  const renderSelectedDateView = (date: Date) => {
    const dateEvents = getEventsForDate(date);
    
    // Improved time parsing function (same as today view)
    const parseTime = (timeStr?: string) => {
      if (!timeStr) return { hour: 9, minute: 0 };
      
      const timeParts = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/i);
      if (!timeParts) return { hour: 9, minute: 0 };
      
      let hour = parseInt(timeParts[1]);
      const minute = parseInt(timeParts[2] || '0');
      const period = (timeParts[3] || '').toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return { hour, minute };
    };
    
    // Convert events to timeline format with proper time parsing
    const timelineEvents = dateEvents.map(event => {
      const { hour, minute } = parseTime(event.time);
      const startTime = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate(), hour, minute);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      return {
        ...event,
        start: startTime,
        end: endTime,
        parsedHour: hour,
        parsedMinute: minute
      };
    });

    // Sort events by time
    timelineEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Timeline configuration
    const timelineStartHour = 0;
    const timelineEndHour = 24;
    const hourHeightPx = 50; // Smaller for popup
    const totalTimelineHours = timelineEndHour - timelineStartHour;

    // Generate time slots
    const timeSlots = [];
    for (let hour = timelineStartHour; hour < timelineEndHour; hour++) {
      timeSlots.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0));
    }

    // Calculate event positions with improved overlap handling
    const eventsWithPositions = timelineEvents.map((event, index) => {
      const startMinutesFromTimelineStart = (event.parsedHour - timelineStartHour) * 60 + event.parsedMinute;
      const durationMinutes = 60;
      
      const top = (startMinutesFromTimelineStart / 60) * hourHeightPx;
      const height = (durationMinutes / 60) * hourHeightPx;
      
      // Same overlap detection logic as today view
      const currentStart = event.parsedHour * 60 + event.parsedMinute;
      const currentEnd = currentStart + 60;
      
      const overlappingEvents = timelineEvents.filter((otherEvent) => {
        const otherStart = otherEvent.parsedHour * 60 + otherEvent.parsedMinute;
        const otherEnd = otherStart + 60;
        return (currentStart < otherEnd && currentEnd > otherStart);
      });
      
      const overlappingEventsBeforeThis = overlappingEvents.filter((otherEvent) => {
        const otherEventIndex = timelineEvents.findIndex(e => e.id === otherEvent.id);
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
        isVisible: event.parsedHour >= timelineStartHour && event.parsedHour < timelineEndHour
      };
    });

    // Current time indicator for selected date
    const isSelectedDay = currentTime.toDateString() === date.toDateString();
    const currentTimeTop = isSelectedDay 
      ? ((currentTime.getHours() - timelineStartHour) * 60 + currentTime.getMinutes()) * (hourHeightPx / 60)
      : null;
    
    return (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <h3 className="text-xl font-bold text-gray-800">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        {/* Timeline View with improved event positioning */}
        <div className="relative bg-gray-50 rounded-2xl p-4 overflow-hidden">
          <h4 className="font-semibold text-gray-700 mb-4">Schedule</h4>
          <div 
            className="relative grid grid-cols-[auto_1fr] gap-x-4" 
            style={{ minHeight: `${totalTimelineHours * hourHeightPx}px` }}
          >
            {/* Time labels and grid lines */}
            {timeSlots.map((slot, index) => {
              const hour = index + timelineStartHour;
              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
              const period = hour >= 12 ? 'PM' : 'AM';
              const timeLabel = `${displayHour} ${period}`;
              
              return (
                <React.Fragment key={hour}>
                  <div
                    className="text-right text-xs text-gray-500 pt-2 w-12"
                    style={{ height: `${hourHeightPx}px` }}
                  >
                    {timeLabel}
                  </div>
                  <div 
                    className="relative border-b border-gray-200" 
                    style={{ height: `${hourHeightPx}px` }}
                  />
                </React.Fragment>
              );
            })}

            {/* Events with improved positioning */}
            <div className="absolute col-start-2 col-end-3 inset-0">
              {eventsWithPositions.map((event) => {
                if (!event.isVisible) return null;
                
                return (
                  <div
                    key={event.id}
                    className={`absolute rounded-lg p-2 text-white shadow-md flex flex-col justify-center ${event.color} border border-white/20`}
                    style={{ 
                      top: `${event.top}px`, 
                      height: `${Math.max(event.height, 40)}px`,
                      left: `${event.leftOffsetPercentage}%`,
                      width: `${event.widthPercentage - 2}%`,
                      zIndex: 10
                    }}
                  >
                    <p className="font-medium text-xs leading-tight truncate" title={event.title}>
                      {event.title}
                    </p>
                    <p className="text-xs opacity-90 leading-tight">
                      {event.start.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })} - {event.end.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current time indicator */}
            {currentTimeTop !== null && isSelectedDay && currentTime.getHours() >= timelineStartHour && currentTime.getHours() < timelineEndHour && (
              <div
                className="absolute col-start-2 col-end-3 w-full z-20 flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-md" />
                <div className="flex-1 h-0.5 bg-red-500" />
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md ml-2 font-medium">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            )}
          </div>
          
          {dateEvents.length === 0 && (
            <p className="text-gray-500 text-center py-8">No events scheduled for this date</p>
          )}
        </div>
        
        {/* Event List for popup */}
        {dateEvents.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">All Events</h4>
            <div className="space-y-2">
              {timelineEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div className={`w-3 h-3 rounded-full ${event.color} flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-gray-600">
                      {event.start.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })} - {event.end.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTodayView = () => {
    const selectedDay = currentDate; // Use currentDate instead of hardcoded today
    const todayEvents = getEventsForDate(selectedDay);
    
    // Improved time parsing function
    const parseTime = (timeStr?: string) => {
      if (!timeStr) return { hour: 9, minute: 0 }; // Default to 9:00 AM
      
      const timeParts = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/i);
      if (!timeParts) return { hour: 9, minute: 0 };
      
      let hour = parseInt(timeParts[1]);
      const minute = parseInt(timeParts[2] || '0');
      const period = (timeParts[3] || '').toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return { hour, minute };
    };
    
    // Convert our events to timeline format with proper time parsing
    const timelineEvents = todayEvents.map(event => {
      const { hour, minute } = parseTime(event.time);
      const startTime = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate(), hour, minute);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      
      return {
        ...event,
        start: startTime,
        end: endTime,
        parsedHour: hour,
        parsedMinute: minute
      };
    });

    // Sort events by time to handle overlaps better
    timelineEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Timeline configuration
    const timelineStartHour = 0;
    const timelineEndHour = 24;
    const hourHeightPx = 60;
    const totalTimelineHours = timelineEndHour - timelineStartHour;

    // Generate time slots
    const timeSlots = [];
    for (let hour = timelineStartHour; hour < timelineEndHour; hour++) {
      timeSlots.push(new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), hour, 0));
    }

    // Current time indicator - updates every second
    const isCurrentDay = currentTime.toDateString() === selectedDay.toDateString();
    const currentTimeTop = isCurrentDay 
      ? ((currentTime.getHours() - timelineStartHour) * 60 + currentTime.getMinutes()) * (hourHeightPx / 60)
      : null;
    
    // Calculate event positions with improved overlap handling for multiple events
    const eventsWithPositions = timelineEvents.map((event, index) => {
      const startMinutesFromTimelineStart = (event.parsedHour - timelineStartHour) * 60 + event.parsedMinute;
      const durationMinutes = 60; // 1-hour events
      
      const top = (startMinutesFromTimelineStart / 60) * hourHeightPx;
      const height = (durationMinutes / 60) * hourHeightPx;
      
      // Advanced overlap detection for multiple events
      const currentStart = event.parsedHour * 60 + event.parsedMinute;
      const currentEnd = currentStart + 60;
      
      // Find all overlapping events (including this one)
      const overlappingEvents = timelineEvents.filter((otherEvent, otherIndex) => {
        const otherStart = otherEvent.parsedHour * 60 + otherEvent.parsedMinute;
        const otherEnd = otherStart + 60;
        
        // Check if events overlap in time
        return (currentStart < otherEnd && currentEnd > otherStart);
      });
      
      // Determine position within overlapping group
      const overlappingEventsBeforeThis = overlappingEvents.filter((otherEvent, otherIndex) => {
        const otherEventIndex = timelineEvents.findIndex(e => e.id === otherEvent.id);
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
        columnIndex,
        totalColumns: totalOverlappingEvents,
        isVisible: event.parsedHour >= timelineStartHour && event.parsedHour < timelineEndHour
      };
    });

    // Navigation functions for today view
    const goToPreviousDay = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    };

    const goToNextDay = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    };

    const goToToday = () => {
      setCurrentDate(new Date());
    };
    
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <div className="space-y-4">
        {/* Navigation Header for Today View */}
        <div className={`flex items-center justify-between p-6 rounded-2xl ${isToday ? 'bg-black' : 'bg-gray-50'}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousDay}
            className="rounded-2xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-gray-800'}`}>
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextDay}
            className="rounded-2xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Timeline View with improved event positioning */}
        <div className="relative bg-gray-50 rounded-2xl p-4 overflow-hidden">
          <h4 className="font-semibold text-gray-700 mb-4">Schedule</h4>
          <div 
            className="relative grid grid-cols-[auto_1fr] gap-x-4" 
            style={{ minHeight: `${totalTimelineHours * hourHeightPx}px` }}
          >
            {/* Time labels and grid lines */}
            {timeSlots.map((slot, index) => {
              const hour = index + timelineStartHour;
              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
              const period = hour >= 12 ? 'PM' : 'AM';
              const timeLabel = `${displayHour} ${period}`;
              
              return (
                <React.Fragment key={hour}>
                  <div
                    className="text-right text-xs text-gray-500 pt-2 w-12"
                    style={{ height: `${hourHeightPx}px` }}
                  >
                    {timeLabel}
                  </div>
                  <div 
                    className="relative border-b border-gray-200" 
                    style={{ height: `${hourHeightPx}px` }}
                  />
                </React.Fragment>
              );
            })}

            {/* Events with improved positioning */}
            <div className="absolute col-start-2 col-end-3 inset-0">
              {eventsWithPositions.map((event) => {
                if (!event.isVisible) return null;
                
                return (
                  <div
                    key={event.id}
                    className={`absolute rounded-lg p-2 text-white shadow-md flex flex-col justify-center ${event.color} border border-white/20`}
                    style={{ 
                      top: `${event.top}px`, 
                      height: `${Math.max(event.height, 40)}px`,
                      left: `${event.leftOffsetPercentage}%`,
                      width: `${event.widthPercentage - 2}%`,
                      zIndex: 10
                    }}
                  >
                    <p className="font-medium text-xs leading-tight truncate" title={event.title}>
                      {event.title}
                    </p>
                    <p className="text-xs opacity-90 leading-tight">
                      {event.start.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })} - {event.end.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current time indicator */}
            {currentTimeTop !== null && isCurrentDay && currentTime.getHours() >= timelineStartHour && currentTime.getHours() < timelineEndHour && (
              <div
                className="absolute col-start-2 col-end-3 w-full z-20 flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-md" />
                <div className="flex-1 h-0.5 bg-red-500" />
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md ml-2 font-medium">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            )}
          </div>
          
          {todayEvents.length === 0 && (
            <p className="text-gray-500 text-center py-8">No events scheduled for today</p>
          )}
        </div>
        
        {/* Event List for popup */}
        {todayEvents.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">All Events</h4>
            <div className="space-y-2">
              {timelineEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div className={`w-3 h-3 rounded-full ${event.color} flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-gray-600">
                      {event.start.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })} - {event.end.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    
    // Week navigation functions
    const goToPreviousWeek = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    };

    const goToCurrentWeek = () => {
      setCurrentDate(new Date());
    };

    // Check if current week contains today
    const today = new Date();
    const isCurrentWeek = weekDates.some(date => date.toDateString() === today.toDateString());
    
    return (
      <div className="space-y-4">
        {/* Week Header with Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="rounded-2xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 grid grid-cols-7 gap-4">
            {weekDates.map((date, index) => {
              return (
                <div key={index} className={`text-center p-4 rounded-2xl ${
                  date.toDateString() === new Date().toDateString()
                    ? 'bg-black text-white'
                    : 'bg-gray-50'
                }`}>
                  <div className={`text-sm mb-1 ${
                    date.toDateString() === new Date().toDateString()
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}>
                    {dayNames[index]}
                  </div>
                  <div className={`text-xl font-bold ${
                    date.toDateString() === new Date().toDateString() 
                      ? 'text-white' 
                      : 'text-gray-800'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="rounded-2xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* "Go to Current Week" button if needed */}
        {!isCurrentWeek && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToCurrentWeek}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Go to Current Week
            </Button>
          </div>
        )}
        
        {/* Detailed Week Events (only for days with events) */}
        <div className="space-y-3">
          {weekDates.map((date, index) => {
            const localEvents = convertContextEventsToLocal();
            const dayEvents = localEvents.filter(event => 
              event.date.toDateString() === date.toDateString()
            );
            
            if (dayEvents.length === 0) return null;
            
            return (
              <div key={index} className="bg-gray-50 rounded-2xl p-4">
                <p className="font-semibold text-gray-700 mb-3">
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl ${event.color} text-white cursor-pointer transition-transform hover:scale-[1.02]`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleEventMouseEnter(event, {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }}
                      onMouseLeave={handleEventMouseLeave}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{event.title}</p>
                        {event.time && <p className="text-sm text-white/80">{event.time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-1"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      days.push(
        <div
          key={day}
          className="aspect-square p-1"
        >
          <div 
            onClick={() => handleDateClick(day)}
            className={`h-full w-full rounded-2xl flex flex-col p-2 transition-colors cursor-pointer ${
              isToday(day) 
                ? "bg-black text-white" 
                : "bg-gray-50 hover:bg-gray-100 text-gray-800"
            }`}
          >
            <span className={`text-sm font-medium mb-1 ${
              isToday(day) ? "text-white" : "text-gray-700"
            }`}>
              {day}
            </span>
            {/* Event items with names */}
            <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
              {dayEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`w-full px-1.5 py-1 rounded-lg text-white text-xs font-semibold truncate text-center ${event.color} opacity-90 leading-tight cursor-pointer hover:opacity-100 transition-opacity`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleEventMouseEnter(event, {
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10
                    });
                  }}
                  onMouseLeave={handleEventMouseLeave}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const renderCalendarGrid = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="space-y-6">
        {renderCalendarGrid()}
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case "today":
        return renderTodayView();
      case "week":
        return renderWeekView();
      case "month":
      default:
        return renderMonthView();
    }
  };

  return (
    <div className="w-full rounded-3xl shadow-xl">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigateMonth("prev")}
              className="rounded-2xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-3xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button 
              variant="outline" 
              onClick={() => navigateMonth("next")}
              className="rounded-2xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <Button
                variant={view === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("month")}
                className="rounded-xl"
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
                className="rounded-xl"
              >
                Week
              </Button>
              <Button
                variant={view === "today" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("today")}
                className="rounded-xl"
              >
                Today
              </Button>
            </div>
            
            <Button 
              onClick={() => setShowTimeTable(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl px-6"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              TimeTable
            </Button>
            
            <Button 
              onClick={handleAddEvent}
              className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-8 pt-0">
        {renderView()}
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent text-left bg-white flex items-center justify-between"
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
                  
                  {showDatePicker && (
                    <div 
                      ref={datePickerRef}
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
                                setNewEvent({...newEvent, date: day.dateString});
                                setShowDatePicker(false);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Duration
                </label>
                <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <div className="flex items-center gap-2 w-full">
                    {/* Start Time Dropdown */}
                    <div className="relative flex-1">
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
                    <div className="relative flex-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500", "bg-yellow-500"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEvent({...newEvent, color})}
                      className={`w-8 h-8 rounded-full ${color} ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddEventModal(false);
                  setNewEvent({ title: "", date: "", time: "", startTime: "09:00 AM", endTime: "10:00 AM", color: "bg-blue-500" });
                }}
                className="rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={submitEvent}
                disabled={!newEvent.title || !newEvent.date}
                className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6"
              >
                Save Event
              </Button>
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
                    <div className="relative flex-1">
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
                    <div className="relative flex-1">
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

      {/* Selected Date Modal */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Day View</h3>
              <Button
                variant="outline"
                onClick={() => setShowDateModal(false)}
                className="rounded-2xl"
              >
                ✕
              </Button>
            </div>
            {renderSelectedDateView(selectedDate)}
          </div>
        </div>
      )}

      {/* Event Hover Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed z-40 bg-white/90 backdrop-blur-md text-gray-800 rounded-xl shadow-lg border border-white/20 p-4 max-w-xs"
          style={{
            left: `${hoveredEvent.position.x}px`,
            top: `${hoveredEvent.position.y}px`,
            transform: 'translateY(-50%)',
            zIndex: 99999
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
      
      {/* TimeTable Component */}
      {showTimeTable && (
        <TimeTable isOpen={showTimeTable} onClose={() => setShowTimeTable(false)} />
      )}
    </div>
  );
});

export default Calendar;