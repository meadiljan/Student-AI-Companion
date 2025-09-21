import { Plus, Mic, Search, Sparkles, X, CheckCircle, Clock, Calendar, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { eventManager, SettingsChangeListener } from "@/utils/eventManager";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/contexts/TasksContext";
import { useTasks } from "@/contexts/TasksContext";

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
    /(?:create|add|schedule).*?(?:event|meeting|class|appointment).*?(?:for|called|named)?\s*["']?([^"']+)\s*["']?/i,
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

// AI parsing function to extract task details from natural language
const parseTaskFromQuery = (query: string): Omit<Task, 'id'> | null => {
  const lowerQuery = query.toLowerCase();
  
  // Check if it's a task creation command
  const isTaskCommand = lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('make') || lowerQuery.includes('schedule');
  if (!isTaskCommand) return null;

  // Extract task title
  let title = '';
  const titleMatches = [
    /(?:create|add|make).*?(?:task|assignment|to-do|todo).*?(?:for|called|named)?\s*["']?([^"']+)\s*["']?/i,
    /(?:create|add|make)\s+(?:a\s+)?(?:task|assignment|to-do|todo)\s+(.+?)(?:\s+(?:at|on|for|by|due))/i,
    /(?:create|add|make).*?(?:task|assignment|to-do|todo)\s+(.+)/i,
    /(?:create|add|make)\s+(.+?)\s+(?:task|assignment|to-do|todo)/i
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
    const taskIndex = words.findIndex(word => ['task', 'assignment', 'to-do', 'todo'].includes(word.toLowerCase()));
    if (taskIndex !== -1 && taskIndex < words.length - 1) {
      title = words[taskIndex + 1];
    } else {
      // Try to extract title from general sentence structure
      const createIndex = words.findIndex(word => ['create', 'add', 'make'].includes(word.toLowerCase()));
      if (createIndex !== -1 && createIndex < words.length - 1) {
        title = words.slice(createIndex + 1).join(' ');
      } else {
        title = 'New Task';
      }
    }
  }

  // Extract due date
  let dueDate = new Date().toISOString().split('T')[0]; // Default to today
  const today = new Date();
  
  if (lowerQuery.includes('today')) {
    dueDate = today.toISOString().split('T')[0];
  } else if (lowerQuery.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = tomorrow.toISOString().split('T')[0];
  } else if (lowerQuery.includes('monday')) {
    const nextMonday = getNextWeekday(1);
    dueDate = nextMonday.toISOString().split('T')[0];
  } else if (lowerQuery.includes('tuesday')) {
    const nextTuesday = getNextWeekday(2);
    dueDate = nextTuesday.toISOString().split('T')[0];
  } else if (lowerQuery.includes('wednesday')) {
    const nextWednesday = getNextWeekday(3);
    dueDate = nextWednesday.toISOString().split('T')[0];
  } else if (lowerQuery.includes('thursday')) {
    const nextThursday = getNextWeekday(4);
    dueDate = nextThursday.toISOString().split('T')[0];
  } else if (lowerQuery.includes('friday')) {
    const nextFriday = getNextWeekday(5);
    dueDate = nextFriday.toISOString().split('T')[0];
  } else if (lowerQuery.includes('saturday')) {
    const nextSaturday = getNextWeekday(6);
    dueDate = nextSaturday.toISOString().split('T')[0];
  } else if (lowerQuery.includes('sunday')) {
    const nextSunday = getNextWeekday(0);
    dueDate = nextSunday.toISOString().split('T')[0];
  }

  // Extract due time
  let dueTime = '';
  const timePatterns = [
    /(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
    /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    /at\s+(\d{1,2})\s*(am|pm)/i,
    /by\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i
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
      
      dueTime = `${displayHour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${displayPeriod}`;
      break;
    }
  }

  // Extract priority
  let priority: "low" | "medium" | "high" = "medium"; // Default priority
  if (lowerQuery.includes('high') || lowerQuery.includes('important') || lowerQuery.includes('urgent')) {
    priority = "high";
  } else if (lowerQuery.includes('low') || lowerQuery.includes('not important')) {
    priority = "low";
  }

  // Extract course (if mentioned)
  let course = '';
  const coursePatterns = [
    /(?:for|in)\s+(?:the\s+)?(?:class|course)\s+([\w\s]+)/i,
    /(?:for|in)\s+([\w\s]+)\s+(?:class|course)/i,
    /(?:class|course)\s+([\w\s]+)/i
  ];
  
  for (const pattern of coursePatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      course = match[1].trim();
      break;
    }
  }

  // Extract description (if mentioned)
  let description = '';
  const descriptionPatterns = [
    /(?:description|details):\s*([\w\s]+)/i,
    /about\s+([\w\s]+)/i,
    /details\s+([\w\s]+)/i
  ];
  
  for (const pattern of descriptionPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      description = match[1].trim();
      break;
    }
  }

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1), // Capitalize first letter
    description: description || undefined,
    dueDate,
    dueTime: dueTime || undefined,
    priority,
    status: "pending",
    course: course || "General",
    tags: [],
    completed: false,
    starred: false
  };
};

