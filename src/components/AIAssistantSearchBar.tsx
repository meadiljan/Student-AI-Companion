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
import { bulkTasks as bulkTasksApi, listTasks as listTasksApi, analytics as analyticsApi } from "@/services/agentApi";
import { useTasks } from "@/contexts/TasksContext";
import { conversationMemory } from "@/services/conversationMemory";

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
  const { tasks, addTask, updateTask, deleteTask, toggleCompleted, toggleStarred, refreshTasks } = useTasks();
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

  // Conversation memory for Agent mode (pending confirmations and clarifications)
  type PendingAgentAction = {
    action: string;
    criteria?: any;
    taskIds?: string[];
    taskData?: any;
    humanSummary?: string;
  };
  type ClarificationContext = {
    originalQuery: string;
    question?: string;
  };
  const [pendingAgentAction, setPendingAgentAction] = useState<PendingAgentAction | null>(null);
  const [clarificationContext, setClarificationContext] = useState<ClarificationContext | null>(null);

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
  
  // Restore conversation history on component mount
  useEffect(() => {
    const restoreConversation = () => {
      const history = conversationMemory.getCurrentConversationHistory();
      if (history.length > 0) {
        const chatHistory = history.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        setChatMessages(chatHistory);
        console.log(`Restored conversation with ${history.length} messages`);
      }
    };
    
    restoreConversation();
  }, []); // Run only once on mount

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
      // First: handle pending confirmations or clarifications in Agent mode
      const lower = queryToProcess.trim().toLowerCase();
      const isAffirm = ["yes","y","confirm","do it","proceed","go ahead"].includes(lower);
      const isDeny = ["no","n","cancel","stop","abort"].includes(lower);

      // If we have a pending destructive action awaiting confirmation
      if (pendingAgentAction && (isAffirm || isDeny)) {
        // Append user reply to chat
        setChatMessages(prev => ([...prev, { role: 'user', content: queryToProcess }]));
        setQuery('');

        if (isDeny) {
          setPendingAgentAction(null);
          setChatMessages(prev => ([...prev, { role: 'assistant', content: 'Okay, canceled that action.' }]));
          return;
        }

        // Execute the stored action
        executePendingAction(pendingAgentAction);
        setPendingAgentAction(null);
        return;
      }

      // If AI asked a clarification question previously
      if (clarificationContext && !isAffirm && !isDeny) {
        // Combine original query with the new user info and send back to AI
        const combined = `${clarificationContext.originalQuery}\nUser clarification: ${queryToProcess}`;
        setChatMessages(prev => ([...prev, { role: 'user', content: queryToProcess }]));
        setQuery('');
        setClarificationContext(null);
        callAIModelForAgent(combined);
        return;
      }

      // Handle Agent mode with AI-powered understanding
      const createQuery = queryToProcess;
      
      // Set active command and add user message to chat
      setActiveCommand('create');
      const newMessages = [
        ...chatMessages,
        { role: 'user', content: createQuery }
      ];
      
      setChatMessages(newMessages);
      setQuery('');
      
      // Call AI model for intelligent task management
      callAIModelForAgent(createQuery);
      
      // Focus the input field after submitting
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
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
    } else if (effectiveCommand === 'create' && query.trim()) {
      // Handle follow-up requests in Agent mode
      // Scroll to bottom when submitting a new query
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
      
      setActiveCommand('create');
      const newMessages = [
        ...chatMessages,
        { role: 'user', content: query }
      ];
      
      setChatMessages(newMessages);
      setQuery('');
      
      // Call AI API for follow-up task management
      callAIModelForAgent(query);
      
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

  // Helper function to filter tasks based on criteria
  const filterTasksByCriteria = (tasks: any[], criteria: any, action: string) => {
    if (!criteria) return tasks;
    
    return tasks.filter(task => {
      // Common filters
      if (criteria.completed !== undefined && task.completed !== criteria.completed) return false;
      if (criteria.status && task.status !== criteria.status) return false;
      if (criteria.priority && task.priority !== criteria.priority) return false;
      if (criteria.course && task.course !== criteria.course) return false;
      if (criteria.starred !== undefined && task.starred !== criteria.starred) return false;
      
      // Date-based filters
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      
      if (criteria.overdue || action === 'CLEAR_OVERDUE') {
        const isOverdue = taskDate < today && !task.completed;
        if (!isOverdue) return false;
      }
      
      if (criteria.today) {
        if (taskDate.getTime() !== today.getTime()) return false;
      }
      
      if (criteria.thisWeek) {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        if (taskDate < today || taskDate > weekFromNow) return false;
      }
      
      // Action-specific filters
      if (action === 'CLEAR_COMPLETED' && !task.completed) return false;
      if (action === 'CLEAR_PENDING' && task.status !== 'pending') return false;
      
      // Text search
      if (criteria.textSearch) {
        const searchTerm = criteria.textSearch.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchTerm);
        const descMatch = task.description?.toLowerCase().includes(searchTerm);
        if (!titleMatch && !descMatch) return false;
      }
      
      return true;
    });
  };

  // Execute a previously stored pending agent action
  const executePendingAction = async (pending: { action: string; criteria?: any; taskIds?: string[]; taskData?: any; humanSummary?: string; }) => {
    const action = pending.action;
    let matchingTasks: Task[] = [];
    if (pending.taskIds && pending.taskIds.length > 0) {
      matchingTasks = tasks.filter(t => pending.taskIds!.includes(t.id));
    } else if (pending.criteria) {
      matchingTasks = filterTasksByCriteria(tasks, pending.criteria, action);
    }

    if (matchingTasks.length === 0) {
      setChatMessages(prev => ([...prev, { role: 'assistant', content: 'No matching tasks to act on.' }]));
      return;
    }

    switch (action) {
      case 'DELETE_MULTIPLE':
      case 'CLEAR_COMPLETED':
      case 'CLEAR_OVERDUE':
      case 'CLEAR_PENDING':
        try {
          if (action === 'CLEAR_COMPLETED') {
            await bulkTasksApi({ operation: 'clear-completed' });
          } else if (action === 'CLEAR_OVERDUE') {
            await bulkTasksApi({ operation: 'clear-overdue' });
          } else if (action === 'CLEAR_PENDING') {
            await bulkTasksApi({ operation: 'clear-pending' });
          } else {
            await bulkTasksApi({ operation: 'delete', taskIds: matchingTasks.map(t => t.id) });
          }
          // Refresh tasks from backend to get updated state
          await refreshTasks();
        } catch (e) {
          console.error('Bulk delete-like op failed', e);
        }
        setChatMessages(prev => ([...prev, { role: 'assistant', content: `✅ Deleted ${matchingTasks.length} task(s).` }]));
        toast({ title: 'Bulk Delete Complete 🗑️', description: `${matchingTasks.length} tasks removed.` });
        break;
      case 'COMPLETE_MULTIPLE':
        try {
          await bulkTasksApi({ operation: 'complete', taskIds: matchingTasks.map(t => t.id) });
          await refreshTasks();
        } catch (e) {
          console.error('Bulk complete op failed', e);
        }
        setChatMessages(prev => ([...prev, { role: 'assistant', content: `✅ Completed ${matchingTasks.length} task(s).` }]));
        toast({ title: 'Bulk Complete 🎉', description: `${matchingTasks.length} tasks marked as done.` });
        break;
      case 'STAR_MULTIPLE':
        try {
          await bulkTasksApi({ operation: 'star', taskIds: matchingTasks.map(t => t.id) });
          await refreshTasks();
        } catch (e) {
          console.error('Bulk star op failed', e);
        }
        setChatMessages(prev => ([...prev, { role: 'assistant', content: `⭐ Starred ${matchingTasks.length} task(s).` }]));
        toast({ title: 'Bulk Star ⭐', description: `${matchingTasks.length} tasks starred.` });
        break;
      case 'UPDATE_MULTIPLE':
      case 'BULK_PRIORITY':
      case 'RESCHEDULE_MULTIPLE':
        try {
          await bulkTasksApi({ operation: 'update', taskIds: matchingTasks.map(t => t.id), update: pending.taskData || {} });
          // Refresh tasks from backend to get updated state
          await refreshTasks();
        } catch (e) {
          console.error('Bulk update op failed', e);
        }
        setChatMessages(prev => ([...prev, { role: 'assistant', content: `🔄 Updated ${matchingTasks.length} task(s).` }]));
        toast({ title: 'Bulk Update 🔄', description: `${matchingTasks.length} tasks updated.` });
        break;
      default:
        setChatMessages(prev => ([...prev, { role: 'assistant', content: 'Stored action executed.' }]));
    }
  };

  // Function to call AI model for Agent mode with task management context
  const callAIModelForAgent = async (userQuery: string) => {
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
      
      // Add conversation context for Agent mode personalization
      const conversationContext = conversationMemory.getConversationContext(8);
      const sessionSummary = conversationMemory.getSessionSummary();
      
      // Save user message to conversation memory
      conversationMemory.addMessage('user', userQuery, 'agent');
      
      // Show loading message
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Analyzing your request...' }
      ]);
      
      // Create enhanced prompt for task management with conversation context
      const taskManagementPrompt = `You are an advanced AI task management assistant with comprehensive capabilities and conversation memory. Analyze user requests and determine appropriate actions, including complex bulk operations.

${conversationContext ? `CONVERSATION CONTEXT:
${conversationContext}
Session Info: This conversation has ${sessionSummary.messageCount} messages covering topics: ${sessionSummary.topics.join(', ')}.
Consider previous interactions and provide personalized, context-aware responses. Reference previous tasks, preferences, and conversation patterns when relevant.

