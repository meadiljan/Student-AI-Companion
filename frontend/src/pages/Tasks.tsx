import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, isBefore } from "date-fns";
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
  CalendarIcon as CalendarLucide,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/contexts/TasksContext";
import { useCourses } from "@/contexts/CoursesContext";
import TaskDetailModal from "@/components/TaskDetailModal";
import TaskEditModal from "@/components/TaskEditModal";

const Tasks = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleCompleted, 
    toggleStarred 
  } = useTasks();
  const { courses } = useCourses();
  const [showNewTask, setShowNewTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "upcoming" | "completed" | "overdue" | "starred">("all");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "medium" as "low" | "medium" | "high",
    course: "",
  });

  // States for detail and edit modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Calendar and time picker states (matching calendar component)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Refs for dropdown elements
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

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

  // Helper function to check if a task is overdue considering both date and time
  const isTaskOverdue = (dueDate: string, dueTime?: string) => {
    try {
      const date = parseISO(dueDate);
      const now = new Date();
      
      if (isToday(date)) {
        // For today's tasks, check the time as well
        if (dueTime) {
          // Parse the time and combine with today's date
          const timeMatch = dueTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (timeMatch) {
            let [, hours, minutes, period] = timeMatch;
            let hour24 = parseInt(hours);
            
            // Convert to 24-hour format
            if (period.toUpperCase() === 'PM' && hour24 !== 12) {
              hour24 += 12;
            } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
              hour24 = 0;
            }
            
            const taskDateTime = new Date(date);
            taskDateTime.setHours(hour24, parseInt(minutes), 0, 0);
            
            return isBefore(taskDateTime, now);
          }
        }
        // If no time specified for today's task, it's not overdue
        return false;
      } else {
        // For past dates (not today), it's overdue regardless of time
        return isPast(date);
      }
    } catch {
      return false;
    }
  };

  // Helper function to get dynamic display status
  const getDynamicStatus = (task: Task) => {
    if (task.completed) {
      return "completed";
    }
    
    if (isTaskOverdue(task.dueDate, task.dueTime)) {
      return "overdue";
    }
    
    return "upcoming";
  };

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
      const isSelected = newTask.dueDate === dateString;
      
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

  const deleteTaskById = (id: string) => {
    deleteTask(id);
  };

  const addNewTask = () => {
    if (!newTask.title.trim()) return;

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate,
      dueTime: newTask.dueTime,
      priority: newTask.priority,
      status: "in-progress" as const,
      course: newTask.course,
      tags: [],
      completed: false,
      starred: false,
    };

    addTask(taskData);
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      priority: "medium",
      course: "",
    });
    setShowNewTask(false);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.course.toLowerCase().includes(searchQuery.toLowerCase());
    
    const dynamicStatus = getDynamicStatus(task);
    const matchesFilter = selectedFilter === "all" || 
                         (selectedFilter === "upcoming" && dynamicStatus === "upcoming") ||
                         (selectedFilter === "completed" && dynamicStatus === "completed") ||
                         (selectedFilter === "overdue" && dynamicStatus === "overdue") ||
                         (selectedFilter === "starred" && task.starred);
    
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

  const getStatusBadge = (task: Task) => {
    const dynamicStatus = getDynamicStatus(task);
    
    switch (dynamicStatus) {
      case "completed": return { color: "bg-green-100 text-green-700 border-green-200", text: "Completed" };
      case "overdue": return { color: "bg-red-100 text-red-700 border-red-200", text: "Overdue" };
      case "upcoming": return { color: "bg-blue-100 text-blue-700 border-blue-200", text: "Upcoming" };
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

  // Handle opening task detail
  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  // Handle closing task detail
  const handleCloseTaskDetail = () => {
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  };

  // Handle edit from detail modal
  const handleEditFromDetail = (task: Task) => {
    setEditingTask(task);
    setIsTaskEditOpen(true);
    handleCloseTaskDetail();
  };

  // Handle delete from detail modal
  const handleDeleteFromDetail = (id: string) => {
    deleteTaskById(id);
    handleCloseTaskDetail();
  };

  // Handle star toggle from detail modal
  const handleToggleStarFromDetail = (id: string) => {
    toggleStar(id);
    // Update the selected task if it's the one being starred
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, starred: !selectedTask.starred });
    }
  };

  // Handle complete toggle from detail modal
  const handleToggleCompleteFromDetail = (id: string) => {
    toggleComplete(id);
    // Update the selected task if it's the one being completed
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ 
        ...selectedTask, 
        completed: !selectedTask.completed,
        status: !selectedTask.completed ? "completed" : "in-progress"
      });
    }
  };

  // Handle updating task
  const handleUpdateTask = (taskData: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: "low" | "medium" | "high";
    course: string;
  }) => {
    if (!editingTask) return;
    
    updateTask(editingTask.id, {
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      dueTime: taskData.dueTime,
      priority: taskData.priority,
      course: taskData.course
    });
    
    setEditingTask(null);
    setIsTaskEditOpen(false);
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-2">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingTask(null);
              setShowNewTask(!showNewTask);
            }}
            className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl border-0 bg-muted focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {["all", "upcoming", "completed", "overdue", "starred"].map((filter) => (
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

      {/* Tasks List */}
      <div className="flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const statusBadge = getStatusBadge(task);
              
              return (
                <Card 
                  key={task.id} 
                  className="rounded-3xl shadow-sm border-0 bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleOpenTaskDetail(task)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(task.id);
                        }}
                        className="mt-1 flex-shrink-0"
                      >
                        {task.completed ? (
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
                              <div className={cn("w-3 h-3 rounded-full", getPriorityColor(task.priority))} />
                              
                              <h3 className={cn(
                                "text-lg font-semibold text-foreground",
                                task.completed && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </h3>
                              
                              {task.starred && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            
                            {task.description && (
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                              
                              {task.dueTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{task.dueTime}</span>
                                </div>
                              )}
                              
                              <Badge variant="outline" className="text-xs">
                                {(() => {
                                  const course = courses.find(c => c.title === task.course || c.id === task.course);
                                  return course ? course.title : task.course;
                                })()}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(task.id);
                              }}
                              className="p-2 rounded-xl"
                            >
                              <Star className={cn(
                                "w-4 h-4",
                                task.starred ? "text-yellow-500 fill-current" : "text-gray-400"
                              )} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTaskDetail(task);
                              }}
                              className="p-2 rounded-xl"
                            >
                              <Edit3 className="w-4 h-4 text-gray-400" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTaskById(task.id);
                              }}
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

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search terms" : "Create your first task to get started"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Apple-Style New Task Modal (Matching Calendar) */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Create New Task</h2>
              <button
                onClick={() => setShowNewTask(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Title and Course */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Task Title</label>
                  <Input
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
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
                      <span className={newTask.course ? "text-gray-900" : "text-gray-500"}>
                        {newTask.course || "Select course"}
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
                            courses.map((course) => (
                              <button
                                key={course.id}
                                type="button"
                                onClick={() => {
                                  setNewTask(prev => ({ ...prev, course: course.title }));
                                  setShowCourseDropdown(false);
                                }}
                                className={cn(
                                  "w-full flex items-center px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 transition-colors",
                                  newTask.course === course.title && "bg-black text-white hover:bg-gray-800"
                                )}
                              >
                                <div className={cn("w-3 h-3 rounded-full mr-3", course.color)} />
                                <div className="flex-1">
                                  <div className="font-medium">{course.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{course.instructor}</div>
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
                  placeholder="Add task description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
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
                      <span className={newTask.dueDate ? "text-gray-900" : "text-gray-500"}>
                        {newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString('en-US', { 
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
                                  setNewTask({...newTask, dueDate: day.dateString});
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
                      <span className={newTask.dueTime ? "text-gray-900" : "text-gray-500"}>
                        {newTask.dueTime || "Select time"}
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
                              setNewTask({...newTask, dueTime: time});
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
                      onClick={() => setNewTask(prev => ({ ...prev, priority: priorityLevel as any }))}
                      className={cn(
                        "flex-1 flex items-center justify-center px-4 py-3 rounded-2xl border transition-colors",
                        newTask.priority === priorityLevel 
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
                  onClick={() => setShowNewTask(false)}
                  className="rounded-2xl px-6 py-3 h-12 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addNewTask}
                  disabled={!newTask.title.trim()}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-2xl px-6 py-3 h-12 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {isTaskDetailOpen && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isTaskDetailOpen}
          onClose={handleCloseTaskDetail}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteFromDetail}
          onToggleStar={handleToggleStarFromDetail}
          onToggleComplete={handleToggleCompleteFromDetail}
        />
      )}

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={isTaskEditOpen}
        onClose={() => {
          setIsTaskEditOpen(false);
          setEditingTask(null);
        }}
        onSave={handleUpdateTask}
        initialData={editingTask ? {
          title: editingTask.title,
          description: editingTask.description || "",
          dueDate: editingTask.dueDate,
          dueTime: editingTask.dueTime || "",
          priority: editingTask.priority,
          course: editingTask.course
        } : undefined}
      />
    </div>
  );
};

export default Tasks;