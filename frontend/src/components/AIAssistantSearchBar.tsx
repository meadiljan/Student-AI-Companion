import { Plus, Mic, Bot, X, CheckCircle, Clock, Calendar, Flag, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import React from "react";
import { eventManager, SettingsChangeListener, AIAssistantTriggerListener } from "@/utils/eventManager";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/contexts/TasksContext";
import { bulkTasks as bulkTasksApi, listTasks as listTasksApi, analytics as analyticsApi } from "@/services/agentApi";
import { useTasks } from "@/contexts/TasksContext";
import { useCourses } from "@/contexts/CoursesContext";
import { conversationMemory } from "@/services/conversationMemory";
import { courseDetectionService } from "@/services/courseDetectionService";

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
  const { courses } = useCourses();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-pro"); // Add state for selected model
  const [isCreatingTask, setIsCreatingTask] = useState(false); // State to track task creation progress
  const [actionProgress, setActionProgress] = useState<{
    isActive: boolean;
    currentStep: string;
    totalSteps: number;
    currentStepIndex: number;
  }>({
    isActive: false,
    currentStep: '',
    totalSteps: 0,
    currentStepIndex: 0
  });
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Helper function to scroll to the latest user query
  const scrollToLatestUserQuery = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        const userMsgs = Array.from(container.querySelectorAll('[data-user-msg]')) as HTMLElement[];
        if (userMsgs.length > 0) {
          const lastUser = userMsgs[userMsgs.length - 1];
          try {
            container.scrollTop = Math.max(0, lastUser.offsetTop - container.offsetTop - 8);
          } catch (e) {
            container.scrollTop = container.scrollHeight;
          }
        }
      }
    }, 100);
  };

  // Fallback intent parser when AI JSON parsing fails
  const parseSimpleIntent = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Create task patterns (expanded)
    if (lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('new task') || 
        lowerQuery.includes('make a task') || lowerQuery.includes('task:') || lowerQuery.includes('todo:') ||
        lowerQuery.includes('remind me to') || lowerQuery.includes('i need to') ||
        lowerQuery.match(/^(homework|assignment|project|study|work on|do|finish|complete|write|read|prepare|review|practice|learn)/)) {
      
      // Extract task title - try to get everything after common prefixes
      let title = query;
      const prefixes = [
        'create task:', 'add task:', 'new task:', 'create:', 'add:', 'task:', 'todo:', 
        'create task', 'add task', 'new task', 'make a task', 'remind me to', 'i need to'
      ];
      
      for (const prefix of prefixes) {
        if (lowerQuery.includes(prefix)) {
          title = query.substring(query.toLowerCase().indexOf(prefix) + prefix.length).trim();
          break;
        }
      }
      
      // Clean up the title
      title = title.replace(/^[:,-]\s*/, '').trim();
      
      // If no title extracted or title is too short, use original query
      if (!title || title.length < 2) {
        title = query;
      }
      
      return {
        action: 'CREATE_TASK',
        taskData: { 
          title: title,
          description: '',
          priority: 'medium',
          course: 'General'
        },
        response: `I've created a task: "${title}"`
      };
    }
    
    // List tasks patterns (expanded)
    if (lowerQuery.includes('show') || lowerQuery.includes('list') || lowerQuery.includes('my tasks') ||
        lowerQuery.includes('what tasks') || lowerQuery.includes('tasks?') || lowerQuery === 'tasks' ||
        lowerQuery.includes('what do i have') || lowerQuery.includes('what\'s on my') ||
        lowerQuery.includes('my todo') || lowerQuery.includes('my schedule')) {
      return {
        action: 'LIST_TASKS',
        taskData: {},
        response: 'Here are your current tasks:'
      };
    }
    
    // Complete task patterns (expanded)
    if (lowerQuery.includes('complete') || lowerQuery.includes('mark done') || lowerQuery.includes('finished') ||
        lowerQuery.includes('mark as complete') || lowerQuery.includes('done with') ||
        lowerQuery.includes('mark complete') || lowerQuery.includes('check off') ||
        lowerQuery.includes('i finished') || lowerQuery.includes('i completed')) {
      
      // Try to extract task name
      const taskName = query.replace(/(complete|mark done|finished|mark as complete|done with|mark complete|check off|i finished|i completed)/gi, '').trim();
      
      return {
        action: 'COMPLETE_TASK',
        taskData: { 
          taskId: 'search',
          searchTerm: taskName
        },
        response: taskName ? `Looking for task "${taskName}" to mark as complete...` : 'I need more specific information to mark a task as complete. Which task would you like to mark as done?'
      };
    }
    
    // Delete task patterns (expanded)
    if (lowerQuery.includes('delete') || lowerQuery.includes('remove') || lowerQuery.includes('cancel') ||
        lowerQuery.includes('get rid of') || lowerQuery.includes('take away') ||
        lowerQuery.includes('eliminate') || lowerQuery.includes('clear')) {
      
      // Try to extract task name
      const taskName = query.replace(/(delete|remove|cancel|get rid of|take away|eliminate|clear)/gi, '').trim();
      
      return {
        action: 'DELETE_TASK',
        taskData: { 
          taskId: 'search',
          searchTerm: taskName
        },
        response: taskName ? `Looking for task "${taskName}" to remove...` : 'I need more specific information to delete a task. Which task would you like to remove?'
      };
    }
    
    // Update task patterns
    if (lowerQuery.includes('update') || lowerQuery.includes('change') || lowerQuery.includes('modify') ||
        lowerQuery.includes('edit') || lowerQuery.includes('reschedule')) {
      return {
        action: 'UPDATE_TASK',
        taskData: { taskId: 'search' },
        response: 'I need more specific information about which task to update and what changes to make.'
      };
    }
    
    // Default fallback - treat as CREATE_TASK if it seems like a task description
    if (lowerQuery.length > 3 && !lowerQuery.includes('?') && !lowerQuery.includes('how') && 
        !lowerQuery.includes('what') && !lowerQuery.includes('when') && !lowerQuery.includes('where') &&
        !lowerQuery.includes('why') && !lowerQuery.includes('explain')) {
      return {
        action: 'CREATE_TASK',
        taskData: { 
          title: query,
          description: '',
          priority: 'medium',
          course: 'General'
        },
        response: `I've created a task: "${query}"`
      };
    }
    
    // If nothing matches, return null
    return null;
  };

  // Handle clicks outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        // Collapse assistant when clicking outside and persist the choice
        setIsExpanded(false);
        try {
          localStorage.setItem('assistantExpanded', JSON.stringify(false));
        } catch (e) {}
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatMessages]);

  // Persist expansion state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('assistantExpanded', JSON.stringify(isExpanded));
    } catch (e) {}
  }, [isExpanded]);

  // Restore saved expansion state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('assistantExpanded');
      if (saved !== null) {
        const val = JSON.parse(saved);
        setIsExpanded(Boolean(val));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // When assistant opens, scroll quickly to the last user message (not the last AI response)
  useEffect(() => {
    if (!isExpanded) return;
    const container = chatContainerRef.current;
    if (!container) return;

    // Query user messages (marked with data-user-msg)
    const userMsgs = Array.from(container.querySelectorAll('[data-user-msg]')) as HTMLElement[];
    if (userMsgs.length === 0) return;

    const lastUser = userMsgs[userMsgs.length - 1];
    // Fast scroll for snappy UX; small offset for padding
    try {
      container.scrollTop = Math.max(0, lastUser.offsetTop - container.offsetTop - 8);
    } catch (e) {
      container.scrollTop = container.scrollHeight;
    }
  }, [isExpanded]);
  
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

  // Unified assistant doesn't require command menu keyboard handling

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    // Do not auto-collapse on mouse leave. We collapse only when user clicks outside.
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  // Determine intent by asking the LLM for a structured answer and a short rationale
  const determineIntentViaLLM = async (text: string): Promise<{ intent: 'create' | 'ask'; reasoning: string }> => {
    try {
      const apiKey = localStorage.getItem('aiApiKey');
      if (!apiKey) return { intent: 'ask', reasoning: 'No API key configured; defaulting to ASK.' };

  // Prompt asks for a JSON response: {"intent":"CREATE"|"ASK","reasoning":"..."}
  // Ask the model for a concise rationale (1-2 sentences). Do NOT reveal internal chain-of-thought — only a short, factual reason.
  const prompt = `You are an assistant that decides whether a user message should trigger an automated task/action (CREATE) or is an informational/question query (ASK).
Return a single JSON object with exactly two keys: intent and reasoning.
- intent: one of the strings CREATE or ASK (uppercase).
- reasoning: a concise 1-2 sentence explanation of why you chose that intent. Do not reveal step-by-step chain-of-thought; keep it short and factual.

Examples:
User message: "Add a task to study for calculus exam tomorrow at 6pm"
Output: {"intent":"CREATE","reasoning":"User explicitly asked to add a task with a date/time; this is actionable."}

User message: "How do I solve this integral?"
Output: {"intent":"ASK","reasoning":"User is requesting an explanation for a math question, not asking to perform a task."}

Now evaluate the user message below and return only the JSON object.
User message: "${text.replace(/"/g, '\"')}"
`;

      let llmResponse = '';
      if (selectedModel === 'gemini-2.5-pro' || selectedModel === 'gemini-2.5-flash') {
        llmResponse = await callGeminiAPI(prompt, apiKey);
      } else if (selectedModel === 'gpt-4') {
        llmResponse = await callOpenAIAPI(prompt, apiKey);
      } else if (selectedModel === 'meta-llama/llama-4-maverick-17b-128e-instruct' || selectedModel === 'meta-llama/llama-4-scout-17b-16e-instruct') {
        llmResponse = await callGroqAPI(prompt, apiKey);
      } else {
        llmResponse = await callOpenAIAPI(prompt, apiKey);
      }

      // Try to parse JSON; fall back to heuristic if parsing fails
      try {
        const parsed = JSON.parse(llmResponse.trim());
        const intentRaw = (parsed.intent || '').toString().toLowerCase();
        const reasoning = parsed.reasoning ? String(parsed.reasoning) : '';
        if (intentRaw.includes('create')) return { intent: 'create', reasoning };
        if (intentRaw.includes('ask')) return { intent: 'ask', reasoning };
      } catch (e) {
        // not strict JSON: do a best-effort parse
        const txt = llmResponse.trim().toLowerCase();
        const reasoning = llmResponse.trim();
        if (txt.includes('create')) return { intent: 'create', reasoning };
        if (txt.includes('ask')) return { intent: 'ask', reasoning };
      }

      // Conservative default: if there is any lingering agent context, treat as create
      if (pendingAgentAction || clarificationContext) return { intent: 'create', reasoning: 'Pending agent context detected; defaulting to CREATE.' };

      return { intent: 'ask', reasoning: 'Defaulted to ASK after analysis.' };
    } catch (err) {
      console.error('Intent detection error', err);
      return { intent: 'ask', reasoning: `Error during intent detection: ${err instanceof Error ? err.message : String(err)}` };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const queryToProcess = trimmedQuery;

    // IMMEDIATE FEEDBACK: Show user query and loading state right away
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: queryToProcess },
      { role: 'assistant', content: 'Thinking...' }
    ]);
    setQuery('');
    
    // Scroll to the latest user query after adding the message
    scrollToLatestUserQuery();

    // Focus the input field after submitting
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);

    try {
      // Now do intent detection in the background
      const effectiveCommand = await determineIntentViaLLM(queryToProcess);
      const { intent, reasoning } = effectiveCommand as any;

      // Remove the "Thinking..." message
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove "Thinking..." message
        return newMessages;
      });

      // Check if it's a command
      if (intent === 'create') {
        // First: handle pending confirmations or clarifications in Agent mode
        const lower = queryToProcess.trim().toLowerCase();
        const isAffirm = ["yes","y","confirm","do it","proceed","go ahead"].includes(lower);
        const isDeny = ["no","n","cancel","stop","abort"].includes(lower);

        // If we have a pending destructive action awaiting confirmation
        if (pendingAgentAction && (isAffirm || isDeny)) {
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
          setClarificationContext(null);
          callAIModelForAgent(combined);
          return;
        }

        // Handle Agent mode with AI-powered understanding
        callAIModelForAgent(queryToProcess);
        
    } else if (intent === 'ask') {
        // Handle ask command - Call AI API
        callAIModel(queryToProcess);
    } else {
        // Handle legacy event creation or unknown intent
        handleLegacyEventCreation(queryToProcess);
    }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      // Remove loading message and show error
      setChatMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.content === 'Thinking...') {
          newMessages.pop(); // Remove "Thinking..." message
        }
        newMessages.push({ 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.' 
        });
        return newMessages;
      });
    }
  };

  // Helper function to handle legacy event creation
  const handleLegacyEventCreation = (queryToProcess: string) => {
    // Try to parse the query as an event creation command (legacy behavior)
    const eventData = parseEventFromQuery(queryToProcess);
    
    if (eventData) {
      // Use event manager to notify calendar components
      eventManager.createEvent(eventData);
      
      // Also call the prop callback if provided (for backward compatibility)
      if (onCreateEvent) {
        onCreateEvent(eventData);
      }
      
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

      setIsExpanded(false);
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

  // Listen for AI assistant trigger events from other components
  useEffect(() => {
    const handleAIAssistantTrigger: AIAssistantTriggerListener = (triggerQuery) => {
      // Set the query and expand the assistant
      setQuery(triggerQuery);
      setIsExpanded(true);
      
      // Process the query using the same logic as handleSubmit
      setTimeout(async () => {
        if (!triggerQuery.trim()) return;

        const queryToProcess = triggerQuery.trim();

        // IMMEDIATE FEEDBACK: Show user query and loading state right away
        setChatMessages(prev => [
          ...prev,
          { role: 'user', content: queryToProcess },
          { role: 'assistant', content: 'Thinking...' }
        ]);
        
        // Clear the query input
        setQuery('');

        try {
          // Now do intent detection in the background
          const effectiveCommand = await determineIntentViaLLM(queryToProcess);
          const { intent } = effectiveCommand as any;

          // Remove the "Thinking..." message
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages.pop(); // Remove "Thinking..." message
            return newMessages;
          });

          // Check if it's a command
          if (intent === 'create') {
            // Handle Agent mode with AI-powered understanding
            callAIModelForAgent(queryToProcess);
          } else if (intent === 'ask') {
            // Handle ask command - Call AI API
            callAIModel(queryToProcess);
          } else {
            // Handle legacy event creation or unknown intent
            handleLegacyEventCreation(queryToProcess);
          }

        } catch (error) {
          console.error('Error processing triggered query:', error);
          
          // Remove loading message and show error
          setChatMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.content === 'Thinking...') {
              newMessages.pop(); // Remove "Thinking..." message
            }
            newMessages.push({ 
              role: 'assistant', 
              content: 'Sorry, I encountered an error processing your request. Please try again.' 
            });
            return newMessages;
          });
        }
      }, 100); // Small delay to ensure the component is fully expanded
    };

    eventManager.addAIAssistantTriggerListener(handleAIAssistantTrigger);

    return () => {
      eventManager.removeAIAssistantTriggerListener(handleAIAssistantTrigger);
    };
  }, []); // No dependencies needed since we're not using external variables inside

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
    conversationMemory.addMessage('user', userQuery);
      
      // Update loading message to be more specific (since "Thinking..." is already shown)
      setChatMessages(prev => {
        const newMessages = [...prev];
        // Replace the last message if it's "Thinking..."
        if (newMessages[newMessages.length - 1]?.content === 'Thinking...') {
          newMessages[newMessages.length - 1] = { role: 'assistant', content: 'Analyzing your request...' };
        } else {
          newMessages.push({ role: 'assistant', content: 'Analyzing your request...' });
        }
        return newMessages;
      });
      
      // Create enhanced prompt for task management with conversation context
      const taskManagementPrompt = `You are an advanced AI task management assistant with comprehensive capabilities and conversation memory. Analyze user requests and determine appropriate actions, including complex bulk operations.

${conversationContext ? `CONVERSATION CONTEXT:
${conversationContext}
Session Info: This conversation has ${sessionSummary.messageCount} messages covering topics: ${sessionSummary.topics.join(', ')}.
Consider previous interactions and provide personalized, context-aware responses. Reference previous tasks, preferences, and conversation patterns when relevant.

