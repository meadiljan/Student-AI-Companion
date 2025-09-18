import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Plus, BookOpen, Tag, ChevronDown } from 'lucide-react';
import { useCourses } from '@/contexts/CoursesContext';
import RichTextEditor from '@/components/RichTextEditor';
import { cn } from '@/lib/utils';

interface NoteCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: { 
    title: string; 
    content: string; 
    courseId: string; 
    tags: string;
    isPinned: boolean;
  }) => void;
  initialData?: {
    title?: string;
    content?: string;
    courseId?: string;
    tags?: string;
    isPinned?: boolean;
  };
}

const NoteCreateModal = ({
  isOpen,
  onClose,
  onSave,
  initialData
}: NoteCreateModalProps) => {
  const { courses } = useCourses();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [courseId, setCourseId] = useState(initialData?.courseId || '');
  const [tags, setTags] = useState(initialData?.tags || '');
  const [isPinned, setIsPinned] = useState(initialData?.isPinned || false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Update state when initialData changes
  useEffect(() => {
    setTitle(initialData?.title || '');
    setContent(initialData?.content || '');
    setCourseId(initialData?.courseId || '');
    setTags(initialData?.tags || '');
    setIsPinned(initialData?.isPinned || false);
  }, [initialData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
    };

    if (showCourseDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCourseDropdown]);

  const handleClose = () => {
    // Only reset form if we're not editing (i.e., creating new note)
    // This prevents the form from resetting to previous edit data when creating new notes
    if (!initialData) {
      setTitle('');
      setContent('');
      setCourseId('');
      setTags('');
      setIsPinned(false);
    } else {
      // When editing, reset to the original note data
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
      setCourseId(initialData?.courseId || '');
      setTags(initialData?.tags || '');
      setIsPinned(initialData?.isPinned || false);
    }
    setShowCourseDropdown(false);
    onClose();
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title,
      content,
      courseId,
      tags,
      isPinned
    });
    
    // Reset form only after successful save
    setTitle('');
    setContent('');
    setCourseId('');
    setTags('');
    setIsPinned(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-3xl mx-4 shadow-2xl border border-white/20 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-black">
            {initialData?.title ? 'Edit Note' : 'Create New Note'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors h-auto"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Note Title</label>
            <Input
              placeholder="Enter note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Content</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your note content here..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Course</label>
              <div className="relative" ref={courseDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent text-left bg-white/80 backdrop-blur-sm hover:bg-white/90 flex items-center justify-between"
                >
                  <span className={courseId ? "text-gray-900" : "text-gray-500"}>
                    {courseId 
                      ? courses.find(course => course.id === courseId)?.title || "Select a course" 
                      : "Select a course (optional)"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showCourseDropdown && (
                  <div 
                    className="absolute z-50 bottom-full mb-1 w-full bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-48 overflow-y-auto scrollbar-hide"
                  >
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCourseId('');
                          setShowCourseDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        No course
                      </button>
                      {courses.map(course => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            setCourseId(course.id);
                            setShowCourseDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 transition-colors",
                            courseId === course.id && "bg-black text-white hover:bg-gray-800"
                          )}
                        >
                          <div className={cn("w-3 h-3 rounded-full mr-3", course.color)} />
                          <div className="flex-1">
                            <div className="font-medium">{course.title}</div>
                            <div className="text-xs text-gray-500 truncate">{course.instructor}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tags</label>
              <div className="relative">
                <Input
                  placeholder="Tags (comma separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="rounded-2xl border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-black focus:border-transparent pr-10"
                />
                <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pin-note"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="pin-note" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Pin this note
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
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
            {initialData?.title ? 'Update Note' : 'Create Note'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NoteCreateModal;