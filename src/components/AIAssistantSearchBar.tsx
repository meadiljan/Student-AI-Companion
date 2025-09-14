import { Plus, Mic, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { eventManager } from "@/utils/eventManager";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
  time?: string;
}

interface AIAssistantSearchBarProps {
  onCreateEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
}

// AI parsing function to extract event details from natural language
const parseEventFromQuery = (query: string): Omit<CalendarEvent, 'id'> | null => {
  const lowerQuery = query.toLowerCase();
  
  // Check if it's an event creation command
  const isEventCommand = lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('schedule');
  if (!isEventCommand) return null;

  // Extract event title
  let title = '';
  const titleMatches = [
    /(?:create|add|schedule).*?(?:event|meeting|class|appointment).*?(?:for|called|named)?\s*["']?([^"']+)["']?/i,
    /(?:create|add|schedule)\s+(?:a\s+)?(?:event|meeting|class|appointment)\s+(.+?)(?:\s+(?:at|on|for))/i,
    /(?:create|add|schedule).*?(?:event|meeting|class|appointment)\s+(.+)/i
  ];
  
  for (const pattern of titleMatches) {
    const match = query.match(pattern);
    if (match && match[1]) {
      title = match[1].trim();
      break;
    }
  }
  
  // If no specific title found, extract from context
  if (!title) {
    const words = query.split(' ');
    const eventIndex = words.findIndex(word => ['event', 'meeting', 'class', 'appointment'].includes(word.toLowerCase()));
    if (eventIndex !== -1 && eventIndex < words.length - 1) {
      title = words[eventIndex + 1];
    } else {
      title = 'New Event';
    }
  }

  // Extract date
  let date = new Date();
  const today = new Date();
  
  if (lowerQuery.includes('today')) {
    date = new Date();
  } else if (lowerQuery.includes('tomorrow')) {
    date = new Date();
    date.setDate(date.getDate() + 1);
  } else if (lowerQuery.includes('monday')) {
    date = getNextWeekday(1);
  } else if (lowerQuery.includes('tuesday')) {
    date = getNextWeekday(2);
  } else if (lowerQuery.includes('wednesday')) {
    date = getNextWeekday(3);
  } else if (lowerQuery.includes('thursday')) {
    date = getNextWeekday(4);
  } else if (lowerQuery.includes('friday')) {
    date = getNextWeekday(5);
  } else if (lowerQuery.includes('saturday')) {
    date = getNextWeekday(6);
  } else if (lowerQuery.includes('sunday')) {
    date = getNextWeekday(0);
  }

  // Extract time
  let time = '';
  const timePatterns = [
    /(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
    /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    /at\s+(\d{1,2})\s*(am|pm)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = query.match(pattern);
    if (match) {
      const hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const period = match[3] ? match[3].toLowerCase() : match[2]?.toLowerCase() || '';
      
      let displayHour = hour;
      if (period === 'pm' && hour !== 12) displayHour += 12;
      if (period === 'am' && hour === 12) displayHour = 0;
      
      const displayHour12 = displayHour > 12 ? displayHour - 12 : displayHour === 0 ? 12 : displayHour;
      const displayPeriod = displayHour >= 12 ? 'PM' : 'AM';
      
      time = `${displayHour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${displayPeriod}`;
      break;
    }
  }

  // Default time if none specified
  if (!time) {
    time = '09:00 AM';
  }

  // Select color based on event type
  let color = 'bg-blue-500';
  if (lowerQuery.includes('meeting')) color = 'bg-blue-500';
  else if (lowerQuery.includes('class')) color = 'bg-green-500';
  else if (lowerQuery.includes('appointment')) color = 'bg-purple-500';
  else if (lowerQuery.includes('deadline')) color = 'bg-red-500';
  else if (lowerQuery.includes('personal')) color = 'bg-pink-500';

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1), // Capitalize first letter
    date,
    time,
    color
  };
};

// Helper function to get next occurrence of a weekday
const getNextWeekday = (targetDay: number): Date => {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilTarget = targetDay - currentDay;
  
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }
  
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntilTarget);
  return result;
};

export default function AIAssistantSearchBar(props: AIAssistantSearchBarProps = {}) {
  const { onCreateEvent } = props;
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicks outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Try to parse the query as an event creation command
    const eventData = parseEventFromQuery(query);
    
    if (eventData) {
      // Use event manager to notify calendar components
      eventManager.createEvent(eventData);
      
      // Also call the prop callback if provided (for backward compatibility)
      if (onCreateEvent) {
        onCreateEvent(eventData);
      }
      
      setQuery(''); // Clear the input after creating event
      setIsExpanded(false); // Collapse the search bar
      
      // Show success toast
      toast({
        title: "Event Created! 🎉",
        description: `"${eventData.title}" scheduled for ${eventData.date.toLocaleDateString()} at ${eventData.time}`,
      });
      
      console.log('Event created successfully:', eventData);
    } else {
      // Handle other types of queries (search, etc.)
      console.log('Processing query:', query);
      
      // Show info toast for non-event queries
      toast({
        title: "Query processed",
        description: "I'm still learning to handle this type of request. Try creating an event with 'create event [title] today at [time]'",
      });
      
      setQuery("");
      setIsExpanded(false);
    }
  };

  return (
    <div 
      ref={searchBarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-full max-w-xl px-6' : 'w-auto'
      }`}
    >
      <div className={`bg-black/5 backdrop-blur-md border border-gray-200/30 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
        isExpanded ? 'p-2' : 'p-1'
      }`}>
        {!isExpanded ? (
          // Collapsed state - small plus button
          <Button
            onClick={handleExpand}
            variant="ghost"
            className="rounded-full h-12 w-12 p-0 hover:bg-gray-100/50 transition-all duration-200"
          >
            <Plus className="h-5 w-5 text-gray-500" />
          </Button>
        ) : (
          // Expanded state - full search bar
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex items-center gap-3 flex-1 bg-transparent rounded-full px-4 py-3">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask Janni to create events... (e.g., 'create class today at 6pm')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 bg-transparent placeholder-gray-400 text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 hover:bg-gray-100/50"
            >
              <Mic className="h-4 w-4 text-gray-500" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}