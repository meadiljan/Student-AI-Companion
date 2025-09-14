import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { 
  Plus, 
  Calendar, 
  Clock, 
  Flag, 
  Search, 
  Filter,
  ChevronRight,
  CheckCircle2,
  Circle,
  Star,
  Trash2,
  X,
  ChevronDown,
  CalendarIcon as CalendarLucide
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssignments, Assignment } from "@/contexts/AssignmentsContext";

const Assignments = () => {
  const { 
    assignments, 
    addAssignment, 
    updateAssignment, 
    deleteAssignment, 
    toggleCompleted, 
    toggleStarred 
  } = useAssignments();
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "completed" | "overdue" | "starred">("all");
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "medium" as "low" | "medium" | "high",
    course: "",
  });

  // Calendar and time picker states (matching calendar component)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Refs for dropdown elements
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  // Generate time options exactly like calendar
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
    };

    if (showDatePicker || showTimeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker, showTimeDropdown]);

  // Helper function to format date as YYYY-MM-DD without timezone conversion
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calendar grid generation (matching calendar component)
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
      const isSelected = newAssignment.dueDate === dateString;
      
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

  const toggleComplete = (id: string) => {
    toggleCompleted(id);
  };

  const toggleStar = (id: string) => {
    toggleStarred(id);
  };

  const deleteAssignmentById = (id: string) => {
    deleteAssignment(id);
  };

  const addNewAssignment = () => {
    if (!newAssignment.title.trim()) return;

    const assignmentData = {
      title: newAssignment.title,
      description: newAssignment.description,
      dueDate: newAssignment.dueDate,
      dueTime: newAssignment.dueTime,
      priority: newAssignment.priority,
      status: "pending" as const,
      course: newAssignment.course,
      tags: [],
      completed: false,
      starred: false,
    };

    addAssignment(assignmentData);
    setNewAssignment({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      priority: "medium",
      course: "",
    });
    setShowNewAssignment(false);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.course.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === "all" || 
                         (selectedFilter === "pending" && assignment.status === "pending") ||
                         (selectedFilter === "completed" && assignment.completed) ||
                         (selectedFilter === "overdue" && assignment.status === "overdue") ||
                         (selectedFilter === "starred" && assignment.starred);
    
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string, completed: boolean) => {
    if (completed) return { color: "bg-green-100 text-green-700 border-green-200", text: "Completed" };
    
    switch (status) {
      case "in-progress": return { color: "bg-blue-100 text-blue-700 border-blue-200", text: "In Progress" };
      case "pending": return { color: "bg-gray-100 text-gray-700 border-gray-200", text: "Pending" };
      case "overdue": return { color: "bg-red-100 text-red-700 border-red-200", text: "Overdue" };
      default: return { color: "bg-gray-100 text-gray-700 border-gray-200", text: "Unknown" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-2">
              {filteredAssignments.length} {filteredAssignments.length === 1 ? 'assignment' : 'assignments'}
            </p>
          </div>
          <Button 
            onClick={() => setShowNewAssignment(!showNewAssignment)}
            className="bg-black hover:bg-gray-800 text-white rounded-2xl h-12 px-6 font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Assignment
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl border-0 bg-muted focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {["all", "pending", "completed", "overdue", "starred"].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedFilter(filter as any)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-medium capitalize",
                  selectedFilter === filter 
                    ? "bg-black text-white hover:bg-gray-800" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const statusBadge = getStatusBadge(assignment.status, assignment.completed);
              
              return (
                <Card key={assignment.id} className="rounded-3xl shadow-sm border-0 bg-white hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleComplete(assignment.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {assignment.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Priority indicator */}
                              <div className={cn("w-3 h-3 rounded-full", getPriorityColor(assignment.priority))} />
                              
                              <h3 className={cn(
                                "text-lg font-semibold text-foreground",
                                assignment.completed && "line-through text-muted-foreground"
                              )}>
                                {assignment.title}
                              </h3>
                              
                              {assignment.starred && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            
                            {assignment.description && (
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                {assignment.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(assignment.dueDate)}</span>
                              </div>
                              
                              {assignment.dueTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{assignment.dueTime}</span>
                                </div>
                              )}
                              
                              <Badge variant="outline" className="text-xs">
                                {assignment.course}
                              </Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs", statusBadge.color)}>
                              {statusBadge.text}
                            </Badge>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStar(assignment.id)}
                              className="p-2 rounded-xl"
                            >
                              <Star className={cn(
                                "w-4 h-4",
                                assignment.starred ? "text-yellow-500 fill-current" : "text-gray-400"
                              )} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAssignmentById(assignment.id)}
                              className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No assignments found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search terms" : "Create your first assignment to get started"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Apple-Style New Assignment Modal (Matching Calendar) */}
      {showNewAssignment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Create New Assignment</h2>
              <button
                onClick={() => setShowNewAssignment(false)}
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
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Course</label>
                  <Input
                    placeholder="Enter course name"
                    value={newAssignment.course}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, course: e.target.value }))}
                    className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent h-12"
                  />
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  placeholder="Add assignment description (optional)"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              
              {/* Date and Time (Exactly like Calendar) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date Picker (Matching Calendar) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Due Date</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent text-left bg-white flex items-center justify-between"
                    >
                      <span className={newAssignment.dueDate ? "text-gray-900" : "text-gray-500"}>
                        {newAssignment.dueDate ? new Date(newAssignment.dueDate).toLocaleDateString('en-US', { 
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
                                  setNewAssignment({...newAssignment, dueDate: day.dateString});
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

                {/* Due Time Picker (Matching Calendar) */}
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
                      <span className={newAssignment.dueTime ? "text-gray-900" : "text-gray-500"}>
                        {newAssignment.dueTime || "Select time"}
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
                              setNewAssignment({...newAssignment, dueTime: time});
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-between text-left font-normal rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-white/90 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <div className="flex items-center">
                        <div className={cn(
                          "w-3 h-3 rounded-full mr-2",
                          newAssignment.priority === "high" && "bg-red-500",
                          newAssignment.priority === "medium" && "bg-yellow-500",
                          newAssignment.priority === "low" && "bg-green-500"
                        )} />
                        <span className="capitalize">
                          {newAssignment.priority === "high" && "High Priority"}
                          {newAssignment.priority === "medium" && "Medium Priority"}
                          {newAssignment.priority === "low" && "Low Priority"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0 bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl" align="start">
                    <div className="p-2">
                      {["high", "medium", "low"].map((priority) => (
                        <button
                          key={priority}
                          onClick={() => {
                            setNewAssignment(prev => ({ ...prev, priority: priority as any }));
                          }}
                          className={cn(
                            "w-full flex items-center px-3 py-2 rounded-2xl text-left hover:bg-gray-100 transition-colors",
                            newAssignment.priority === priority && "bg-black text-white hover:bg-gray-800"
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded-full mr-3",
                            priority === "high" && "bg-red-500",
                            priority === "medium" && "bg-yellow-500",
                            priority === "low" && "bg-green-500"
                          )} />
                          <span className="capitalize">{priority} Priority</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewAssignment(false)}
                  className="rounded-2xl px-6 py-3 h-12 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addNewAssignment}
                  disabled={!newAssignment.title.trim()}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-2xl px-6 py-3 h-12 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