` : ''}AVAILABLE ACTIONS:
- CREATE_TASK: Create a single new task
- CREATE_MULTIPLE_TASKS: Create multiple tasks in one request
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
- MULTI_ACTION: Execute multiple different actions simultaneously
- CLARIFY: Ask for more information when unclear

TASK DESCRIPTION GENERATION:
When creating tasks, generate meaningful descriptions that:
1. **Context-Aware**: Relate to the user's original query and provide additional context
2. **Course-Specific**: Include relevant details based on the assigned course (e.g., "Study calculus concepts including derivatives and limits" for calculus course)
3. **Actionable**: Provide clear guidance on what needs to be accomplished
4. **Detailed**: Expand beyond the title with specific requirements or steps
5. **Educational**: For academic tasks, include learning objectives or study focus areas
Examples:
- Query: "Study for calculus exam tomorrow" → Description: "Review calculus concepts including derivatives, integrals, and limits. Focus on problem-solving techniques and practice sample problems from chapters 4-6."
- Query: "Work on typography project" → Description: "Continue developing the typography design project. Focus on font selection, layout composition, and text hierarchy principles learned in class."
- Query: "UX research for mobile app" → Description: "Conduct user experience research for mobile application design. Include user interviews, wireframe analysis, and usability testing considerations."

CURRENT DATE: ${new Date().toISOString().split('T')[0]}

CURRENT TASKS:
${tasks.map(task => {
  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
  return `- ID: ${task.id}, Title: "${task.title}", Status: ${task.status}, Priority: ${task.priority}, Due: ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}, Course: ${task.course}, Completed: ${task.completed}, Starred: ${task.starred}${isOverdue ? ' [OVERDUE]' : ''}`;
}).join('\n')}

AVAILABLE COURSES:
${courses.map(course => `- ${course.id}: "${course.title}" (Instructor: ${course.instructor})`).join('\n')}

INTELLIGENT COURSE ASSIGNMENT:
When creating tasks, I can automatically detect and assign appropriate courses based on the task content, keywords, and context. Available courses include:
${courses.map(course => `• ${course.title} - Keywords: ${course.id.includes('typography') ? 'fonts, typography, type design' : course.id.includes('ux') ? 'mobile design, UI/UX, user experience' : course.id.includes('illustration') ? 'digital art, drawing, illustration' : course.id.includes('web') ? 'web development, programming, HTML, CSS, JavaScript, React' : course.id.includes('art-history') ? 'art history, renaissance, art movements' : course.id.includes('calculus') ? 'math, calculus, mathematics' : 'general'}`).join('\n')}

If a task mentions course-related content or keywords, automatically assign it to the most relevant course. Use 'General' only when no course relationship is detected.

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

MULTIPLE TASK CREATION EXAMPLES:
- "create tasks: finish homework, study for exam, and buy groceries" → CREATE_MULTIPLE_TASKS
- "add three tasks: math assignment, history project, call mom" → CREATE_MULTIPLE_TASKS
- "make tasks for: workout at 6am, meeting at 2pm, dinner at 7pm" → CREATE_MULTIPLE_TASKS
- "create tasks for today: review notes, complete lab, submit report" → CREATE_MULTIPLE_TASKS

MULTI-ACTION EXAMPLES:
- "create task: study math, and mark homework task as done" → MULTI_ACTION
- "delete completed tasks and create new task: prepare presentation" → MULTI_ACTION
- "star all high priority tasks and create task: weekend planning" → MULTI_ACTION
- "complete the math task and create tasks: review chemistry, call advisor" → MULTI_ACTION

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
    // For single task creation or bulk operations: update data
    "title": "new title",
    "description": "Meaningful description based on user query and course context",
    "dueDate": "YYYY-MM-DD", 
    "priority": "high/medium/low",
    "course": "course name",
    "completed": true/false,
    "starred": true/false
  },
  // For CREATE_MULTIPLE_TASKS: array of task objects
  "multipleTasks": [
    {
      "title": "Task 1 title",
      "description": "Detailed description based on query context and course requirements",
      "dueDate": "YYYY-MM-DD",
      "dueTime": "HH:MM AM/PM",
      "priority": "high/medium/low",
      "course": "course name"
    },
    {
      "title": "Task 2 title",
      "description": "Contextual description relating to the task and course content",
      "dueDate": "YYYY-MM-DD",
      "priority": "high/medium/low",
      "course": "course name"
    }
  ],
  // For MULTI_ACTION: array of actions to execute
  "multiActions": [
    {
      "action": "CREATE_TASK",
      "taskData": {"title": "New task", "priority": "high"}
    },
    {
      "action": "COMPLETE_TASK", 
      "taskData": {"taskId": "existing_task_id"}
    },
    {
      "action": "DELETE_MULTIPLE",
      "criteria": {"completed": true}
    }
  ],
  "confirmationRequired": true/false, // For destructive bulk operations
  "response": "Detailed, conversational response explaining the action"
}

SINGLE TASK OPERATION EXAMPLES:
- "delete the math homework" → {"action": "DELETE_TASK", "taskData": {"taskId": "1234"}}
- "mark typography paper as complete" → {"action": "COMPLETE_TASK", "taskData": {"taskId": "1234"}}
- "star the design project" → {"action": "STAR_TASK", "taskData": {"taskId": "1234"}}
- "update math task priority to high" → {"action": "UPDATE_TASK", "taskData": {"taskId": "1234", "priority": "high"}}

MULTIPLE TASK CREATION EXAMPLES:
- "create tasks: study math, call mom, buy groceries" → {"action": "CREATE_MULTIPLE_TASKS", "multipleTasks": [{"title": "Study math", "priority": "medium"}, {"title": "Call mom", "priority": "low"}, {"title": "Buy groceries", "priority": "medium"}]}

MULTI-ACTION EXAMPLES:
- "complete homework task and create new task: study for exam" → {"action": "MULTI_ACTION", "multiActions": [{"action": "COMPLETE_TASK", "taskData": {"taskId": "homework_id"}}, {"action": "CREATE_TASK", "taskData": {"title": "Study for exam"}}]}

IMPORTANT: For single task operations (UPDATE_TASK, DELETE_TASK, COMPLETE_TASK, STAR_TASK), you MUST identify the exact task by matching the user's description to the task titles/content in the current task list above, then provide the corresponding task ID in taskData.taskId.

CRITICAL: For all task creation (CREATE_TASK, CREATE_MULTIPLE_TASKS, MULTI_ACTION with CREATE_TASK), ALWAYS include meaningful, contextual descriptions. Never use generic descriptions like "Task description". Generate specific, course-aware, actionable descriptions based on the user's query and assigned course context.

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
      // Try to parse JSON response from AI first to get the action type
      let parsedResponse;
      try {
        // Multiple strategies to extract JSON from response
        let jsonStr = aiResponse.trim();
        
        // Strategy 1: Try direct parsing
        try {
          parsedResponse = JSON.parse(jsonStr);
        } catch {
          // Strategy 2: Extract JSON between curly braces
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
            parsedResponse = JSON.parse(jsonStr);
          } else {
            // Strategy 3: Look for JSON in code blocks
            const codeBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
              jsonStr = codeBlockMatch[1];
              parsedResponse = JSON.parse(jsonStr);
            } else {
              // Strategy 4: Try to find JSON-like structure with regex
              const jsonRegex = /\{\s*"action"\s*:\s*"[^"]+"/;
              if (jsonRegex.test(aiResponse)) {
                const startIndex = aiResponse.indexOf('{');
                const endIndex = aiResponse.lastIndexOf('}') + 1;
                if (startIndex !== -1 && endIndex > startIndex) {
                  jsonStr = aiResponse.substring(startIndex, endIndex);
                  parsedResponse = JSON.parse(jsonStr);
                }
              }
            }
          }
        }
        
        // Validate required fields
        if (!parsedResponse || !parsedResponse.action || !parsedResponse.response) {
          throw new Error("Invalid response format - missing required fields");
        }
        
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.log("Raw AI response:", aiResponse);
        
        // Try fallback simple intent parsing
        const fallbackIntent = parseSimpleIntent(originalQuery);
        
        if (fallbackIntent) {
          // Use the fallback intent
          parsedResponse = fallbackIntent;
          console.log("Using fallback intent:", fallbackIntent);
        } else {
          // If fallback also fails, show enhanced error message
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages.pop(); // Remove loading message
            newMessages.push({ 
              role: 'assistant', 
              content: `I'm having trouble understanding your request. Here are some ways you can interact with me:\n\n**📝 Create Tasks:**\n• "Create task: Study for math exam"\n• "Add homework assignment"\n• "Remind me to call mom"\n\n**✅ Complete Tasks:**\n• "Mark done: homework"\n• "Complete math assignment"\n• "I finished the report"\n\n**❌ Delete Tasks:**\n• "Delete math homework"\n• "Remove assignment 1"\n• "Cancel the meeting task"\n\n**📋 View Tasks:**\n• "Show my tasks"\n• "List all todos"\n• "What do I have to do?"\n\nTry rephrasing your request using one of these patterns!` 
            });
            return newMessages;
          });
          return;
        }
      }

      const { action, taskData, response } = parsedResponse;

      // Update loading message
      setChatMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.content.includes('...')) {
          newMessages[newMessages.length - 1] = { 
            role: 'assistant', 
            content: 'Processing...' 
          };
        }
        return newMessages;
      });

      // Debug logging
      console.log("AI Response:", { action, taskData, response });

    // Save assistant response to conversation memory
    conversationMemory.addMessage('assistant', response);

      // Replace the loading message with the AI's response
      setChatMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.content.includes('...')) {
          newMessages[newMessages.length - 1] = { role: 'assistant', content: response };
        } else {
          newMessages.push({ role: 'assistant', content: response });
        }
        return newMessages;
      });

      // Execute the determined action
      switch (action) {
        case 'CREATE_TASK':
          if (taskData && taskData.title) {
            // Start progress tracking
            setActionProgress({
              isActive: true,
              currentStep: 'Analyzing task details...',
              totalSteps: 4,
              currentStepIndex: 1
            });
            
            // Smart defaults for task creation
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            // Step 2: Course detection
            setActionProgress(prev => ({
              ...prev,
              currentStep: 'Detecting course assignment...',
              currentStepIndex: 2
            }));
            
            // Detect course intelligently if not specified
            let detectedCourse = taskData.course || 'General';
            if (!taskData.course || taskData.course === 'General') {
              // Use both original query and task title/description for course detection
              const detectionQuery = `${originalQuery} ${taskData.title} ${taskData.description || ''}`.toLowerCase();
              const intelligentCourse = courseDetectionService.detectCourse(detectionQuery, courses);
              if (intelligentCourse) {
                detectedCourse = intelligentCourse;
              }
            }
            
            // Step 3: Creating task
            setActionProgress(prev => ({
              ...prev,
              currentStep: 'Creating task...',
              currentStepIndex: 3
            }));
            
            const newTask = {
              title: taskData.title,
              description: taskData.description || undefined, // Let TasksContext auto-generate if undefined
              dueDate: taskData.dueDate || today.toISOString().split('T')[0],
              dueTime: taskData.dueTime || undefined,
              priority: (taskData.priority as "low" | "medium" | "high") || 'medium',
              status: 'pending' as const,
              course: detectedCourse,
              tags: taskData.tags || [],
              completed: false,
              starred: false
            };
            
            // Use context method which calls API internally
            await addTask(newTask);
            
            // Step 4: Finalizing
            setActionProgress(prev => ({
              ...prev,
              currentStep: 'Task created successfully!',
              currentStepIndex: 4
            }));
            
            setTimeout(() => {
              // Clear progress state
              setActionProgress({
                isActive: false,
                currentStep: '',
                totalSteps: 0,
                currentStepIndex: 0
              });
              
              const dueDateStr = newTask.dueDate === today.toISOString().split('T')[0] 
                ? 'today' 
                : newTask.dueDate === tomorrow.toISOString().split('T')[0] 
                ? 'tomorrow' 
                : newTask.dueDate;
              
              const timeStr = newTask.dueTime ? ` at ${newTask.dueTime}` : '';
              const priorityEmoji = newTask.priority === 'high' ? '🔥' : newTask.priority === 'low' ? '📝' : '⭐';
              
              // Add course detection context if course was auto-detected
              const courseInfo = detectedCourse !== 'General' && !taskData.course 
                ? `\n🎯 *Auto-detected course based on content*` 
                : '';
              
              setChatMessages(prev => [
                ...prev,
                { 
                  role: 'assistant', 
                  content: `✅ Task created successfully!\n\n${priorityEmoji} **${newTask.title}**\n📅 Due: ${dueDateStr}${timeStr}\n📚 Course: ${newTask.course}\n🏷️ Priority: ${newTask.priority}${courseInfo}` 
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
            
            // Handle search-based task finding (from fallback parser)
            if (taskData.taskId === 'search' && taskData.searchTerm) {
              const searchTerm = taskData.searchTerm.toLowerCase();
              const foundTask = tasks.find(t => 
                t.title.toLowerCase().includes(searchTerm) ||
                searchTerm.includes(t.title.toLowerCase())
              );
              targetTaskId = foundTask?.id;
              
              if (!foundTask) {
                setChatMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `❌ Could not find a task matching "${taskData.searchTerm}". Please check your task list or be more specific.` }
                ]);
                break;
              }
            }
            // If no taskId provided, try to find task by other criteria
            else if (!targetTaskId && taskData.title) {
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
            
            // Handle search-based task finding (from fallback parser)
            if (taskData.taskId === 'search' && taskData.searchTerm) {
              const searchTerm = taskData.searchTerm.toLowerCase();
              const foundTask = tasks.find(t => 
                t.title.toLowerCase().includes(searchTerm) ||
                searchTerm.includes(t.title.toLowerCase())
              );
              targetTaskId = foundTask?.id;
              
              if (!foundTask) {
                setChatMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `❌ Could not find a task matching "${taskData.searchTerm}". Please check your task list or be more specific.` }
                ]);
                break;
              }
            }
            // If no taskId provided, try to find task by other criteria
            else if (!targetTaskId && taskData.title) {
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

        case 'CREATE_MULTIPLE_TASKS':
          if (parsedResponse.multipleTasks && Array.isArray(parsedResponse.multipleTasks)) {
            const today = new Date();
            let createdCount = 0;
            const createdTasks = [];
            
            // Create each task with intelligent course detection
            for (const taskSpec of parsedResponse.multipleTasks) {
              if (taskSpec.title) {
                // Detect course intelligently if not specified
                let detectedCourse = taskSpec.course || 'General';
                if (!taskSpec.course || taskSpec.course === 'General') {
                  // Use original query and task title/description for course detection
                  const detectionQuery = `${originalQuery} ${taskSpec.title} ${taskSpec.description || ''}`.toLowerCase();
                  const intelligentCourse = courseDetectionService.detectCourse(detectionQuery, courses);
                  if (intelligentCourse) {
                    detectedCourse = intelligentCourse;
                  }
                }
                
                const newTask = {
                  title: taskSpec.title,
                  description: taskSpec.description || undefined,
                  dueDate: taskSpec.dueDate || today.toISOString().split('T')[0],
                  dueTime: taskSpec.dueTime || undefined,
                  priority: (taskSpec.priority as "low" | "medium" | "high") || 'medium',
                  status: 'pending' as const,
                  course: detectedCourse,
                  tags: taskSpec.tags || [],
                  completed: false,
                  starred: false
                };
                
                await addTask(newTask);
                createdTasks.push(newTask);
                createdCount++;
              }
            }
            
            setTimeout(() => {
              const taskList = createdTasks.map(task => {
                const priorityEmoji = task.priority === 'high' ? '🔥' : task.priority === 'low' ? '📝' : '⭐';
                return `${priorityEmoji} **${task.title}** (${task.course})`;
              }).join('\n');
              
              // Check if any courses were auto-detected
              const hasAutoDetected = createdTasks.some(task => 
                task.course !== 'General' && 
                !parsedResponse.multipleTasks.find(spec => spec.title === task.title)?.course
              );
              const courseInfo = hasAutoDetected ? `\n🎯 *Some courses were auto-detected based on content*` : '';
              
              setChatMessages(prev => [
                ...prev,
                { 
                  role: 'assistant', 
                  content: `✅ Created ${createdCount} tasks successfully!\n\n${taskList}${courseInfo}` 
                }
              ]);
              
              toast({
                title: `${createdCount} Tasks Created! 🎉`,
                description: `Successfully added ${createdCount} new tasks.`
              });
            }, 500);
          }
          break;

        case 'MULTI_ACTION':
          if (parsedResponse.multiActions && Array.isArray(parsedResponse.multiActions)) {
            let completedActions = 0;
            const actionResults = [];
            
            // Execute each action sequentially
            for (const actionSpec of parsedResponse.multiActions) {
              try {
                switch (actionSpec.action) {
                  case 'CREATE_TASK':
                    if (actionSpec.taskData && actionSpec.taskData.title) {
                      const today = new Date();
                      
                      // Detect course intelligently if not specified
                      let detectedCourse = actionSpec.taskData.course || 'General';
                      if (!actionSpec.taskData.course || actionSpec.taskData.course === 'General') {
                        // Use original query and task title/description for course detection
                        const detectionQuery = `${originalQuery} ${actionSpec.taskData.title} ${actionSpec.taskData.description || ''}`.toLowerCase();
                        const intelligentCourse = courseDetectionService.detectCourse(detectionQuery, courses);
                        if (intelligentCourse) {
                          detectedCourse = intelligentCourse;
                        }
                      }
                      
                      const newTask = {
                        title: actionSpec.taskData.title,
                        description: actionSpec.taskData.description || undefined,
                        dueDate: actionSpec.taskData.dueDate || today.toISOString().split('T')[0],
                        dueTime: actionSpec.taskData.dueTime || undefined,
                        priority: (actionSpec.taskData.priority as "low" | "medium" | "high") || 'medium',
                        status: 'pending' as const,
                        course: detectedCourse,
                        tags: actionSpec.taskData.tags || [],
                        completed: false,
                        starred: false
                      };
                      await addTask(newTask);
                      actionResults.push(`✅ Created task: "${newTask.title}"`);
                      completedActions++;
                    }
                    break;
                    
                  case 'UPDATE_TASK':
                    if (actionSpec.taskData && actionSpec.taskData.taskId) {
                      await updateTask(actionSpec.taskData.taskId, actionSpec.taskData);
                      const task = tasks.find(t => t.id === actionSpec.taskData.taskId);
                      actionResults.push(`✅ Updated task: "${task?.title}"`);
                      completedActions++;
                    }
                    break;
                    
                  case 'DELETE_TASK':
                    if (actionSpec.taskData && actionSpec.taskData.taskId) {
                      const task = tasks.find(t => t.id === actionSpec.taskData.taskId);
                      await deleteTask(actionSpec.taskData.taskId);
                      actionResults.push(`✅ Deleted task: "${task?.title}"`);
                      completedActions++;
                    }
                    break;
                    
                  case 'COMPLETE_TASK':
                    if (actionSpec.taskData && actionSpec.taskData.taskId) {
                      await toggleCompleted(actionSpec.taskData.taskId);
                      const task = tasks.find(t => t.id === actionSpec.taskData.taskId);
                      actionResults.push(`✅ Completed task: "${task?.title}"`);
                      completedActions++;
                    }
                    break;
                    
                  case 'STAR_TASK':
                    if (actionSpec.taskData && actionSpec.taskData.taskId) {
                      await toggleStarred(actionSpec.taskData.taskId);
                      const task = tasks.find(t => t.id === actionSpec.taskData.taskId);
                      actionResults.push(`✅ Starred task: "${task?.title}"`);
                      completedActions++;
                    }
                    break;
                    
                  case 'DELETE_MULTIPLE':
                    if (actionSpec.criteria) {
                      // Filter tasks based on criteria
                      const matchingTasks = filterTasksByCriteria(tasks, actionSpec.criteria, 'DELETE_MULTIPLE');
                      if (matchingTasks.length > 0) {
                        const result = await bulkTasksApi({ operation: 'delete', taskIds: matchingTasks.map(t => t.id) });
                        actionResults.push(`✅ Deleted ${result.affected} tasks`);
                        await refreshTasks();
                        completedActions++;
                      } else {
                        actionResults.push(`ℹ️ No tasks matched deletion criteria`);
                      }
                    }
                    break;
                    
                  case 'COMPLETE_MULTIPLE':
                    if (actionSpec.criteria) {
                      // Filter tasks based on criteria
                      const matchingTasks = filterTasksByCriteria(tasks, actionSpec.criteria, 'COMPLETE_MULTIPLE');
                      if (matchingTasks.length > 0) {
                        const result = await bulkTasksApi({ operation: 'complete', taskIds: matchingTasks.map(t => t.id) });
                        actionResults.push(`✅ Completed ${result.affected} tasks`);
                        await refreshTasks();
                        completedActions++;
                      } else {
                        actionResults.push(`ℹ️ No tasks matched completion criteria`);
                      }
                    }
                    break;
                    
                  default:
                    actionResults.push(`❌ Unknown action: ${actionSpec.action}`);
                }
              } catch (error) {
                console.error(`Error executing action ${actionSpec.action}:`, error);
                actionResults.push(`❌ Failed to execute: ${actionSpec.action}`);
              }
            }
            
            setTimeout(() => {
              const resultsSummary = actionResults.join('\n');
              setChatMessages(prev => [
                ...prev,
                { 
                  role: 'assistant', 
                  content: `🔥 Multi-action completed! (${completedActions}/${parsedResponse.multiActions.length} actions successful)\n\n${resultsSummary}` 
                }
              ]);
              
              toast({
                title: "Multi-Action Complete! 🚀",
                description: `${completedActions} actions completed successfully.`
              });
            }, 500);
          }
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
          // Detect course intelligently for fallback
          const detectedCourse = courseDetectionService.detectCourse(originalQuery, courses) || 'General';
          
          const newTask = {
            title: simpleFallback.taskData.title,
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: undefined,
            priority: 'medium' as const,
            status: 'pending' as const,
            course: detectedCourse,
            tags: [],
            completed: false,
            starred: false
          };
          await addTask(newTask);
          
          setTimeout(() => {
            toast({
              title: "Task Created! 🎉",
              description: `"${newTask.title}" has been added using fallback parsing.`
            });
          }, 500);
        } else if (simpleFallback.action === 'CREATE_MULTIPLE_TASKS' && simpleFallback.multipleTasks) {
          // Handle multiple task creation in fallback
          let createdCount = 0;
          const createdTasks = [];
          
          for (const taskSpec of simpleFallback.multipleTasks) {
            if (taskSpec.title) {
              // Detect course intelligently for fallback
              const detectionQuery = `${originalQuery} ${taskSpec.title}`.toLowerCase();
              const detectedCourse = courseDetectionService.detectCourse(detectionQuery, courses) || taskSpec.course || 'General';
              
              const newTask = {
                title: taskSpec.title,
                description: undefined,
                dueDate: new Date().toISOString().split('T')[0],
                dueTime: undefined,
                priority: (taskSpec.priority as "low" | "medium" | "high") || 'medium',
                status: 'pending' as const,
                course: detectedCourse,
                tags: [],
                completed: false,
                starred: false
              };
              
              await addTask(newTask);
              createdTasks.push(newTask);
              createdCount++;
            }
          }
          
          setTimeout(() => {
            const taskList = createdTasks.map(task => `• ${task.title}`).join('\n');
            setChatMessages(prev => [
              ...prev,
              { 
                role: 'assistant', 
                content: `✅ Created ${createdCount} tasks using fallback parsing!\n\n${taskList}` 
              }
            ]);
            
            toast({
              title: `${createdCount} Tasks Created! 🎉`,
              description: `Successfully added ${createdCount} new tasks using fallback parsing.`
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
  const trySimpleTaskParsing = (query: string): { action: string, taskData?: any, multipleTasks?: any[], response: string } | null => {
    const lowerQuery = query.toLowerCase();
    
    // Multiple task creation patterns
    if (lowerQuery.includes('create') && (lowerQuery.includes('tasks:') || lowerQuery.includes('tasks for') || lowerQuery.includes('add tasks'))) {
      // Try to extract multiple tasks from patterns like "create tasks: task1, task2, task3"
      const taskListPattern = /(?:create tasks?[:]\s*|add tasks?[:]\s*|make tasks?[:]\s*)(.+)/i;
      const match = query.match(taskListPattern);
      
      if (match && match[1]) {
        // Split by common separators and clean up
        const taskTitles = match[1]
          .split(/[,;]|\sand\s|\sof\s|\sthen\s/)
          .map(title => title.trim())
          .filter(title => title.length > 2)
          .slice(0, 10); // Limit to 10 tasks for safety
        
        if (taskTitles.length > 1) {
          const multipleTasks = taskTitles.map(title => ({
            title: title.replace(/^[-•]\s*/, ''), // Remove bullet points
            priority: 'medium' as const,
            course: 'General'
          }));
          
          return {
            action: 'CREATE_MULTIPLE_TASKS',
            multipleTasks,
            response: `Creating ${taskTitles.length} tasks using fallback parsing...`
          };
        }
      }
    }
    
    // Simple single task creation
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
      
      // Build a contextual prompt that includes conversation history and current task state
      let contextualQuery = userQuery;
      const tasksBlock = tasks && tasks.length > 0
        ? `\n\nCURRENT TASKS:\n${tasks.map(task => {
            const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
            return `- ID: ${task.id}, Title: "${task.title}", Status: ${task.status}, Priority: ${task.priority}, Due: ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}, Course: ${task.course}, Completed: ${task.completed}, Starred: ${task.starred}${isOverdue ? ' [OVERDUE]' : ''}`;
          }).join('\n')}`
        : '\n\nCURRENT TASKS: You have no tasks yet.';

      const coursesBlock = courses && courses.length > 0
        ? `\n\nAVAILABLE COURSES:\n${courses.map(course => `- ${course.id}: "${course.title}" (Instructor: ${course.instructor})`).join('\n')}`
        : '';

      if (conversationContext && conversationMemory.hasConversationContext()) {
        contextualQuery = `${conversationContext}Current question: ${userQuery}
\nSession Info: This conversation has ${sessionSummary.messageCount} messages covering topics: ${sessionSummary.topics.join(', ')}.\n${tasksBlock}${coursesBlock}\nPlease provide a personalized response that considers our conversation history and current tasks.`;
      } else {
        contextualQuery = `${userQuery}${tasksBlock}${coursesBlock}`;
      }
      
    // Save user message to conversation memory
    conversationMemory.addMessage('user', userQuery);
      
      // Update loading message to be more specific (since "Thinking..." is already shown)
      setChatMessages(prev => {
        const newMessages = [...prev];
        // Replace the last message if it's "Thinking..."
        if (newMessages[newMessages.length - 1]?.content === 'Thinking...') {
          newMessages[newMessages.length - 1] = { role: 'assistant', content: 'Thinking...' };
        } else {
          newMessages.push({ role: 'assistant', content: 'Thinking...' });
        }
        return newMessages;
      });
      
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
    conversationMemory.addMessage('assistant', aiResponse);
      
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
    setChatMessages([]);
    setQuery('');
    setIsCreatingTask(false); // Ensure task creation state is reset
  };

  // Update isChatModeActive when chatMessages change or when creating a task
  useEffect(() => {
    if (chatMessages.length > 0 || isCreatingTask) {
      setIsChatModeActive(true);
    } else {
      setIsChatModeActive(false);
    }
  }, [chatMessages, isCreatingTask]);

  // Remove auto-collapse after successful task creation
  // Keep the window open to show success message until user manually closes it

  // Scroll to show new messages properly

  return (
    <div 
      ref={searchBarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200 ease-out ${
        isExpanded ? 'w-full max-w-xl px-6' : 'w-auto'
      }`}
    >
      <div className={`bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl transition-all duration-200 ease-out ${
        isExpanded ? 'p-2' : 'p-1'
      }`}>
        {!isExpanded ? (
          // Collapsed state - AI Assistant button with black theme
          <Button
            onClick={handleExpand}
            className="rounded-full h-12 w-12 p-0 bg-black hover:bg-gray-800 transition-all duration-150 text-white shadow-lg hover:shadow-xl border-0"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.03, 1]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Sparkles className="h-7 w-6" />
              </motion.div>
              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{ 
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </Button>
        ) : (
          // Expanded state - full search bar with chat interface
          <div className="w-full">
            {/* Chat Interface with Animation */}
            <AnimatePresence>
              {isChatModeActive ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ 
                    duration: 0.15,
                    ease: "easeOut"
                  }}
                  className="w-full"
                >
                  {/* Chat Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span 
                        className="bg-black text-white rounded-full px-3 py-1 text-sm font-medium"
                      >
                        Assistant
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
                  
                  {/* Progress Indicator */}
                  <AnimatePresence>
                    {actionProgress.isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mb-2 px-2"
                      >
                        <div className="bg-black text-white rounded-2xl px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="h-4 w-4" />
                            </motion.div>
                            <div className="flex-1">
                              <div className="font-medium">{actionProgress.currentStep}</div>
                              <div className="flex items-center mt-1">
                                <div className="flex-1 bg-white/20 rounded-full h-1 mr-2">
                                  <motion.div 
                                    className="bg-white h-1 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${(actionProgress.currentStepIndex / actionProgress.totalSteps) * 100}%` }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                  />
                                </div>
                                <span className="text-xs opacity-75">
                                  {actionProgress.currentStepIndex}/{actionProgress.totalSteps}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
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
                        {...(message.role === 'user' ? { 'data-user-msg': '1' } : {})}
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
                            isCreatingTask && message.content.includes('Creating task') ? (
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
                      placeholder="Ask the assistant to manage tasks or answer questions..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="border-0 bg-transparent placeholder-gray-400 text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm flex-1"
                      disabled={isCreatingTask} // Disable input during task creation
                    />
                    <Button
                      type="submit"
                      className="rounded-full h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white transition-colors"
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
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask the assistant to handle tasks or questions..."
                        value={query}
                        onChange={handleInputChange}
                        className="border-0 bg-transparent placeholder-gray-400 text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm flex-1"
                      />
                    </div>
                    <Button
                      type="button"
                      className="rounded-full h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white transition-colors"
                    >
                      <Mic className="h-4 w-4" />
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