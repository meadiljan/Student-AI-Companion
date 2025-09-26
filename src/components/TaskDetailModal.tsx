import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  BookOpen, 
  Calendar, 
  Clock,
  Flag,
  Star,
  Edit3,
  Trash2
} from 'lucide-react';
import { useCourses } from '@/contexts/CoursesContext';
import { Task } from '@/contexts/TasksContext';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const TaskDetailModal = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleStar,
  onToggleComplete
}: TaskDetailModalProps) => {
  const { courses } = useCourses();
  
  if (!isOpen) return null;

  const course = courses.find(c => c.title === task.course || c.id === task.course);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const statusBadge = getStatusBadge(task.status, task.completed);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-2xl mx-4 shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
              <h2 className="text-2xl font-bold text-black truncate">
                {task.title}
              </h2>
              {task.starred && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
            </div>
            
            {course && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BookOpen className="w-4 h-4" />
                <span>{course.title}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
              {task.dueTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{task.dueTime}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors h-auto"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Button>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-4">
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <div className="bg-muted/50 rounded-2xl p-4">
              <p className="text-foreground">{task.description}</p>
            </div>
          </div>
        )}

        {/* Course Information */}
        {course && (
          <div className="mb-4">
            <h3 className="font-semibold text-foreground mb-2">Course</h3>
            <div className="bg-muted/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${course.color}`} />
                <div>
                  <div className="font-medium">{course.title}</div>
                  <div className="text-sm text-muted-foreground">{course.instructor}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="mb-6">
          <Badge className={`text-xs ${statusBadge.color}`}>
            {statusBadge.text}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStar(task.id)}
              className={`rounded-2xl px-4 py-2 h-10 ${
                task.starred 
                  ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Star className={`w-4 h-4 mr-2 ${task.starred ? "fill-current" : ""}`} />
              {task.starred ? "Unstar" : "Star"}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleComplete(task.id)}
              className={`rounded-2xl px-4 py-2 h-10 ${
                task.completed 
                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Flag className="w-4 h-4 mr-2" />
              {task.completed ? "Mark Incomplete" : "Mark Complete"}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="rounded-2xl px-4 py-2 h-10 text-gray-600 hover:bg-gray-100"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="rounded-2xl px-4 py-2 h-10 text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TaskDetailModal;