import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  BookOpen, 
  Calendar, 
  Tag,
  Pin,
  Archive,
  Edit3,
  Trash2
} from 'lucide-react';
import { useCourses } from '@/contexts/CoursesContext';
import FormattedContent from '@/components/FormattedContent';

interface Note {
  id: string;
  title: string;
  content: string;
  courseId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  isArchived?: boolean;
  attachments?: string[];
}

interface NoteDetailModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const NoteDetailModal = ({
  note,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive
}: NoteDetailModalProps) => {
  const { courses } = useCourses();
  
  if (!isOpen) return null;

  const course = note.courseId ? courses.find(c => c.id === note.courseId) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-2xl mx-4 shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {note.isPinned && <Pin className="w-4 h-4 text-primary fill-primary" />}
              <h2 className="text-2xl font-bold text-black truncate">
                {note.title}
              </h2>
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
                <span>Created: {note.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Updated: {note.updatedAt.toLocaleDateString()}</span>
              </div>
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

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="rounded-full px-3 py-1 text-xs"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide">
          <div className="bg-muted/50 rounded-2xl p-4 min-h-[200px]">
            <FormattedContent 
              content={note.content} 
              className="font-sans text-foreground" 
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTogglePin(note.id)}
              className={`rounded-2xl px-4 py-2 h-10 ${
                note.isPinned 
                  ? "bg-primary/10 text-primary hover:bg-primary/20" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Pin className={`w-4 h-4 mr-2 ${note.isPinned ? "fill-current" : ""}`} />
              {note.isPinned ? "Unpin" : "Pin"}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleArchive(note.id)}
              className={`rounded-2xl px-4 py-2 h-10 ${
                note.isArchived 
                  ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Archive className="w-4 h-4 mr-2" />
              {note.isArchived ? "Unarchive" : "Archive"}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="rounded-2xl px-4 py-2 h-10 text-gray-600 hover:bg-gray-100"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(note.id)}
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

export default NoteDetailModal;