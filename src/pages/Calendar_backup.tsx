import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
  time?: string;
}

type CalendarView = "month" | "week" | "today";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    color: "bg-blue-500"
  });
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 1, title: "Team Meeting", date: new Date(2025, 8, 13), color: "bg-blue-500", time: "09:00 AM" },
    { id: 2, title: "Project Review", date: new Date(2025, 8, 13), color: "bg-green-500", time: "02:00 PM" },
    { id: 3, title: "Workshop", date: new Date(2025, 8, 14), color: "bg-yellow-500", time: "10:00 AM" },
    { id: 4, title: "Presentation", date: new Date(2025, 8, 15), color: "bg-purple-500", time: "03:00 PM" },
    { id: 5, title: "Meeting", date: new Date(2025, 8, 16), color: "bg-pink-500", time: "11:00 AM" },
    { id: 6, title: "Deadline", date: new Date(2025, 8, 18), color: "bg-red-500", time: "05:00 PM" },
  ]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddEvent = () => {
    setShowAddEventModal(true);
    // Set default date to current date
    setNewEvent(prev => ({
      ...prev,
      date: currentDate.toISOString().split('T')[0]
    }));
  };

  const submitEvent = () => {
    if (newEvent.title && newEvent.date) {
      const eventDate = new Date(newEvent.date);
      const event: CalendarEvent = {
        id: events.length + 1,
        title: newEvent.title,
        date: eventDate,
        color: newEvent.color,
        time: newEvent.time
      };
      setEvents([...events, event]);
      setNewEvent({ title: "", date: "", time: "", color: "bg-blue-500" });
      setShowAddEventModal(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
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
    setShowDateModal(true);
  };

  const renderSelectedDateView = (date: Date) => {
    const dateEvents = getEventsForDate(date);
    
    // Convert our events to timeline format with times
    const timelineEvents = dateEvents.map(event => ({
      ...event,
      start: new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate(), 
        parseInt(event.time?.split(':')[0] || '9'), 
        parseInt(event.time?.split(':')[1]?.split(' ')[0] || '0')
      ),
      end: new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate(), 
        parseInt(event.time?.split(':')[0] || '9') + 1, 
        parseInt(event.time?.split(':')[1]?.split(' ')[0] || '0')
      )
    }));

    // Timeline configuration
    const timelineStartHour = 1;
    const timelineEndHour = 24;
    const hourHeightPx = 60;
    const totalTimelineHours = timelineEndHour - timelineStartHour;

    // Generate time slots
    const timeSlots = [];
    for (let hour = timelineStartHour; hour < timelineEndHour; hour++) {
      const displayHour = hour === 24 ? 0 : hour;
      timeSlots.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), displayHour, 0));
    }

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
        
        {/* Timeline View */}
        <div className="relative bg-gray-50 rounded-2xl p-4">
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

            {/* Events */}
            {timelineEvents.map((event) => {
              const startMinutesFromTimelineStart = (event.start.getHours() - timelineStartHour) * 60 + event.start.getMinutes();
              const durationMinutes = 60;
              
              const top = (startMinutesFromTimelineStart / 60) * hourHeightPx;
              const height = (durationMinutes / 60) * hourHeightPx;

              if (event.start.getHours() >= timelineStartHour && event.start.getHours() < timelineEndHour) {
                return (
                  <div
                    key={event.id}
                    className={`absolute left-16 right-0 rounded-xl p-3 text-white overflow-hidden ${event.color}`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs opacity-90">
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
              }
              return null;
            })}

            {/* Current time indicator */}
            {currentTimeTop !== null && isSelectedDay && currentTime.getHours() >= timelineStartHour && currentTime.getHours() < timelineEndHour && (
              <div
                className="absolute col-start-2 col-end-3 w-full z-20 flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" />
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
      </div>
    );
  };

  const renderTodayView = () => {
    const today = new Date();
    const todayEvents = getEventsForDate(today);
    
    // Convert our events to timeline format with times
    const timelineEvents = todayEvents.map(event => ({
      ...event,
      start: new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate(), 
        parseInt(event.time?.split(':')[0] || '9'), 
        parseInt(event.time?.split(':')[1]?.split(' ')[0] || '0')
      ),
      end: new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate(), 
        parseInt(event.time?.split(':')[0] || '9') + 1, 
        parseInt(event.time?.split(':')[1]?.split(' ')[0] || '0')
      )
    }));

    // Timeline configuration
    const timelineStartHour = 1;
    const timelineEndHour = 24; // This will show 1 AM to 11 PM (23 hours)
    const hourHeightPx = 60;
    const totalTimelineHours = timelineEndHour - timelineStartHour;

    // Generate time slots
    const timeSlots = [];
    for (let hour = timelineStartHour; hour < timelineEndHour; hour++) {
      // Handle 24-hour to 12-hour conversion properly
      const displayHour = hour === 24 ? 0 : hour; // 24 becomes 0 (midnight)
      timeSlots.push(new Date(today.getFullYear(), today.getMonth(), today.getDate(), displayHour, 0));
    }

    // Current time indicator - updates every second
    const isCurrentDay = currentTime.toDateString() === today.toDateString();
    const currentTimeTop = isCurrentDay 
      ? ((currentTime.getHours() - timelineStartHour) * 60 + currentTime.getMinutes()) * (hourHeightPx / 60)
      : null;
    
    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-2xl font-bold text-gray-800">
            {today.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        {/* Timeline View */}
        <div className="relative bg-gray-50 rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-6">Schedule</h4>
          <div 
            className="relative grid grid-cols-[auto_1fr] gap-x-6" 
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
                    className="text-right text-sm text-gray-500 pt-2 w-16 font-medium"
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

            {/* Events */}
            {timelineEvents.map((event) => {
              const startMinutesFromTimelineStart = (event.start.getHours() - timelineStartHour) * 60 + event.start.getMinutes();
              const durationMinutes = 60; // Assuming 1-hour events
              
              const top = (startMinutesFromTimelineStart / 60) * hourHeightPx;
              const height = (durationMinutes / 60) * hourHeightPx;

              if (event.start.getHours() >= timelineStartHour && event.start.getHours() < timelineEndHour) {
                return (
                  <div
                    key={event.id}
                    className={`absolute left-20 right-0 rounded-xl p-4 text-white overflow-hidden ${event.color} shadow-lg`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <p className="font-semibold text-base">{event.title}</p>
                    <p className="text-sm opacity-90">
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
              }
              return null;
            })}

            {/* Current time indicator */}
            {currentTimeTop !== null && isCurrentDay && currentTime.getHours() >= timelineStartHour && currentTime.getHours() < timelineEndHour && (
              <div
                className="absolute col-start-2 col-end-3 w-full z-20 flex items-center"
                style={{ top: `${currentTimeTop}px` }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                <div className="flex-1 h-0.5 bg-red-500" />
                <div className="bg-red-500 text-white text-sm px-3 py-1 rounded-lg ml-2 font-medium shadow-lg">
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
            <p className="text-gray-500 text-center py-12 text-lg">No events scheduled for today</p>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    
    return (
      <div className="space-y-4">
        {/* Week Header */}
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-2xl">
              <div className="text-sm text-gray-500 mb-1">
                {dayNames[index]}
              </div>
              <div className={`text-xl font-bold ${
                date.toDateString() === new Date().toDateString() 
                  ? 'text-blue-600' 
                  : 'text-gray-800'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week Events */}
        <div className="space-y-3">
          {weekDates.map((date, index) => {
            const dayEvents = events.filter(event => 
              event.date.toDateString() === date.toDateString()
            );
            
            if (dayEvents.length === 0) return null;
            
            return (
              <div key={index} className="bg-gray-50 rounded-2xl p-4">
                <p className="font-semibold text-gray-700 mb-3">
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                {dayEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl ml-4">
                    <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{event.title}</p>
                      {event.time && <p className="text-sm text-gray-500">{event.time}</p>}
                    </div>
                  </div>
                ))}
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
            {/* Event bars */}
            <div className="flex-1 space-y-1 overflow-hidden">
              {dayEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`w-full h-1.5 rounded-full ${event.color} opacity-80`}
                ></div>
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
    <Card className="w-full max-w-6xl mx-auto rounded-3xl shadow-xl">
      <CardHeader className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigateMonth("prev")}
              className="rounded-2xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-3xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
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
              onClick={handleAddEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 pt-0">
        {renderView()}
      </CardContent>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4">
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
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  {["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-red-500"].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewEvent({...newEvent, color})}
                      className={`w-8 h-8 rounded-full ${color} ${
                        newEvent.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddEventModal(false)}
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={submitEvent}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
              >
                Save Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Date Modal */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
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
    </Card>
  );
};

export default Calendar;