// AI parsing function to extract task details from natural language for updating
const parseTaskUpdateFromQuery = (query: string, existingTasks: Task[]): { taskId: string | null, updates: Partial<Task> } | null => {
  const lowerQuery = query.toLowerCase();
  
  // Check if it's a task update command
  const isUpdateCommand = lowerQuery.includes('update') || lowerQuery.includes('change') || lowerQuery.includes('modify') || lowerQuery.includes('edit');
  if (!isUpdateCommand) return null;

  // Extract task identifier (title, id, or index)
  let taskId: string | null = null;
  
  // Try to match by task title
  for (const task of existingTasks) {
    if (lowerQuery.includes(task.title.toLowerCase())) {
      taskId = task.id;
      break;
    }
  }
  
  // If not found by title, try to extract task ID or index
  if (!taskId) {
    const idMatch = query.match(/(?:id|task)\s*["']?([\w-]+)["']?/i);
    if (idMatch && idMatch[1]) {
      const matchedId = idMatch[1];
      // Check if it's a valid task ID
      if (existingTasks.some(task => task.id === matchedId)) {
        taskId = matchedId;
      }
    }
  }

  if (!taskId) return null;

  // Extract updates
  const updates: Partial<Task> = {};

  // Extract new title
  const titleMatch = query.match(/(?:title|name)\s*(?:to|as)?\s*["']?([^"']+?)["']?(?=\s|$|\.)/i);
  if (titleMatch && titleMatch[1]) {
    updates.title = titleMatch[1].trim();
  }

  // Extract new description
  const descPatterns = [
    /description\s*(?:to|as)?\s*["']?([^"']+?)["']?(?=\s|$|\.)/i,
    /details\s*(?:to|as)?\s*["']?([^"']+?)["']?(?=\s|$|\.)/i
  ];
  
  for (const pattern of descPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      updates.description = match[1].trim();
      break;
    }
  }

  // Extract new due date
  const datePatterns = [
    /(?:due\s+date|date)\s*(?:to|as)?\s*(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(?:due\s+date|date)\s*(?:on|by)?\s*(\d{4}-\d{2}-\d{2})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      if (match[1].toLowerCase() === 'today') {
        updates.dueDate = new Date().toISOString().split('T')[0];
      } else if (match[1].toLowerCase() === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updates.dueDate = tomorrow.toISOString().split('T')[0];
      } else {
        // For weekday matching, we'll use the getNextWeekday function
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayIndex = weekdays.indexOf(match[1].toLowerCase());
        if (dayIndex !== -1) {
          const nextDay = getNextWeekday(dayIndex);
          updates.dueDate = nextDay.toISOString().split('T')[0];
        }
      }
      break;
    }
  }

  // Extract new due time
  const timePatterns = [
    /(?:due\s+time|time)\s*(?:to|as)?\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    /(?:at|by)\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = query.match(pattern);
    if (match) {
      const hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const period = match[3] ? match[3].toLowerCase() : '';
      
      let displayHour = hour;
      if (period === 'pm' && hour !== 12) displayHour += 12;
      if (period === 'am' && hour === 12) displayHour = 0;
      
      const displayHour12 = displayHour > 12 ? displayHour - 12 : displayHour === 0 ? 12 : displayHour;
      const displayPeriod = displayHour >= 12 ? 'PM' : 'AM';
      
      updates.dueTime = `${displayHour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${displayPeriod}`;
      break;
    }
  }

  // Extract new priority
  if (lowerQuery.includes('priority high') || lowerQuery.includes('high priority')) {
    updates.priority = "high";
  } else if (lowerQuery.includes('priority medium') || lowerQuery.includes('medium priority')) {
    updates.priority = "medium";
  } else if (lowerQuery.includes('priority low') || lowerQuery.includes('low priority')) {
    updates.priority = "low";
  }

  // Extract new status
  if (lowerQuery.includes('mark as completed') || lowerQuery.includes('mark completed')) {
    updates.status = "completed";
    updates.completed = true;
  } else if (lowerQuery.includes('mark as pending')) {
    updates.status = "pending";
    updates.completed = false;
  } else if (lowerQuery.includes('mark as in progress')) {
    updates.status = "in-progress";
    updates.completed = false;
  }

  // Extract new course
  const courseMatch = query.match(/(?:course|class)\s*(?:to|as)?\s*["']?([^"']+?)["']?(?=\s|$|\.)/i);
  if (courseMatch && courseMatch[1]) {
    updates.course = courseMatch[1].trim();
  }

  return { taskId, updates };
};

// AI parsing function to extract task details for deletion
const parseTaskDeletionFromQuery = (query: string, existingTasks: Task[]): string | null => {
  const lowerQuery = query.toLowerCase();
  
  // Check if it's a task deletion command
  const isDeletionCommand = lowerQuery.includes('delete') || lowerQuery.includes('remove') || 
                           lowerQuery.includes('cancel') || lowerQuery.includes('clear') || 
                           lowerQuery.includes('get rid of') || lowerQuery.includes('eliminate');
  if (!isDeletionCommand) return null;

  // Extract task identifier (title, id, or index)
  let taskId: string | null = null;
  
  // Try to match by task title
  for (const task of existingTasks) {
    if (lowerQuery.includes(task.title.toLowerCase())) {
      taskId = task.id;
      break;
    }
  }
  
  // If not found by title, try to extract task ID or index
  if (!taskId) {
    const idMatch = query.match(/(?:id|task)\s*["']?([\w-]+)["']?/i);
    if (idMatch && idMatch[1]) {
      const matchedId = idMatch[1];
      // Check if it's a valid task ID
      if (existingTasks.some(task => task.id === matchedId)) {
        taskId = matchedId;
      }
    }
  }

  return taskId;
};

// AI parsing function to extract task details for completion toggling
const parseTaskCompletionFromQuery = (query: string, existingTasks: Task[]): string | null => {
  const lowerQuery = query.toLowerCase();
  
  // Check if it's a task completion command
  const isCompletionCommand = lowerQuery.includes('complete') || lowerQuery.includes('finish') || 
                             lowerQuery.includes('done') || lowerQuery.includes('mark as done');
  if (!isCompletionCommand) return null;

  // Extract task identifier (title, id, or index)
  let taskId: string | null = null;
  
  // Try to match by task title
  for (const task of existingTasks) {
    if (lowerQuery.includes(task.title.toLowerCase())) {
      taskId = task.id;
      break;
    }
  }
  
  // If not found by title, try to extract task ID or index
  if (!taskId) {
    const idMatch = query.match(/(?:id|task)\s*["']?([\w-]+)["']?/i);
    if (idMatch && idMatch[1]) {
      const matchedId = idMatch[1];
      // Check if it's a valid task ID
      if (existingTasks.some(task => task.id === matchedId)) {
        taskId = matchedId;
      }
    }
  }

  return taskId;
};

// AI parsing function to extract task details for starring toggling
const parseTaskStarringFromQuery = (query: string, existingTasks: Task[]): string | null => {
  const lowerQuery = query.toLowerCase();
  
  // Check if it's a task starring command
  const isStarringCommand = lowerQuery.includes('star') || lowerQuery.includes('favorite') || 
                           lowerQuery.includes('bookmark') || lowerQuery.includes('pin');
  if (!isStarringCommand) return null;

  // Extract task identifier (title, id, or index)
  let taskId: string | null = null;
  
  // Try to match by task title
  for (const task of existingTasks) {
    if (lowerQuery.includes(task.title.toLowerCase())) {
      taskId = task.id;
      break;
    }
  }
  
  // If not found by title, try to extract task ID or index
  if (!taskId) {
    const idMatch = query.match(/(?:id|task)\s*["']?([\w-]+)["']?/i);
    if (idMatch && idMatch[1]) {
      const matchedId = idMatch[1];
      // Check if it's a valid task ID
      if (existingTasks.some(task => task.id === matchedId)) {
        taskId = matchedId;
      }
    }
  }

  return taskId;
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
  const { tasks, addTask, updateTask, deleteTask, toggleCompleted, toggleStarred } = useTasks();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-pro"); // Add state for selected model
  const [isCreatingTask, setIsCreatingTask] = useState(false); // State to track task creation progress
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandMenuRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // State to track when chat mode is active for animation
  const [isChatModeActive, setIsChatModeActive] = useState(false);

  // Command options
  const commands = [
    { 
      id: 'create', 
      label: 'Agent', 
      description: 'Create a new task or event with AI', 
      icon: <Plus className="h-4 w-4" /> 
    },
    { 
      id: 'ask', 
      label: 'Ask', 
      description: 'Ask a question or get help', 
      icon: <Sparkles className="h-4 w-4" /> 
    }
  ];

  // Handle clicks outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        // Close command menu if open
        if (showCommandMenu) {
          setShowCommandMenu(false);
        } else if (activeCommand === 'ask' && chatMessages.length > 0) {
          // Keep chat mode open but collapse the assistant when clicking outside
          // Don't do anything, let the chat mode persist
        } else {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCommandMenu, activeCommand, chatMessages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle keyboard navigation for command menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showCommandMenu) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < commands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : commands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCommandSelect(commands[selectedIndex].id);
      } else if (e.key === 'Escape') {
        setShowCommandMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandMenu, selectedIndex]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    // Don't collapse if command menu is open or in chat mode
    if (!showCommandMenu && !(activeCommand === 'ask' && chatMessages.length > 0)) {
      setIsExpanded(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Check if user typed "@" to show command menu (only if no active command)
    if (!activeCommand && value.endsWith('@')) {
      setShowCommandMenu(true);
      setSelectedIndex(0);
      // Remove the "@" symbol from the query
      setQuery(value.slice(0, -1));
    } else if (showCommandMenu && !value.includes('@')) {
      // Hide command menu if "@" is removed
      setShowCommandMenu(false);
    }
  };

  const handleCommandSelect = (commandId: string) => {
    // Set active command instead of modifying query directly
    setActiveCommand(commandId);
    setShowCommandMenu(false);
    setSelectedIndex(0);
    
    // Focus input after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() && !activeCommand) return;
    
    // Auto-detect command based on query content if no command is active
    let effectiveCommand = activeCommand;
    let queryToProcess = query;
    
    if (!activeCommand) {
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.startsWith('create') || lowerQuery.includes('create task') || lowerQuery.includes('add task') || lowerQuery.includes('make task')) {
        effectiveCommand = 'create';
      } else {
        effectiveCommand = 'ask';
      }
    }
    
    // Combine active command with query
    const fullQuery = effectiveCommand ? `/${effectiveCommand} ${query}` : query;
    
    // Scroll to bottom when submitting a new query
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
    
    // Check if it's a command
    if (effectiveCommand === 'create') {
      // Handle create command
      const createQuery = queryToProcess;
      
      // First try to parse as a task creation
      const taskData = parseTaskFromQuery(createQuery);
      if (taskData) {
        // Show task creation animation in chat mode
        setIsCreatingTask(true);
        setActiveCommand('create'); // Set active command to show in UI
        
        // Add a message to show the creation process
        setChatMessages([
          { role: 'user', content: createQuery },
          { role: 'assistant', content: `Creating task: "${taskData.title}"...` }
        ]);
        
        // Simulate AI processing delay
        setTimeout(() => {
          // Actually create the task
          addTask(taskData);
          
          // Update chat with success message
          setChatMessages(prev => [
            ...prev.slice(0, -1), // Remove the "creating" message
            { 
              role: 'assistant', 
              content: `✅ Task "${taskData.title}" created successfully!

**Details:**
- Due: ${taskData.dueDate}${taskData.dueTime ? ` at ${taskData.dueTime}` : ''}
- Priority: ${taskData.priority}
- Course: ${taskData.course}` 
            }
          ]);
          
          // Reset states after a delay
          setTimeout(() => {
            setIsCreatingTask(false);
            setQuery(''); // Clear the input after creating task
            // Keep activeCommand to maintain the window open
            // Don't collapse the search bar immediately to show success message
          }, 3000);
          
          // Show success toast
          toast({
            title: "Task Created! 🎉",
            description: `"${taskData.title}" has been added to your tasks.`
          });
          
          console.log('Task created successfully:', taskData);
        }, 1500); // Simulate processing delay
        return;
      }
      
      // Try parsing as task update
      const updateData = parseTaskUpdateFromQuery(createQuery, tasks);
      if (updateData && updateData.taskId) {
        // Show task update animation in chat mode
        setIsCreatingTask(true);
        setActiveCommand('create'); // Set active command to show in UI
        
        // Find the task to update
        const taskToUpdate = tasks.find(task => task.id === updateData.taskId);
        if (taskToUpdate) {
          // Add a message to show the update process
          setChatMessages([
            { role: 'user', content: createQuery },
            { role: 'assistant', content: `Updating task: "${taskToUpdate.title}"...` }
          ]);
          
          // Simulate AI processing delay
          setTimeout(() => {
            // Actually update the task
            updateTask(updateData.taskId!, updateData.updates);
            
            // Create update details string
            const updateDetails = Object.entries(updateData.updates)
              .map(([key, value]) => `- ${key}: ${value}`)
              .join('\n');
            
            // Update chat with success message
            setChatMessages(prev => [
              ...prev.slice(0, -1), // Remove the "updating" message
              { 
                role: 'assistant', 
                content: `✅ Task "${taskToUpdate.title}" updated successfully!\n\n**Updated Details:**\n${updateDetails}` 
              }
            ]);
            
            // Reset states after a delay
            setTimeout(() => {
              setIsCreatingTask(false);
              setQuery(''); // Clear the input after updating task
            }, 3000);
            
            // Show success toast
            toast({
              title: "Task Updated! 🎉",
              description: `"${taskToUpdate.title}" has been updated.`
            });
            
            console.log('Task updated successfully:', updateData);
          }, 1500); // Simulate processing delay
        }
        return;
      }
      
      // Try parsing as task deletion
      const taskIdToDelete = parseTaskDeletionFromQuery(createQuery, tasks);
      if (taskIdToDelete) {
        // Show task deletion animation in chat mode
        setIsCreatingTask(true);
        setActiveCommand('create'); // Set active command to show in UI
        
        // Find the task to delete
        const taskToDelete = tasks.find(task => task.id === taskIdToDelete);
        if (taskToDelete) {
          // Add a message to show the deletion process
          setChatMessages([
            { role: 'user', content: createQuery },
            { role: 'assistant', content: `Deleting task: "${taskToDelete.title}"...` }
          ]);
          
          // Simulate AI processing delay
          setTimeout(() => {
            // Actually delete the task
            deleteTask(taskIdToDelete);
            
            // Update chat with success message
            setChatMessages(prev => [
              ...prev.slice(0, -1), // Remove the "deleting" message
              { 
                role: 'assistant', 
                content: `✅ Task "${taskToDelete.title}" deleted successfully!` 
              }
            ]);
            
            // Reset states after a delay
            setTimeout(() => {
              setIsCreatingTask(false);
              setQuery(''); // Clear the input after deleting task
            }, 3000);
            
            // Show success toast
            toast({
              title: "Task Deleted! 🎉",
              description: `"${taskToDelete.title}" has been removed from your tasks.`
            });
            
            console.log('Task deleted successfully:', taskIdToDelete);
          }, 1500); // Simulate processing delay
        }
        return;
      }
      
      // Try parsing as task completion toggle
      const taskIdToComplete = parseTaskCompletionFromQuery(createQuery, tasks);
      if (taskIdToComplete) {
        // Show task completion animation in chat mode
        setIsCreatingTask(true);
        setActiveCommand('create'); // Set active command to show in UI
        
        // Find the task to complete
        const taskToComplete = tasks.find(task => task.id === taskIdToComplete);
        if (taskToComplete) {
          // Add a message to show the completion process
          setChatMessages([
            { role: 'user', content: createQuery },
            { role: 'assistant', content: `Marking task as completed: "${taskToComplete.title}"...` }
          ]);
          
          // Simulate AI processing delay
          setTimeout(() => {
            // Actually toggle completion status
            toggleCompleted(taskIdToComplete);
            
            // Update chat with success message
            setChatMessages(prev => [
              ...prev.slice(0, -1), // Remove the "completing" message
              { 
                role: 'assistant', 
                content: `✅ Task "${taskToComplete.title}" marked as completed!` 
              }
            ]);
            
            // Reset states after a delay
            setTimeout(() => {
              setIsCreatingTask(false);
              setQuery(''); // Clear the input after completing task
            }, 3000);
            
            // Show success toast
            toast({
              title: "Task Completed! 🎉",
              description: `"${taskToComplete.title}" has been marked as completed.`
            });
            
            console.log('Task completed successfully:', taskIdToComplete);
          }, 1500); // Simulate processing delay
        }
        return;
      }
      
      // Try parsing as task starring toggle
      const taskIdToStar = parseTaskStarringFromQuery(createQuery, tasks);
      if (taskIdToStar) {
        // Show task starring animation in chat mode
        setIsCreatingTask(true);
        setActiveCommand('create'); // Set active command to show in UI
        
        // Find the task to star
        const taskToStar = tasks.find(task => task.id === taskIdToStar);
        if (taskToStar) {
          // Add a message to show the starring process
          setChatMessages([
            { role: 'user', content: createQuery },
            { role: 'assistant', content: `Starring task: "${taskToStar.title}"...` }
          ]);
          
          // Simulate AI processing delay
          setTimeout(() => {
            // Actually toggle starring status
            toggleStarred(taskIdToStar);
            
            // Update chat with success message
            setChatMessages(prev => [
              ...prev.slice(0, -1), // Remove the "starring" message
              { 
                role: 'assistant', 
                content: `✅ Task "${taskToStar.title}" has been starred!` 
              }
            ]);
            
            // Reset states after a delay
            setTimeout(() => {
              setIsCreatingTask(false);
              setQuery(''); // Clear the input after starring task
            }, 3000);
            
            // Show success toast
            toast({
              title: "Task Starred! ⭐",
              description: `"${taskToStar.title}" has been starred.`
            });
            
            console.log('Task starred successfully:', taskIdToStar);
          }, 1500); // Simulate processing delay
        }
        return;
      }
      
      // Try parsing as event if all task parsing fails
      const eventData = parseEventFromQuery(createQuery);
      if (eventData) {
        // Use event manager to notify calendar components
        eventManager.createEvent(eventData);
        
        // Also call the prop callback if provided (for backward compatibility)
        if (onCreateEvent) {
          onCreateEvent(eventData);
        }
        
        setQuery(''); // Clear the input after creating event
        setActiveCommand(null); // Clear active command
        setIsExpanded(false); // Collapse the search bar
        
        // Show success toast
        toast({
          title: "Event Created! 🎉",
          description: `"${eventData.title}" scheduled for ${eventData.date.toLocaleDateString()} at ${eventData.time}`
        });
        
        console.log('Event created successfully:', eventData);
      } else {
        // Show info toast for unrecognized create queries
        toast({
          title: "Could not process request",
          description: "Please provide more details about what you want to do.",
          variant: "destructive"
        });
        
        // Reset states
        setActiveCommand(null);
        setIsCreatingTask(false);
      }
    } else if (effectiveCommand === 'ask') {
      // Handle ask command
      const askQuery = queryToProcess;
      
      // Scroll to bottom when submitting a new query
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
      
      // Set active command and add user message to chat
      setActiveCommand('ask');
      const newMessages = [
        ...chatMessages,
        { role: 'user', content: askQuery }
      ];
      
      setChatMessages(newMessages);
      setQuery('');
      
      // Call AI API
      callAIModel(askQuery);
      
      // Focus the input field after submitting
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } else if (effectiveCommand === 'ask' && query.trim()) {
      // Handle follow-up questions in ask mode
      // Scroll to bottom when submitting a new query
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
      
      setActiveCommand('ask');
      const newMessages = [
        ...chatMessages,
        { role: 'user', content: query }
      ];
      
      setChatMessages(newMessages);
      setQuery('');
      
      // Call AI API for follow-up
      callAIModel(query);
      
      // Focus the input field after submitting
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } else {
      // Try to parse the query as an event creation command (legacy behavior)
      const eventData = parseEventFromQuery(queryToProcess);
      
      if (eventData) {
        // Use event manager to notify calendar components
        eventManager.createEvent(eventData);
        
        // Also call the prop callback if provided (for backward compatibility)
        if (onCreateEvent) {
          onCreateEvent(eventData);
        }
        
        setQuery(''); // Clear the input after creating event
        setActiveCommand(null); // Clear active command
        setIsExpanded(false); // Collapse the search bar
        
        // Show success toast
        toast({
          title: "Event Created! 🎉",
          description: `"${eventData.title}" scheduled for ${eventData.date.toLocaleDateString()} at ${eventData.time}`
        });
        
        console.log('Event created successfully:', eventData);
      } else {
        // Handle other types of queries (search, etc.)
        console.log('Processing query:', queryToProcess);
        
        // Show info toast for non-event queries
        toast({
          title: "Query processed",
          description: "I'm still learning to handle this type of request. Try creating an event with 'create event [title] today at [time]'"
        });
        
        setQuery("");
        setActiveCommand(null);
        setIsExpanded(false);
      }
    }
  };

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange: SettingsChangeListener = (settings) => {
      setSelectedModel(settings.selectedModel);
    };

    eventManager.addSettingsChangeListener(handleSettingsChange);

    // Load initial settings
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.ai?.selectedModel) {
          setSelectedModel(settings.ai.selectedModel);
        }
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }

    return () => {
      eventManager.removeSettingsChangeListener(handleSettingsChange);
    };
  }, []);

  // Function to call AI model based on selected model and API key
  const callAIModel = async (userQuery: string) => {
    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem("aiApiKey");
      
      if (!apiKey) {
        setChatMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: "API key not found. Please set your API key in the settings menu under AI Integration." 
          }
        ]);
        return;
      }
      
      // Show loading message
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Thinking...' }
      ]);
      
      let aiResponse = "";
      
      if (selectedModel === "gemini-2.5-pro" || selectedModel === "gemini-2.5-flash") {
        // Call Google Gemini API
        aiResponse = await callGeminiAPI(userQuery, apiKey);
      } else if (selectedModel === "gpt-4") {
        // Call OpenAI API
        aiResponse = await callOpenAIAPI(userQuery, apiKey);
      } else if (selectedModel === "meta-llama/llama-4-maverick-17b-128e-instruct" || selectedModel === "meta-llama/llama-4-scout-17b-16e-instruct") {
        // Call Groq API
        aiResponse = await callGroqAPI(userQuery, apiKey);
      } else {
        // Fallback for other models
        aiResponse = `I'm using the ${selectedModel} model. Your question was: "${userQuery}". In a full implementation, this would connect to the appropriate AI service.`;
      }
      
      // Update with actual response (remove loading message)
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove loading message
        newMessages.push({ role: 'assistant', content: aiResponse });
        return newMessages;
      });
    } catch (error) {
      console.error("AI API call error:", error);
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove loading message
        newMessages.push({ 
          role: 'assistant', 
          content: "Sorry, I encountered an error while processing your request. Please try again." 
        });
        return newMessages;
      });
    }
  };

  // Function to call Google Gemini API
  const callGeminiAPI = async (query: string, apiKey: string): Promise<string> => {
    try {
      // Map the internal model names to Gemini API model names
      const modelMap: Record<string, string> = {
        "gemini-2.5-pro": "gemini-2.5-pro",
        "gemini-2.5-flash": "gemini-2.5-flash"
      };
      
      const model = modelMap[selectedModel] || "gemini-2.5-pro";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`Calling Gemini API with model ${model} at URL:`, url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: query
            }]
          }]
        }),
      });
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error for model ${model}:`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Gemini API full response:", JSON.stringify(data, null, 2));
      
      // Check if the response has the expected structure
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text || "No text content in response";
        }
      }
      
      // Fallback if structure is different
      return data.candidates?.[0]?.content?.parts?.[0]?.text || `No response from Gemini ${model}`;
    } catch (error) {
      console.error("Gemini API call error:", error);
      return `Error calling Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Function to call OpenAI API
  const callOpenAIAPI = async (query: string, apiKey: string): Promise<string> => {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: query }],
            temperature: 0.7,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "No response from OpenAI";
    } catch (error) {
      console.error("OpenAI API call error:", error);
      return `Error calling OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Function to call Groq API
  const callGroqAPI = async (query: string, apiKey: string): Promise<string> => {
    try {
      // Map the internal model names to Groq API model names
      const modelMap: Record<string, string> = {
        "meta-llama/llama-4-maverick-17b-128e-instruct": "meta-llama/llama-4-maverick-17b-128e-instruct",
        "meta-llama/llama-4-scout-17b-16e-instruct": "meta-llama/llama-4-scout-17b-16e-instruct"
      };
      
      const model = modelMap[selectedModel] || "meta-llama/llama-4-maverick-17b-128e-instruct";
      const url = `https://api.groq.com/openai/v1/chat/completions`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: query }],
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API error for model ${model}:`, errorText);
        throw new Error(`Groq API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
      }
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || `No response from Groq ${model}`;
    } catch (error) {
      console.error("Groq API call error:", error);
      return `Error calling Groq API: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Function to reset chat mode
  const resetChatMode = () => {
    // Allow closing even during task creation
    setActiveCommand(null);
    setChatMessages([]);
    setQuery('');
    setIsCreatingTask(false); // Ensure task creation state is reset
  };

  // Update isChatModeActive when chatMessages change or when creating a task
  useEffect(() => {
    if ((activeCommand === 'ask' || activeCommand === 'create') && (chatMessages.length > 0 || isCreatingTask)) {
      setIsChatModeActive(true);
    } else {
      setIsChatModeActive(false);
    }
  }, [activeCommand, chatMessages, isCreatingTask]);

  // Remove auto-collapse after successful task creation
  // Keep the window open to show success message until user manually closes it

  // Scroll to show new messages properly

  return (
    <div 
      ref={searchBarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-full max-w-xl px-6' : 'w-auto'
      }`}
    >
      <div className={`bg-black/5 backdrop-blur-md border border-gray-200/30 rounded-2xl shadow-lg transition-all duration-300 ease-in-out ${
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
          // Expanded state - full search bar with chat interface
          <div className="w-full">
            {/* Chat Interface with Animation */}
            <AnimatePresence>
              {isChatModeActive ? (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 300,
                    duration: 0.3 
                  }}
                  className="w-full"
                >
                  {/* Chat Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span 
                        className="bg-black text-white rounded-full px-3 py-1 text-sm font-medium cursor-pointer hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          // Switch between 'create' and 'ask' commands
                          if (activeCommand === 'create') {
                            setActiveCommand('ask');
                          } else if (activeCommand === 'ask') {
                            setActiveCommand('create');
                          }
                        }}
                      >
                        {activeCommand === 'create' ? 'Agent' : commands.find(cmd => cmd.id === activeCommand)?.label}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-6 w-6 p-0 hover:bg-gray-100/50"
                      onClick={resetChatMode}
                      disabled={isCreatingTask} // Disable close button during task creation
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Chat Messages */}
                  <div 
                    ref={chatContainerRef}
                    className="max-h-48 overflow-y-auto mb-2 px-2 scrollbar-hide"
                  >
                    {chatMessages.map((message, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                      >
                        <div 
                          className={`inline-block rounded-2xl px-3 py-2 max-w-xs lg:max-w-md text-sm ${
                            message.role === 'user' 
                              ? 'bg-black text-white rounded-br-none' 
                              : 'bg-accent text-gray-900 dark:text-gray-100 rounded-bl-none'
                          }`}
                        >
                          {message.role === 'user' ? (
                            // User messages - plain text with line breaks
                            <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          ) : (
                            // AI messages - formatted markdown or task creation status
                            isCreatingTask && activeCommand === 'create' && message.content.includes('Creating task') ? (
                              // Special animation for task creation
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span>{message.content}</span>
                              </div>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_strong]:font-bold [&_em]:italic">
                                <ReactMarkdown 
                                  remarkPlugins={[[remarkGfm, {}]]}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Input Form */}
                  <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder={activeCommand === 'create' ? "What task would you like to create, update, or manage?" : "Ask follow-up question..."}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="border-0 bg-transparent placeholder-gray-400 text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm flex-1"
                      disabled={isCreatingTask} // Disable input during task creation
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 w-8 p-0 hover:bg-gray-100/50"
                      disabled={isCreatingTask} // Disable submit button during task creation
                    >
                      {isCreatingTask ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      )}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                // Regular Input Form
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                    <div className="flex items-center gap-3 flex-1 bg-transparent rounded-full px-4 py-3 relative">
                      {/* Active Command Indicator */}
                      {activeCommand && (
                        <div className="flex items-center">
                          <span className="bg-black text-white rounded-full px-3 py-1 text-sm font-medium">
                            {commands.find(cmd => cmd.id === activeCommand)?.label}
                          </span>
                          <span className="mx-2 text-gray-400">|</span>
                        </div>
                      )}
                      
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder={activeCommand ? "Enter your request..." : "Ask Janni to create tasks or events... (e.g., 'agent math homework tomorrow', 'agent class today at 6pm')"}
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          // Handle backspace to remove command indicator when query is empty
                          if (e.key === 'Backspace' && query === '' && activeCommand) {
                            e.preventDefault();
                            setActiveCommand(null);
                          }
                        }}
                        className="border-0 bg-transparent placeholder-gray-400 text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm flex-1"
                      />
                      
                      {/* Command Menu */}
                      {showCommandMenu && (
                        <div 
                          ref={commandMenuRef}
                          className="absolute bottom-full left-0 mb-2 w-64 bg-background/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-border/50 overflow-hidden z-50"
                        >
                          <div className="py-1">
                            {commands.map((command, index) => (
                              <button
                                key={command.id}
                                type="button"
                                onClick={() => handleCommandSelect(command.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-xl ${
                                  index === selectedIndex 
                                    ? 'bg-accent' 
                                    : 'hover:bg-accent/50'
                                }`}
                              >
                                <div className="text-gray-500">
                                  {command.icon}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{command.label}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{command.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}