` : ''}AVAILABLE ACTIONS:
- CREATE_TASK: Create a new task
- UPDATE_TASK: Modify an existing task  
- DELETE_TASK: Remove a specific task
- DELETE_MULTIPLE: Remove multiple tasks (by criteria/bulk)
- COMPLETE_TASK: Mark a task as completed
- COMPLETE_MULTIPLE: Mark multiple tasks as completed (by criteria/bulk)
- STAR_TASK: Star/favorite a task
- STAR_MULTIPLE: Star multiple tasks (by criteria/bulk)
- UPDATE_MULTIPLE: Update multiple tasks (by criteria/bulk)
- LIST_TASKS: Show current tasks (with optional filtering)
- CLEAR_COMPLETED: Remove all completed tasks
- CLEAR_OVERDUE: Remove all overdue tasks
- CLEAR_PENDING: Remove all pending tasks
- BULK_PRIORITY: Change priority for multiple tasks
- RESCHEDULE_MULTIPLE: Change due dates for multiple tasks
- ORGANIZE_TASKS: Reorganize/categorize tasks
- ANALYTICS: Provide task statistics and insights
- CLARIFY: Ask for more information when unclear

CURRENT DATE: ${new Date().toISOString().split('T')[0]}

CURRENT TASKS:
${tasks.map(task => {
  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
  return `- ID: ${task.id}, Title: "${task.title}", Status: ${task.status}, Priority: ${task.priority}, Due: ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}, Course: ${task.course}, Completed: ${task.completed}, Starred: ${task.starred}${isOverdue ? ' [OVERDUE]' : ''}`;
}).join('\n')}

USER REQUEST: "${userQuery}"

ADVANCED INTELLIGENCE GUIDELINES:
1. **Bulk Operations**: Understand requests like "clear all overdue tasks", "mark all math homework as done", "delete completed tasks"
2. **Filtering & Criteria**: Parse conditions like "overdue", "high priority", "from math course", "completed", "starred"
3. **Smart Date Understanding**: "overdue" = past due date, "this week" = next 7 days, "urgent" = high priority
4. **Pattern Recognition**: Recognize bulk operation patterns and apply them intelligently
5. **Context Awareness**: Consider task relationships, dependencies, and logical groupings
6. **Confirmation for Destructive Actions**: For bulk deletions, provide clear confirmation
7. **Statistics & Analytics**: Calculate and provide insights about task status, productivity, etc.
8. **Advanced Scheduling**: Handle complex rescheduling like "move all tasks from this week to next week"
9. **Smart Categorization**: Organize tasks by course, priority, due date, etc.
10. **Natural Language Flexibility**: Handle various ways of expressing the same intent

BULK OPERATION EXAMPLES:
- "clear all overdue tasks" → DELETE_MULTIPLE (criteria: overdue)
- "clear all pending tasks" → DELETE_MULTIPLE (criteria: status="pending")
- "delete all pending tasks" → DELETE_MULTIPLE (criteria: status="pending")
- "mark all completed tasks as deleted" → DELETE_MULTIPLE (criteria: completed)
- "star all high priority tasks" → STAR_MULTIPLE (criteria: high priority)
- "move all math homework to next week" → UPDATE_MULTIPLE (criteria: course=math, update: due date)
- "change all low priority tasks to medium" → UPDATE_MULTIPLE (criteria: priority=low, update: priority=medium)
- "complete all tasks due today" → COMPLETE_MULTIPLE (criteria: due today)
- "complete all pending tasks" → COMPLETE_MULTIPLE (criteria: status="pending")
- "show me overdue tasks" → LIST_TASKS (filter: overdue)
- "show me pending tasks" → LIST_TASKS (filter: status="pending")
- "how many tasks do I have?" → ANALYTICS (count statistics)

RESPONSE FORMAT:
{
  "action": "ACTION_NAME",
  "confidence": "high/medium/low",
  "reasoning": "Detailed explanation of interpretation and chosen action",
  "criteria": {
    // For bulk operations: filtering criteria
    "completed": true/false,
    "status": "pending/completed/in-progress",
    "overdue": true/false,
    "priority": "high/medium/low",
    "course": "course name",
    "starred": true/false,
    "dueDateBefore": "YYYY-MM-DD",
    "dueDateAfter": "YYYY-MM-DD",
    "titleContains": "search term",
    "specificIds": ["id1", "id2"]
  },
  "taskData": {
    // For single operations: MUST include taskId to identify the specific task
    "taskId": "exact_task_id_from_list_above",
    // For bulk operations: update data to apply to all matching tasks
    "title": "new title",
    "dueDate": "YYYY-MM-DD", 
    "priority": "high/medium/low",
    "course": "course name",
    "completed": true/false,
    "starred": true/false
  },
  "confirmationRequired": true/false, // For destructive bulk operations
  "response": "Detailed, conversational response explaining the action"
}

SINGLE TASK OPERATION EXAMPLES:
- "delete the math homework" → {"action": "DELETE_TASK", "taskData": {"taskId": "1234"}}
- "mark typography paper as complete" → {"action": "COMPLETE_TASK", "taskData": {"taskId": "1234"}}
- "star the design project" → {"action": "STAR_TASK", "taskData": {"taskId": "1234"}}
- "update math task priority to high" → {"action": "UPDATE_TASK", "taskData": {"taskId": "1234", "priority": "high"}}

IMPORTANT: For single task operations (UPDATE_TASK, DELETE_TASK, COMPLETE_TASK, STAR_TASK), you MUST identify the exact task by matching the user's description to the task titles/content in the current task list above, then provide the corresponding task ID in taskData.taskId.

Be extremely intelligent about understanding user intent. Handle typos, informal language, and complex requests gracefully.`;

      let aiResponse = "";
      
      if (selectedModel === "gemini-2.5-pro" || selectedModel === "gemini-2.5-flash") {
        // Call Google Gemini API
        aiResponse = await callGeminiAPI(taskManagementPrompt, apiKey);
      } else if (selectedModel === "gpt-4") {
        // Call OpenAI API
        aiResponse = await callOpenAIAPI(taskManagementPrompt, apiKey);
      } else if (selectedModel === "meta-llama/llama-4-maverick-17b-128e-instruct" || selectedModel === "meta-llama/llama-4-scout-17b-16e-instruct") {
        // Call Groq API
        aiResponse = await callGroqAPI(taskManagementPrompt, apiKey);
      } else {
        // Fallback for other models
        aiResponse = `{"action": "CLARIFY", "confidence": "low", "reasoning": "Model not fully configured", "taskData": {"clarificationQuestion": "I'm sorry, but I need to be properly configured first. Please check your AI model settings."}, "response": "Please configure your AI model in settings to use the intelligent agent features."}`;
      }
      
      // Parse AI response and execute the appropriate action
      await handleAIAgentResponse(aiResponse, userQuery);
      
    } catch (error) {
      console.error("AI Agent call error:", error);
      
      // Update with error message (remove loading message)
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove loading message
        newMessages.push({ 
          role: 'assistant', 
          content: "Sorry, I encountered an error while processing your request. Please try again or rephrase your request." 
        });
        return newMessages;
      });
    }
  };

  // Function to handle AI agent response and execute actions
  const handleAIAgentResponse = async (aiResponse: string, originalQuery: string) => {
    try {
      // Remove loading message first
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove loading message
        return newMessages;
      });

      // Try to parse JSON response from AI
      let parsedResponse;
      try {
        // Extract JSON from response if it's wrapped in other text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
        parsedResponse = JSON.parse(jsonStr);
        
        // Validate required fields
        if (!parsedResponse.action || !parsedResponse.response) {
          throw new Error("Invalid response format - missing required fields");
        }
        
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.log("Raw AI response:", aiResponse);
        setChatMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: "I understand you want to manage tasks, but I had trouble processing your request. Let me try to help you anyway! Could you please be more specific? For example:\n\n• **Create**: 'Create task: Study for exam tomorrow at 2pm'\n• **Complete**: 'Mark done: Typography Research Paper'\n• **Delete**: 'Remove task: Assignment 1'\n• **Update**: 'Change deadline for math homework to Friday'\n• **List**: 'Show me my tasks'" 
          }
        ]);
        return;
      }

      const { action, taskData, response } = parsedResponse;

      // Debug logging
      console.log("AI Response:", { action, taskData, response });

      // Save assistant response to conversation memory
      conversationMemory.addMessage('assistant', response, 'agent');

      // Show the AI's response to the user
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: response }
      ]);

      // Execute the determined action
      switch (action) {
        case 'CREATE_TASK':
          if (taskData && taskData.title) {
            // Smart defaults for task creation
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const newTask = {
              title: taskData.title,
              description: taskData.description || undefined, // Let TasksContext auto-generate if undefined
              dueDate: taskData.dueDate || today.toISOString().split('T')[0],
              dueTime: taskData.dueTime || undefined,
              priority: (taskData.priority as "low" | "medium" | "high") || 'medium',
              status: 'pending' as const,
              course: taskData.course || 'General',
              tags: taskData.tags || [],
              completed: false,
              starred: false
            };
            
            // Use context method which calls API internally
            await addTask(newTask);
            
            setTimeout(() => {
              const dueDateStr = newTask.dueDate === today.toISOString().split('T')[0] 
                ? 'today' 
                : newTask.dueDate === tomorrow.toISOString().split('T')[0] 
                ? 'tomorrow' 
                : newTask.dueDate;
              
              const timeStr = newTask.dueTime ? ` at ${newTask.dueTime}` : '';
              const priorityEmoji = newTask.priority === 'high' ? '🔥' : newTask.priority === 'low' ? '📝' : '⭐';
              
              setChatMessages(prev => [
                ...prev,
                { 
                  role: 'assistant', 
                  content: `✅ Task created successfully!\n\n${priorityEmoji} **${newTask.title}**\n📅 Due: ${dueDateStr}${timeStr}\n📚 Course: ${newTask.course}\n🏷️ Priority: ${newTask.priority}` 
                }
              ]);
              toast({
                title: "Task Created! 🎉",
                description: `"${newTask.title}" has been added to your tasks.`
              });
            }, 500);
          } else {
            setChatMessages(prev => [
              ...prev,
              { role: 'assistant', content: "❌ I couldn't create the task because no title was provided. Please try again with a task title." }
            ]);
          }
          break;

        case 'UPDATE_TASK':
          if (taskData) {
            let targetTaskId = taskData.taskId;
            
            // If no taskId provided, try to find task by other criteria
            if (!targetTaskId && taskData.title) {
              const foundTask = tasks.find(t => 
                t.title.toLowerCase().includes(taskData.title.toLowerCase()) ||
                taskData.title.toLowerCase().includes(t.title.toLowerCase())
              );
              targetTaskId = foundTask?.id;
            }
            
            if (targetTaskId) {
              // Use context method which calls API internally
              await updateTask(targetTaskId, taskData);
              const updatedTask = tasks.find(t => t.id === targetTaskId);
              setTimeout(() => {
                setChatMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `✅ Task "${updatedTask?.title}" updated successfully!` }
                ]);
                toast({
                  title: "Task Updated! 🎉",
                  description: `"${updatedTask?.title}" has been updated.`
                });
              }, 500);
            }
          }
          break;

        case 'DELETE_TASK':
          if (taskData) {
            let targetTaskId = taskData.taskId;
            
            // If no taskId provided, try to find task by other criteria
            if (!targetTaskId && taskData.title) {
              const foundTask = tasks.find(t => 
                t.title.toLowerCase().includes(taskData.title.toLowerCase()) ||
                taskData.title.toLowerCase().includes(t.title.toLowerCase())
              );
              targetTaskId = foundTask?.id;
            }
            
            if (targetTaskId) {
              const taskToDelete = tasks.find(t => t.id === targetTaskId);
              // Use context method which calls API internally
              await deleteTask(targetTaskId);
              setTimeout(() => {
                setChatMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `✅ Task "${taskToDelete?.title}" deleted successfully!` }
                ]);
                toast({
                  title: "Task Deleted! 🗑️",
                  description: `"${taskToDelete?.title}" has been removed.`
                });
              }, 500);
            }
          }
          break;

        case 'DELETE_MULTIPLE':
        case 'CLEAR_COMPLETED':
        case 'CLEAR_OVERDUE':
        case 'CLEAR_PENDING':
          {
            const { criteria } = parsedResponse;
            const matchingTasks = filterTasksByCriteria(tasks, criteria, action);
            
            if (matchingTasks.length === 0) {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: "📝 No tasks found matching your criteria." }
              ]);
              break;
            }

            if (parsedResponse.confirmationRequired) {
              setChatMessages(prev => [
                ...prev,
                { 
                  role: 'assistant', 
                  content: `⚠️ **Confirmation Required**\n\nI found ${matchingTasks.length} task(s) matching your criteria:\n\n${matchingTasks.map(t => `• ${t.title}`).join('\n')}\n\nReply with "yes" or "confirm" to proceed with deletion, or "no" to cancel.` 
                }
              ]);
              // Store pending action for confirmation
              setPendingAgentAction({
                action,
                criteria,
                taskIds: matchingTasks.map(t => t.id),
                humanSummary: `${action} on ${matchingTasks.length} tasks`
              });
            } else {
              // Proceed with bulk deletion
              try {
                await bulkTasksApi({ operation: 'delete', taskIds: matchingTasks.map(t => t.id) });
                // Refresh tasks from backend to get updated state
                await refreshTasks();
              } catch (e) {
                console.error('Bulk delete API failed', e);
              }
              
              setTimeout(() => {
                setChatMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `✅ Successfully deleted ${matchingTasks.length} task(s)!` }
                ]);
                toast({
                  title: "Bulk Delete Complete! 🗑️",
                  description: `${matchingTasks.length} tasks have been removed.`
                });
              }, 500);
            }
          }
          break;

        case 'COMPLETE_TASK':
          if (taskData) {
            let targetTaskId = taskData.taskId;
            
            // If no taskId provided, try to find task by other criteria
            if (!targetTaskId && taskData.title) {
              const foundTask = tasks.find(t => 
                t.title.toLowerCase().includes(taskData.title.toLowerCase()) ||
                taskData.title.toLowerCase().includes(t.title.toLowerCase())
              );
              targetTaskId = foundTask?.id;
            }
            
            if (targetTaskId) {
              await toggleCompleted(targetTaskId);
              const completedTask = tasks.find(t => t.id === targetTaskId);
              setTimeout(() => {
                setChatMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `✅ Task "${completedTask?.title}" marked as completed!` }
                ]);
                toast({
                  title: "Task Completed! 🎉",
                  description: `"${completedTask?.title}" has been completed.`
                });
              }, 500);
            }
          }
          break;

        case 'COMPLETE_MULTIPLE':
          {
            const { criteria } = parsedResponse;
            const matchingTasks = filterTasksByCriteria(tasks, criteria, action);
            
            if (matchingTasks.length === 0) {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: "📝 No tasks found matching your criteria." }
              ]);
              break;
            }

            try {
              await bulkTasksApi({ operation: 'complete', taskIds: matchingTasks.map(t => t.id) });
              // Refresh tasks from backend to get updated state
              await refreshTasks();
            } catch (e) {
              console.error('Bulk complete API failed', e);
            }
            
            setTimeout(() => {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: `✅ Successfully completed ${matchingTasks.length} task(s)!` }
              ]);
              toast({
                title: "Bulk Complete! 🎉",
                description: `${matchingTasks.length} tasks marked as completed.`
              });
            }, 500);
          }
          break;

        case 'STAR_TASK':
          if (taskData) {
            let targetTaskId = taskData.taskId;
            
            // If no taskId provided, try to find task by other criteria
            if (!targetTaskId && taskData.title) {
              const foundTask = tasks.find(t => 
                t.title.toLowerCase().includes(taskData.title.toLowerCase()) ||
                taskData.title.toLowerCase().includes(t.title.toLowerCase())
              );
              targetTaskId = foundTask?.id;
            }
            
            if (targetTaskId) {
              await toggleStarred(targetTaskId);
              const starredTask = tasks.find(t => t.id === targetTaskId);
              setTimeout(() => {
                setChatMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `⭐ Task "${starredTask?.title}" starred!` }
                ]);
                toast({
                  title: "Task Starred! ⭐",
                  description: `"${starredTask?.title}" has been starred.`
                });
              }, 500);
            }
          }
          break;

        case 'STAR_MULTIPLE':
          {
            const { criteria } = parsedResponse;
            const matchingTasks = filterTasksByCriteria(tasks, criteria, action);
            
            if (matchingTasks.length === 0) {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: "📝 No tasks found matching your criteria." }
              ]);
              break;
            }

            try {
              await bulkTasksApi({ operation: 'star', taskIds: matchingTasks.map(t => t.id) });
              // Refresh tasks from backend to get updated state
              await refreshTasks();
            } catch (e) {
              console.error('Bulk star API failed', e);
            }
            
            setTimeout(() => {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: `⭐ Successfully starred ${matchingTasks.length} task(s)!` }
              ]);
              toast({
                title: "Bulk Star! ⭐",
                description: `${matchingTasks.length} tasks have been starred.`
              });
            }, 500);
          }
          break;

        case 'UPDATE_MULTIPLE':
        case 'BULK_PRIORITY':
        case 'RESCHEDULE_MULTIPLE':
          {
            const { criteria } = parsedResponse;
            const matchingTasks = filterTasksByCriteria(tasks, criteria, action);
            
            if (matchingTasks.length === 0) {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: "📝 No tasks found matching your criteria." }
              ]);
              break;
            }

            try {
              await bulkTasksApi({ operation: 'update', taskIds: matchingTasks.map(t => t.id), update: taskData });
              // Refresh tasks from backend to get updated state
              await refreshTasks();
            } catch (e) {
              console.error('Bulk update API failed', e);
            }
            
            setTimeout(() => {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: `✅ Successfully updated ${matchingTasks.length} task(s)!` }
              ]);
              toast({
                title: "Bulk Update! 🔄",
                description: `${matchingTasks.length} tasks have been updated.`
              });
            }, 500);
          }
          break;

        case 'LIST_TASKS':
          {
            const { criteria } = parsedResponse;
            let filteredTasks: Task[] = tasks;
            try {
              if (criteria) {
                filteredTasks = await listTasksApi(criteria as any);
              } else {
                filteredTasks = await listTasksApi();
              }
            } catch (e) {
              console.error('List tasks API failed, falling back to local', e);
              if (criteria) filteredTasks = filterTasksByCriteria(tasks, criteria, action);
            }
            
            const tasksList = filteredTasks.length > 0 
              ? filteredTasks.map(task => {
                  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
                  const statusEmoji = task.completed ? '✅' : task.starred ? '⭐' : isOverdue ? '⚠️' : '📝';
                  const priorityText = task.priority === 'high' ? '🔥' : task.priority === 'low' ? '📝' : '⭐';
                  return `${statusEmoji} **${task.title}** (${priorityText} ${task.priority}, due ${task.dueDate})`;
                }).join('\n')
              : "No tasks found matching your criteria.";
            
            setTimeout(() => {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: `📋 **Your Tasks:**\n\n${tasksList}` }
              ]);
            }, 500);
          }
          break;

        case 'ANALYTICS':
          {
            let totalTasks = tasks.length, completedTasks = 0, overdueTasks = 0, highPriorityTasks = 0, starredTasks = 0, completionRate = 0;
            try {
              const stats = await analyticsApi();
              totalTasks = stats.total;
              completedTasks = stats.completed;
              overdueTasks = stats.overdue;
              highPriorityTasks = stats.highPriorityOpen;
              completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              starredTasks = tasks.filter(t => t.starred).length; // backend doesn’t compute starred count; keep local UI estimate
            } catch (e) {
              console.error('Analytics API failed, using local calculation', e);
              const today = new Date();
              completedTasks = tasks.filter(t => t.completed).length;
              overdueTasks = tasks.filter(t => new Date(t.dueDate) < today && !t.completed).length;
              highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.completed).length;
              starredTasks = tasks.filter(t => t.starred).length;
              completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            }
            
            setTimeout(() => {
              setChatMessages(prev => [
                ...prev,
                { 
                  role: 'assistant', 
                  content: `� **Task Analytics**\n\n📝 Total Tasks: ${totalTasks}\n✅ Completed: ${completedTasks} (${completionRate}%)\n⚠️ Overdue: ${overdueTasks}\n🔥 High Priority: ${highPriorityTasks}\n⭐ Starred: ${starredTasks}\n\n${overdueTasks > 0 ? '⚠️ You have overdue tasks that need attention!' : '🎉 No overdue tasks!'}` 
                }
              ]);
            }, 500);
          }
          break;

        case 'ORGANIZE_TASKS':
          {
            const courseGroups = tasks.reduce((groups, task) => {
              const course = task.course || 'General';
              if (!groups[course]) groups[course] = [];
              groups[course].push(task);
              return groups;
            }, {} as Record<string, typeof tasks>);
            
            const organizedList = Object.entries(courseGroups).map(([course, courseTasks]) => {
              const taskList = courseTasks.map(t => `  • ${t.title} (${t.priority})`).join('\n');
              return `**${course}** (${courseTasks.length} tasks)\n${taskList}`;
            }).join('\n\n');
            
            setTimeout(() => {
              setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: `🗂️ **Organized Tasks by Course:**\n\n${organizedList}` }
              ]);
            }, 500);
          }
          break;

        case 'CLARIFY':
          // Store clarification context to handle next user reply as continuation
          setClarificationContext({ originalQuery: originalQuery, question: parsedResponse?.taskData?.clarificationQuestion });
          break;

        default:
          setChatMessages(prev => [
            ...prev,
            { role: 'assistant', content: "I'm not sure how to help with that. Could you please be more specific about what task management action you'd like to perform?" }
          ]);
      }

    } catch (error) {
      console.error("Error handling AI agent response:", error);
      
      // Fallback: try simple rule-based understanding as last resort
      const simpleFallback = trySimpleTaskParsing(originalQuery);
      if (simpleFallback) {
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: simpleFallback.response }
        ]);
        
        // Execute the simple action
        if (simpleFallback.action === 'CREATE_TASK' && simpleFallback.taskData?.title) {
          const newTask = {
            title: simpleFallback.taskData.title,
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: undefined,
            priority: 'medium' as const,
            status: 'pending' as const,
            course: 'General',
            tags: [],
            completed: false,
            starred: false
          };
          addTask(newTask);
          
          setTimeout(() => {
            toast({
              title: "Task Created! 🎉",
              description: `"${newTask.title}" has been added using fallback parsing.`
            });
          }, 500);
        }
      } else {
        setChatMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: "I encountered an error while processing your request. Please try again with a clearer task management request, such as:\n\n• 'Create task: [task name]'\n• 'Complete: [task name]'\n• 'Delete: [task name]'\n• 'Show my tasks'" 
          }
        ]);
      }
    }
  };

  // Simple fallback parsing for when AI completely fails
  const trySimpleTaskParsing = (query: string): { action: string, taskData?: any, response: string } | null => {
    const lowerQuery = query.toLowerCase();
    
    // Simple task creation
    if (lowerQuery.includes('create') && (lowerQuery.includes('task') || lowerQuery.includes('todo'))) {
      const titleMatch = query.match(/create.*?(?:task|todo)[\s:]*(.+)/i);
      if (titleMatch && titleMatch[1]) {
        return {
          action: 'CREATE_TASK',
          taskData: { title: titleMatch[1].trim() },
          response: `Creating task "${titleMatch[1].trim()}" using fallback parsing...`
        };
      }
    }
    
    // Simple task listing
    if (lowerQuery.includes('show') || lowerQuery.includes('list')) {
      const tasksList = tasks.length > 0 
        ? tasks.map(task => `• ${task.title} (${task.priority} priority)`).join('\n')
        : "You don't have any tasks yet.";
      return {
        action: 'LIST_TASKS',
        response: `📋 **Your Tasks:**\n\n${tasksList}`
      };
    }
    
    return null;
  };

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
      
      // Add conversation context for personalized responses
      const conversationContext = conversationMemory.getConversationContext(8);
      const sessionSummary = conversationMemory.getSessionSummary();
      
      let contextualQuery = userQuery;
      if (conversationContext && conversationMemory.hasConversationContext()) {
        contextualQuery = `${conversationContext}Current question: ${userQuery}
        
Session Info: This conversation has ${sessionSummary.messageCount} messages covering topics: ${sessionSummary.topics.join(', ')}. 
Please provide a personalized response that considers our conversation history and maintains context continuity.`;
      }
      
      // Save user message to conversation memory
      conversationMemory.addMessage('user', userQuery, 'ask');
      
      // Show loading message
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Thinking...' }
      ]);
      
      let aiResponse = "";
      
      if (selectedModel === "gemini-2.5-pro" || selectedModel === "gemini-2.5-flash") {
        // Call Google Gemini API with contextual query
        aiResponse = await callGeminiAPI(contextualQuery, apiKey);
      } else if (selectedModel === "gpt-4") {
        // Call OpenAI API with contextual query
        aiResponse = await callOpenAIAPI(contextualQuery, apiKey);
      } else if (selectedModel === "meta-llama/llama-4-maverick-17b-128e-instruct" || selectedModel === "meta-llama/llama-4-scout-17b-16e-instruct") {
        // Call Groq API with contextual query
        aiResponse = await callGroqAPI(contextualQuery, apiKey);
      } else {
        // Fallback for other models
        aiResponse = `I'm using the ${selectedModel} model. Your question was: "${userQuery}". In a full implementation, this would connect to the appropriate AI service.`;
      }
      
      // Save assistant response to conversation memory
      conversationMemory.addMessage('assistant', aiResponse, 'ask');
      
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
                      {/* Conversation Memory Indicator */}
                      {conversationMemory.hasConversationContext() && (
                        <span 
                          className="ml-2 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1"
                          title={`Conversation has ${conversationMemory.getSessionSummary().messageCount} messages`}
                        >
                          Memory: {conversationMemory.getSessionSummary().messageCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* New Conversation Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full h-6 w-6 p-0 hover:bg-gray-100/50"
                        onClick={() => {
                          conversationMemory.clearCurrentSession();
                          setChatMessages([]);
                          console.log('Started new conversation session');
                        }}
                        title="New Conversation"
                        disabled={isCreatingTask}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {/* Close Button */}
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