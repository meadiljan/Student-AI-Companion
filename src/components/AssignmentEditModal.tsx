import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Flag,
  ChevronDown
} from "lucide-react";
import { useCourses } from "@/contexts/CoursesContext";
import { Assignment } from "@/contexts/AssignmentsContext";
import { cn } from "@/lib/utils";

interface AssignmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignmentData: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: "low" | "medium" | "high";
    course: string;
  }) => void;
  initialData?: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: "low" | "medium" | "high";
    course: string;
  };
}

const AssignmentEditModal = ({
  isOpen,
  onClose,
  onSave,
  initialData
}: AssignmentEditModalProps) => {
  const { courses } = useCourses();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [course, setCourse] = useState("");
  
  // Calendar and time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Refs for dropdown elements
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Update state when initialData changes
  useEffect(() => {
    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
    setDueDate(initialData?.dueDate || "");
    setDueTime(initialData?.dueTime || "");
    setPriority(initialData?.priority || "medium");
    setCourse(initialData?.course || "");
  }, [initialData]);

  // Generate time options
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside date picker
      if (showDatePicker && datePickerRef.current && 
          !datePickerRef.current.contains(target)) {
        setShowDatePicker(false);
      }
      
      // Check if click is outside time dropdown
      if (showTimeDropdown && timeDropdownRef.current && 
          !timeDropdownRef.current.contains(target)) {
        setShowTimeDropdown(false);
      }
      
      // Check if click is outside course dropdown
      if (showCourseDropdown && courseDropdownRef.current && 
          !courseDropdownRef.current.contains(target)) {
        setShowCourseDropdown(false);
      }
    };

    if (showDatePicker || showTimeDropdown || showCourseDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker, showTimeDropdown, showCourseDropdown]);

  // Helper function to format date as YYYY-MM-DD without timezone conversion
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calendar grid generation
  const generateCalendarGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const weeks = [];
    let currentWeek = [];
    
    // Add previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const dayDate = new Date(year, month - 1, day);
      currentWeek.push({
        date: dayDate,
        dateString: formatDateString(dayDate),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const today = new Date();
      const isToday = currentDate.toDateString() === today.toDateString();
      const dateString = formatDateString(currentDate);
      const isSelected = dueDate === dateString;
      
      currentWeek.push({
        date: currentDate,
        dateString: dateString,
        isCurrentMonth: true,
        isToday,
        isSelected
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add next month's days
    if (currentWeek.length > 0) {
      const remaining = 7 - currentWeek.length;
      for (let day = 1; day <= remaining; day++) {
        const dayDate = new Date(year, month + 1, day);
        currentWeek.push({
          date: dayDate,
          dateString: formatDateString(dayDate),
          isCurrentMonth: false,
          isToday: false,
          isSelected: false
        });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const handleClose = () => {
    // Reset form fields
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    setPriority("medium");
    setCourse("");
    
    onClose();
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title,
      description,
      dueDate,
      dueTime,
      priority,
      course
    });
    
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">
            {initialData ? "Edit Assignment" : "Create New Assignment"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Title and Course */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Assignment Title</label>
              <Input
                placeholder="Enter assignment title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Course</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent text-left bg-white/80 backdrop-blur-sm hover:bg-white/90 flex items-center justify-between"
                >
                  <span className={course ? "text-gray-900" : "text-gray-500"}>
                    {course || "Select course"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showCourseDropdown && (
                  <div 
                    ref={courseDropdownRef}
                    className="absolute z-50 mt-1 w-full bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-48 overflow-y-auto scrollbar-hide"
                  >
                    <div className="p-2">
                      {courses.length > 0 ? (
                        courses.map((courseItem) => (
                          <button
                            key={courseItem.id}
                            type="button"
                            onClick={() => {
                              setCourse(courseItem.title);
                              setShowCourseDropdown(false);
                            }}
                            className={cn(
                              "w-full flex items-center px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 transition-colors",
                              course === courseItem.title && "bg-black text-white hover:bg-gray-800"
                            )}
                          >
                            <div className={cn("w-3 h-3 rounded-full mr-3", courseItem.color)} />
                            <div className="flex-1">
                              <div className="font-medium">{courseItem.title}</div>
                              <div className="text-xs text-gray-500 truncate">{courseItem.instructor}</div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2.5 text-sm text-gray-500 text-center">
                          No courses available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea
              placeholder="Add assignment description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent text-left bg-white flex items-center justify-between"
                >
                  <span className={dueDate ? "text-gray-900" : "text-gray-500"}>
                    {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : "Select date"}
                  </span>
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
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
                        <ChevronDown className="w-5 h-5 text-gray-600 rotate-90" />
                      </button>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <ChevronDown className="w-5 h-5 text-gray-600 -rotate-90" />
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
                              setDueDate(day.dateString);
                              setShowDatePicker(false);
                            }}
                            className={cn(
                              "p-2 text-sm rounded-xl transition-all duration-200 hover:bg-gray-100",
                              day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300',
                              day.isToday ? 'bg-black text-white hover:bg-gray-800' : '',
                              day.isSelected ? 'bg-gray-100 text-black ring-2 ring-black' : ''
                            )}
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

            {/* Due Time Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Due Time</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTimeDropdown(!showTimeDropdown);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent text-left bg-white flex items-center justify-between"
                >
                  <span className={dueTime ? "text-gray-900" : "text-gray-500"}>
                    {dueTime || "Select time"}
                  </span>
                  <Clock className="w-5 h-5 text-gray-400" />
                </button>
                {showTimeDropdown && (
                  <div 
                    ref={timeDropdownRef}
                    className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {timeOptions.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDueTime(time);
                          setShowTimeDropdown(false);
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

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <div className="flex gap-2">
              {["low", "medium", "high"].map((priorityLevel) => (
                <button
                  key={priorityLevel}
                  onClick={() => setPriority(priorityLevel as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center px-4 py-3 rounded-2xl border transition-colors",
                    priority === priorityLevel 
                      ? "border-black bg-black text-white" 
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full mr-2",
                    priorityLevel === "high" && "bg-red-500",
                    priorityLevel === "medium" && "bg-yellow-500",
                    priorityLevel === "low" && "bg-green-500"
                  )} />
                  <span className="capitalize">
                    {priorityLevel} Priority
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="rounded-2xl px-6 py-3 h-12 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-2xl px-6 py-3 h-12 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              {initialData ? "Update Assignment" : "Create Assignment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentEditModal;