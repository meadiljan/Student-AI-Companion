"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Clock, MapPin, Trash2 } from "lucide-react";
import { useCourses } from "@/contexts/CoursesContext";
import { useCalendarEvents } from "@/contexts/CalendarEventsContext";

interface TimeSlot {
  id: string;
  courseId: string;
  courseName: string;
  instructor: string;
  location: string;
  day: number;
  startTime: string;
  endTime: string;
  color: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam';
  totalOverlapping?: number; // Added for overlap information
}

interface TimeTableProps {
  isOpen: boolean;
  onClose: () => void;
}

const TimeTable: React.FC<TimeTableProps> = ({ isOpen, onClose }) => {
  const { courses } = useCourses();
  const { addEvent } = useCalendarEvents();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{slot: any, position: {x: number, y: number}} | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [newSlot, setNewSlot] = useState({
    courseId: "",
    courseName: "",
    instructor: "",
    location: "",
    day: 0,
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    type: "lecture" as 'lecture' | 'lab' | 'tutorial' | 'exam'
  });

  // Time slots configuration
  const timeSlotHours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
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
  const typeOptions = [
    { value: 'lecture', label: 'Lecture' },
    { value: 'lab', label: 'Lab' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'exam', label: 'Exam' }
  ];
  
  // Convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return "9:00 AM";
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12: string): string => {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Initialize with sample data from courses when component mounts
  useEffect(() => {
    if (courses.length > 0 && timeSlots.length === 0) {
      const sampleSchedule = [
        { day: 0, startTime: "09:30", endTime: "11:00", type: 'lecture' as const }, // 1.5 hours - Monday
        { day: 0, startTime: "10:00", endTime: "10:30", type: 'tutorial' as const }, // 30 min - Monday
        { day: 1, startTime: "14:15", endTime: "16:45", type: 'lab' as const },     // 2.5 hours - Tuesday
        { day: 2, startTime: "08:30", endTime: "09:00", type: 'lecture' as const }, // 30 min - Wednesday
        { day: 2, startTime: "09:00", endTime: "10:00", type: 'tutorial' as const }, // 1 hour - Wednesday
        { day: 2, startTime: "09:30", endTime: "09:45", type: 'lab' as const },      // 15 min - Wednesday
        { day: 4, startTime: "13:30", endTime: "15:00", type: 'lecture' as const }, // 1.5 hours - Friday
      ];

      const initialSlots = courses.slice(0, Math.min(courses.length, 7)).map((course, index) => {
        const schedule = sampleSchedule[index] || sampleSchedule[0];
        return {
          id: `${course.id}-${Date.now()}-${index}`,
          courseId: course.id,
          courseName: course.title,
          instructor: course.instructor,
          location: `Room ${Math.floor(Math.random() * 200) + 100}`,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          color: course.color,
          type: schedule.type
        };
      });
      
      setTimeSlots(initialSlots);
    }
  }, [courses, timeSlots.length]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the click is outside any dropdown
      if (!target.closest('.dropdown-container')) {
        setShowCourseDropdown(false);
        setShowDayDropdown(false);
        setShowStartTimeDropdown(false);
        setShowEndTimeDropdown(false);
        setShowTypeDropdown(false);
      }
    };

    if (showCourseDropdown || showDayDropdown || showStartTimeDropdown || showEndTimeDropdown || showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCourseDropdown, showDayDropdown, showStartTimeDropdown, showEndTimeDropdown, showTypeDropdown]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleAddTimeSlot = () => {
    if (!newSlot.courseName.trim()) return;

    const selectedCourse = courses.find(c => c.id === newSlot.courseId);
    const slot: TimeSlot = {
      id: Date.now().toString(),
      courseId: newSlot.courseId,
      courseName: newSlot.courseName,
      instructor: newSlot.instructor || selectedCourse?.instructor || "",
      location: newSlot.location,
      day: newSlot.day,
      startTime: convertTo24Hour(newSlot.startTime),
      endTime: convertTo24Hour(newSlot.endTime),
      color: selectedCourse?.color || "bg-blue-500",
      type: newSlot.type
    };

    if (editingSlot) {
      setTimeSlots(prev => prev.map(s => s.id === editingSlot.id ? slot : s));
      setEditingSlot(null);
    } else {
      setTimeSlots(prev => [...prev, slot]);
    }
    
    setNewSlot({
      courseId: "",
      courseName: "",
      instructor: "",
      location: "",
      day: 0,
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      type: "lecture"
    });
    setShowAddSlotModal(false);
  };

  const deleteTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const editTimeSlot = (slot: TimeSlot) => {
    setNewSlot({
      courseId: slot.courseId,
      courseName: slot.courseName,
      instructor: slot.instructor,
      location: slot.location,
      day: slot.day,
      startTime: convertTo12Hour(slot.startTime),
      endTime: convertTo12Hour(slot.endTime),
      type: slot.type
    });
    setEditingSlot(slot);
    setShowAddSlotModal(true);
  };

  const syncToCalendar = () => {
    const today = new Date();
    const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1));

    timeSlots.forEach(slot => {
      const eventDate = new Date(currentWeekStart);
      eventDate.setDate(eventDate.getDate() + slot.day);
      
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      };

      addEvent({
        title: `${slot.courseName} - ${slot.type}`,
        date: eventDate,
        color: slot.color,
        time: formatTime(startHour, startMinute),
        startTime: formatTime(startHour, startMinute),
        endTime: formatTime(endHour, endMinute)
      });
    });
  };

  // Calculate event positions with improved overlap handling for multiple events
  const calculateSlotPositions = (dayIndex: number) => {
    const daySlots = timeSlots.filter(slot => slot.day === dayIndex);
    
    if (daySlots.length === 0) return [];
    
    // Parse time and calculate minutes from start of day for sorting and overlap detection
    const slotsWithMinutes = daySlots.map(slot => {
      const parseTime = (timeStr: string) => {
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 += 12;
          if (period === 'AM' && hours === 12) hour24 = 0;
          return { hour: hour24, minute: minutes || 0 };
        } else {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return { hour: hours, minute: minutes || 0 };
        }
      };
      
      const startTime = parseTime(slot.startTime);
      const endTime = parseTime(slot.endTime);
      
      return {
        ...slot,
        startMinutes: startTime.hour * 60 + startTime.minute,
        endMinutes: endTime.hour * 60 + endTime.minute,
        top: getSlotTop(slot),
        height: getSlotHeight(slot)
      };
    });
    
    // Sort by start time for proper overlap detection
    slotsWithMinutes.sort((a, b) => a.startMinutes - b.startMinutes);
    
    // Calculate overlap groups and positions
    const positionedSlots = slotsWithMinutes.map((slot, index) => {
      // Find all overlapping slots
      const overlappingSlots = slotsWithMinutes.filter(otherSlot => {
        return (
          slot.startMinutes < otherSlot.endMinutes &&
          slot.endMinutes > otherSlot.startMinutes
        );
      });
      
      // Find slots that start before this one in the overlapping group
      const precedingOverlaps = overlappingSlots.filter(otherSlot => {
        const otherIndex = slotsWithMinutes.findIndex(s => s.id === otherSlot.id);
        return otherIndex < index;
      });
      
      const totalOverlapping = overlappingSlots.length;
      const columnIndex = precedingOverlaps.length;
      
      // Calculate width and left offset
      let widthPercent = 100;
      let leftPercent = 0;
      
      if (totalOverlapping > 1) {
        widthPercent = Math.max(100 / totalOverlapping, 25); // Minimum 25% width
        leftPercent = columnIndex * widthPercent;
        
        // Ensure we don't exceed 100% width
        if (leftPercent + widthPercent > 100) {
          widthPercent = 100 - leftPercent;
        }
      }
      
      return {
        ...slot,
        widthPercent: Math.max(widthPercent - 2, 20), // Leave 2% margin, minimum 20%
        leftPercent: leftPercent + 1, // 1% left margin
        zIndex: Math.min(10 + columnIndex, 20), // Ensure proper layering, max z-20
        totalOverlapping,
        height: getSlotHeight(slot), // Add height for content filtering
        durationMinutes: slot.endMinutes - slot.startMinutes // Add duration in minutes
      };
    });
    
    return positionedSlots;
  };

  const getSlotHeight = (slot: TimeSlot) => {
    // Parse time whether it's in 12-hour or 24-hour format
    const parseTime = (timeStr: string) => {
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // 12-hour format
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        return { hour: hour24, minute: minutes || 0 };
      } else {
        // 24-hour format
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hour: hours, minute: minutes || 0 };
      }
    };
    
    const startTime = parseTime(slot.startTime);
    const endTime = parseTime(slot.endTime);
    
    // Calculate total minutes for start and end times
    const startMinutes = startTime.hour * 60 + startTime.minute;
    const endMinutes = endTime.hour * 60 + endTime.minute;
    
    // Calculate duration in minutes
    const durationMinutes = endMinutes - startMinutes;
    
    // Convert to pixels (80px per hour = 80px per 60 minutes)
    const heightInPixels = (durationMinutes / 60) * 80;
    
    // Ensure minimum height of 30px for usability as per TimeTable specification
    return Math.max(heightInPixels, 30);
  };

  const getSlotTop = (slot: TimeSlot) => {
    // Parse time whether it's in 12-hour or 24-hour format
    const parseTime = (timeStr: string) => {
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // 12-hour format
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        return { hour: hour24, minute: minutes || 0 };
      } else {
        // 24-hour format
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hour: hours, minute: minutes || 0 };
      }
    };
    
    const startTime = parseTime(slot.startTime);
    const baseHour = 7; // Starting from 7 AM
    
    // Calculate total minutes from the base time (7:00 AM)
    const baseMinutes = baseHour * 60; // 7:00 AM in minutes
    const slotStartMinutes = startTime.hour * 60 + startTime.minute;
    
    // Calculate offset from base in minutes
    const offsetMinutes = slotStartMinutes - baseMinutes;
    
    // Convert to pixels (80px per hour = 80px per 60 minutes)
    const topInPixels = (offsetMinutes / 60) * 80;
    
    return Math.max(topInPixels, 0); // Ensure non-negative positioning
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl relative z-10">
        <CardHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-800 mb-2">TimeTable Manager</CardTitle>
              <p className="text-gray-600">Create and customize your class schedule</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={syncToCalendar}
                className="bg-green-500 hover:bg-green-600 text-white rounded-2xl px-4"
              >
                <Clock className="w-4 h-4 mr-2" />
                Sync to Calendar
              </Button>
              <Button
                onClick={() => setShowAddSlotModal(true)}
                className="bg-black hover:bg-gray-800 text-white rounded-2xl px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-2xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-auto max-h-[calc(95vh-120px)]">
          <div className="min-w-[800px]">
            {/* Timetable Grid */}
            <div className="grid grid-cols-8 border-b bg-gray-50">
              <div className="p-4 border-r font-semibold text-gray-700">Time</div>
              {days.map((day, index) => (
                <div key={day} className="p-4 border-r font-semibold text-gray-700 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            <div className="relative grid grid-cols-8">
              {/* Time column */}
              <div className="border-r bg-gray-50">
                {timeSlotHours.map(hour => (
                  <div
                    key={hour}
                    className="h-20 border-b flex items-center justify-center text-sm text-gray-600 font-medium"
                  >
                    {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, dayIndex) => (
                <div key={day} className="relative border-r">
                  {timeSlotHours.map(hour => (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="h-20 border-b hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setNewSlot(prev => ({
                          ...prev,
                          day: dayIndex,
                          startTime: convertTo12Hour(`${hour.toString().padStart(2, '0')}:00`),
                          endTime: convertTo12Hour(`${(hour + 1).toString().padStart(2, '0')}:00`)
                        }));
                        setShowAddSlotModal(true);
                      }}
                    />
                  ))}
                  
                  {/* Render time slots with advanced overlap handling */}
                  {calculateSlotPositions(dayIndex).map((slot) => (
                    <div
                      key={slot.id}
                      className={`absolute ${slot.color} text-white rounded-2xl p-2 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01] border border-white/20 overflow-hidden group`}
                      style={{
                        top: `${slot.top}px`,
                        height: `${slot.height}px`,
                        left: `${slot.leftPercent}%`,
                        width: `${slot.widthPercent}%`,
                        zIndex: slot.zIndex
                      }}
                      onClick={() => editTimeSlot(slot)}
                      onMouseEnter={(e) => {
                        // Clear any existing timeout
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                        }
                        
                        // Show tooltip immediately for testing
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredSlot({
                          slot,
                          position: { x: rect.right + 10, y: rect.top + rect.height / 2 }
                        });
                      }}
                      onMouseLeave={() => {
                        // Clear timeout and hide tooltip
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                        setHoveredSlot(null);
                      }}
                    >
                      <div className="h-full flex flex-col justify-between relative">
                        <div className="flex-1 min-h-0">
                          {/* Always show course name */}
                          <div 
                            className={`font-bold leading-tight truncate ${
                              slot.durationMinutes <= 30 ? 'text-xs' : slot.durationMinutes <= 60 ? 'text-sm mb-0' : 'text-sm mb-1'
                            }`} 
                            title={slot.courseName}
                          >
                            {slot.courseName}
                          </div>
                          
                          {/* Show instructor only for classes longer than 30 minutes */}
                          {slot.durationMinutes > 30 && (
                            <div className="text-xs opacity-90 mb-1 truncate" title={slot.instructor}>
                              {slot.instructor}
                            </div>
                          )}
                          
                          {/* Show location only for classes longer than 1 hour */}
                          {slot.durationMinutes > 60 && (
                            <div className="text-xs opacity-80 flex items-center gap-1 truncate" title={slot.location}>
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{slot.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Show time based on duration - only for classes longer than 30 minutes */}
                        {slot.durationMinutes > 30 && (
                          <div className="text-xs opacity-90 font-medium truncate">
                            {slot.durationMinutes <= 60 
                              ? convertTo12Hour(slot.startTime).replace(' AM', '').replace(' PM', '') // Just time for short classes
                              : `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}` // Full range for longer classes
                            }
                          </div>
                        )}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTimeSlot(slot.id);
                            }}
                            className="h-5 w-5 p-0 text-white hover:bg-white/20 rounded-full"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Add/Edit Slot Modal */}
        {showAddSlotModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl relative z-[101]">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingSlot ? 'Edit Class' : 'Add New Class'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Course
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCourseDropdown(!showCourseDropdown);
                        setShowDayDropdown(false);
                        setShowStartTimeDropdown(false);
                        setShowEndTimeDropdown(false);
                        setShowTypeDropdown(false);
                      }}
                      className="w-full text-left bg-transparent border border-gray-200 rounded-2xl px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {newSlot.courseId && courses.find(c => c.id === newSlot.courseId) 
                        ? courses.find(c => c.id === newSlot.courseId)?.title 
                        : "Select a course"}
                    </button>
                    {showCourseDropdown && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-[110] max-h-48 overflow-y-auto scrollbar-hide"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewSlot(prev => ({
                              ...prev,
                              courseId: "",
                              courseName: "",
                              instructor: ""
                            }));
                            setShowCourseDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl text-gray-500"
                        >
                          None selected
                        </button>
                        {courses.map(course => (
                          <button
                            key={course.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewSlot(prev => ({
                                ...prev,
                                courseId: course.id,
                                courseName: course.title,
                                instructor: course.instructor
                              }));
                              setShowCourseDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors last:rounded-b-xl block"
                          >
                            {course.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Custom Course Name
                  </label>
                  <input
                    type="text"
                    value={newSlot.courseName}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, courseName: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter course name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Instructor
                    </label>
                    <input
                      type="text"
                      value={newSlot.instructor}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, instructor: e.target.value }))}
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Instructor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newSlot.location}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Room"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Day
                    </label>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDayDropdown(!showDayDropdown);
                          setShowCourseDropdown(false);
                          setShowStartTimeDropdown(false);
                          setShowEndTimeDropdown(false);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full text-left bg-transparent border border-gray-200 rounded-2xl px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        {days[newSlot.day]?.slice(0, 3) || "Day"}
                      </button>
                      {showDayDropdown && (
                        <div 
                          className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-[110] max-h-48 overflow-y-auto scrollbar-hide"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {days.map((day, index) => (
                            <button
                              key={day}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewSlot(prev => ({ ...prev, day: index }));
                                setShowDayDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl block"
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Start
                    </label>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStartTimeDropdown(!showStartTimeDropdown);
                          setShowCourseDropdown(false);
                          setShowDayDropdown(false);
                          setShowEndTimeDropdown(false);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full text-left bg-transparent border border-gray-200 rounded-2xl px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        {newSlot.startTime || "Start time"}
                      </button>
                      {showStartTimeDropdown && (
                        <div 
                          className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-[110] max-h-48 overflow-y-auto scrollbar-hide"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {timeOptions.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewSlot(prev => ({ ...prev, startTime: time }));
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      End
                    </label>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEndTimeDropdown(!showEndTimeDropdown);
                          setShowCourseDropdown(false);
                          setShowDayDropdown(false);
                          setShowStartTimeDropdown(false);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full text-left bg-transparent border border-gray-200 rounded-2xl px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        {newSlot.endTime || "End time"}
                      </button>
                      {showEndTimeDropdown && (
                        <div 
                          className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-[110] max-h-48 overflow-y-auto scrollbar-hide"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {timeOptions.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewSlot(prev => ({ ...prev, endTime: time }));
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Type
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTypeDropdown(!showTypeDropdown);
                        setShowCourseDropdown(false);
                        setShowDayDropdown(false);
                        setShowStartTimeDropdown(false);
                        setShowEndTimeDropdown(false);
                      }}
                      className="w-full text-left bg-transparent border border-gray-200 rounded-2xl px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {typeOptions.find(option => option.value === newSlot.type)?.label || "Select type"}
                    </button>
                    {showTypeDropdown && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-[110] max-h-48 overflow-y-auto scrollbar-hide"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {typeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewSlot(prev => ({ ...prev, type: option.value as any }));
                              setShowTypeDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl block"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddSlotModal(false);
                    setEditingSlot(null);
                    setNewSlot({
                      courseId: "",
                      courseName: "",
                      instructor: "",
                      location: "",
                      day: 0,
                      startTime: "9:00 AM",
                      endTime: "10:00 AM",
                      type: "lecture"
                    });
                  }}
                  className="flex-1 rounded-2xl text-gray-600 hover:bg-gray-100 h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTimeSlot}
                  disabled={!newSlot.courseName.trim()}
                  className="flex-1 bg-black hover:bg-gray-800 text-white rounded-2xl h-9 disabled:bg-gray-300"
                >
                  {editingSlot ? 'Update' : 'Add'} Class
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Enhanced Hover Tooltip for All Class Boxes */}
      {hoveredSlot && (
        <div 
          className="fixed bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-4 text-sm max-w-xs pointer-events-none"
          style={{
            left: hoveredSlot.position.x,
            top: hoveredSlot.position.y,
            zIndex: 99999,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="space-y-2">
            <div className="font-bold text-gray-800">{hoveredSlot.slot.courseName}</div>
            <div className="text-gray-600">
              <div>👨‍🏫 {hoveredSlot.slot.instructor || 'No instructor'}</div>
              <div>📍 {hoveredSlot.slot.location || 'No location'}</div>
              <div>⏰ {convertTo12Hour(hoveredSlot.slot.startTime)} - {convertTo12Hour(hoveredSlot.slot.endTime)}</div>
              <div>📚 {hoveredSlot.slot.type}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTable;