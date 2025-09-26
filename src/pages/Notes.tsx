import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Plus, 
  Tag, 
  BookOpen, 
  Calendar, 
  Filter,
  Edit3,
  Save,
  X,
  StickyNote,
  Paperclip,
  Star,
  Archive,
  MoreHorizontal,
  Pin,
  ChevronDown
} from 'lucide-react';
import { useCourses } from '@/contexts/CoursesContext';
import RichTextEditor from '@/components/RichTextEditor';
import NoteDetailModal from '@/components/NoteDetailModal';
import NoteCreateModal from '@/components/NoteCreateModal';
import FormattedContent from '@/components/FormattedContent';
import { cn } from '@/lib/utils';

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
  attachments?: string[]; // URLs or file paths
}

const Notes = () => {
  const { courses } = useCourses();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteDetailOpen, setIsNoteDetailOpen] = useState(false);
  const [isNoteCreateOpen, setIsNoteCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize with sample notes
  useEffect(() => {
    const sampleNotes: Note[] = [
      {
        id: '1',
        title: 'Typography Principles',
        content: 'Key points from today\'s lecture:\n- Serif fonts for print\n- Sans-serif for digital\n- Line spacing should be 1.5x font size',
        courseId: 'advanced-typography',
        tags: ['design', 'lecture', 'typography'],
        createdAt: new Date(2023, 5, 15),
        updatedAt: new Date(2023, 5, 15),
        isPinned: true,
        isArchived: false
      },
      {
        id: '2',
        title: 'Mobile Navigation Patterns',
        content: 'Important mobile UX patterns:\n- Hamburger menus for secondary navigation\n- Tab bars for primary navigation\n- Gesture-based interactions',
        courseId: 'ux-for-mobile',
        tags: ['ux', 'mobile', 'lecture'],
        createdAt: new Date(2023, 5, 18),
        updatedAt: new Date(2023, 5, 18),
        isPinned: false,
        isArchived: false
      }
    ];
    setNotes(sampleNotes);
    setFilteredNotes(sampleNotes.filter(note => !note.isArchived));
    
    // Extract all unique tags
    const tags = Array.from(new Set(sampleNotes.flatMap(note => note.tags)));
    setAllTags(tags);
  }, []);

  // Filter notes based on search, tags, and course
  useEffect(() => {
    let result = notes.filter(note => !note.isArchived); // Don't show archived notes by default
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(note => 
        note.title.toLowerCase().includes(term) || 
        note.content.toLowerCase().includes(term)
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter(note => 
        selectedTags.every(tag => note.tags.includes(tag))
      );
    }
    
    // Filter by selected course
    if (selectedCourse) {
      result = result.filter(note => note.courseId === selectedCourse);
    }
    
    // Sort notes
    result = [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });
    
    setFilteredNotes(result);
  }, [searchTerm, selectedTags, selectedCourse, notes, sortBy]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside course dropdown
      if (showCourseDropdown && courseDropdownRef.current && 
          !courseDropdownRef.current.contains(target)) {
        setShowCourseDropdown(false);
      }
      // Check if click is outside sort dropdown
      if (showSortDropdown && sortDropdownRef.current && 
          !sortDropdownRef.current.contains(target)) {
        setShowSortDropdown(false);
      }
    };

    if (showCourseDropdown || showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCourseDropdown, showSortDropdown]);

  const handleCreateNote = (noteData: { 
    title: string; 
    content: string; 
    courseId: string; 
    tags: string;
    isPinned: boolean;
  }) => {
    if (!noteData.title.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      title: noteData.title,
      content: noteData.content,
      courseId: noteData.courseId || undefined,
      tags: noteData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: noteData.isPinned,
      isArchived: false
    };
    
    setNotes([note, ...notes]);
    
    // Update all tags
    const newTags = note.tags.filter(tag => !allTags.includes(tag));
    if (newTags.length > 0) {
      setAllTags(prev => [...prev, ...newTags]);
    }
    
    setIsNoteCreateOpen(false);
  };

  const handleUpdateNote = (noteData: { 
    title: string; 
    content: string; 
    courseId: string; 
    tags: string;
    isPinned: boolean;
  }) => {
    if (!editingNote || !noteData.title.trim()) return;
    
    setNotes(notes.map(note => {
      if (note.id === editingNote.id) {
        const updatedNote = {
          ...note,
          title: noteData.title,
          content: noteData.content,
          courseId: noteData.courseId || undefined,
          tags: noteData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          isPinned: noteData.isPinned,
          updatedAt: new Date()
        };
        
        // Update all tags
        const newTags = updatedNote.tags.filter(tag => !allTags.includes(tag));
        if (newTags.length > 0) {
          setAllTags(prev => [...prev, ...newTags]);
        }
        
        return updatedNote;
      }
      return note;
    }));
    
    setEditingNote(null);
    setIsNoteCreateOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsNoteCreateOpen(true);
  };

  const handleTogglePin = (id: string) => {
    setNotes(notes.map(note => {
      if (note.id === id) {
        return { ...note, isPinned: !note.isPinned };
      }
      return note;
    }));
  };

  const handleToggleArchive = (id: string) => {
    setNotes(notes.map(note => {
      if (note.id === id) {
        return { ...note, isArchived: !note.isArchived };
      }
      return note;
    }));
  };

  const handleOpenNoteDetail = (note: Note) => {
    setSelectedNote(note);
    setIsNoteDetailOpen(true);
  };

  const handleCloseNoteDetail = () => {
    setIsNoteDetailOpen(false);
    setSelectedNote(null);
  };

  const handleEditFromDetail = (note: Note) => {
    handleEditNote(note);
    handleCloseNoteDetail();
  };

  const handleDeleteFromDetail = (id: string) => {
    handleDeleteNote(id);
    handleCloseNoteDetail();
  };

  const handleTogglePinFromDetail = (id: string) => {
    handleTogglePin(id);
    // Update the selected note if it's the one being pinned
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote({ ...selectedNote, isPinned: !selectedNote.isPinned });
    }
  };

  const handleToggleArchiveFromDetail = (id: string) => {
    handleToggleArchive(id);
    // Update the selected note if it's the one being archived
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote({ ...selectedNote, isArchived: !selectedNote.isArchived });
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground">Organize your lecture notes and study materials</p>
        </div>
        <Button 
          onClick={() => {
            setEditingNote(null);
            setIsNoteCreateOpen(true);
          }}
          className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search and All Controls Row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-2xl border-0 bg-muted focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCourseDropdown(!showCourseDropdown)}
              className="px-3 py-2 text-sm border-0 bg-muted rounded-2xl focus:ring-2 focus:ring-black text-left hover:bg-muted/80 flex items-center justify-between min-w-[140px]"
            >
              <span className={selectedCourse ? "text-gray-900" : "text-gray-500"}>
                {selectedCourse ? courses.find(c => c.id === selectedCourse)?.title || "All Courses" : "All Courses"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
            </button>
            
            {showCourseDropdown && (
              <div 
                ref={courseDropdownRef}
                className="absolute z-50 mt-1 w-full min-w-[200px] bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-48 overflow-y-auto scrollbar-hide"
              >
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(null);
                      setShowCourseDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 transition-colors",
                      !selectedCourse && "bg-black text-white hover:bg-gray-800"
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium">All Courses</div>
                      <div className="text-xs text-gray-500">Show notes from all courses</div>
                    </div>
                  </button>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourse(course.id);
                          setShowCourseDropdown(false);
                        }}
                        className={cn(
                          "w-full flex items-center px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 transition-colors",
                          selectedCourse === course.id && "bg-black text-white hover:bg-gray-800"
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
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="px-3 py-2 text-sm border-0 bg-muted rounded-2xl focus:ring-2 focus:ring-black text-left hover:bg-muted/80 flex items-center justify-between min-w-[130px]"
            >
              <span className="text-gray-900">
                {sortBy === 'date' ? 'Sort by Date' : 'Sort by Title'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
            </button>
            
            {showSortDropdown && (
              <div 
                ref={sortDropdownRef}
                className="absolute z-50 mt-1 w-full min-w-[160px] bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-48 overflow-y-auto scrollbar-hide"
              >
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('date');
                      setShowSortDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 transition-colors",
                      sortBy === 'date' && "bg-black text-white hover:bg-gray-800"
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium">Sort by Date</div>
                      <div className="text-xs text-gray-500">Most recent first</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('title');
                      setShowSortDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 transition-colors",
                      sortBy === 'title' && "bg-black text-white hover:bg-gray-800"
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium">Sort by Title</div>
                      <div className="text-xs text-gray-500">Alphabetical order</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-full"
          >
            Grid View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-full"
          >
            List View
          </Button>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className="cursor-pointer rounded-full px-3 py-1"
              onClick={() => toggleTag(tag)}
            >
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1">
        {filteredNotes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <StickyNote className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-4">
              {notes.length === 0 
                ? "Create your first note to get started!" 
                : "Try adjusting your search or filters"}
            </p>
            <Button 
              onClick={() => {
                setEditingNote(null);
                setIsNoteCreateOpen(true);
              }}
              className="rounded-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)] rounded-2xl">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredNotes.map(note => {
                  const course = note.courseId ? courses.find(c => c.id === note.courseId) : null;
                  return (
                    <Card 
                      key={note.id} 
                      className="rounded-3xl backdrop-blur-sm bg-card/90 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      onClick={() => handleOpenNoteDetail(note)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg line-clamp-2">
                            {note.title}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin(note.id);
                              }}
                              className="h-8 w-8 rounded-full"
                              title={note.isPinned ? "Unpin note" : "Pin note"}
                            >
                              <Pin className={`h-4 w-4 ${note.isPinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleArchive(note.id);
                              }}
                              className="h-8 w-8 rounded-full"
                              title={note.isArchived ? "Unarchive note" : "Archive note"}
                            >
                              <Archive className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNoteDetail(note);
                              }}
                              className="h-8 w-8 rounded-full"
                              title="View note details"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        {course && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <BookOpen className="mr-1 h-3 w-3" />
                            <span>{course.title}</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          <FormattedContent content={note.content} />
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="rounded-full px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>
                              {note.updatedAt.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredNotes.map(note => {
                  const course = note.courseId ? courses.find(c => c.id === note.courseId) : null;
                  return (
                    <Card 
                      key={note.id} 
                      className="rounded-3xl backdrop-blur-sm bg-card/90 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                      onClick={() => handleOpenNoteDetail(note)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-2">
                            {note.isPinned && <Pin className="h-4 w-4 text-primary mt-1" />}
                            <div>
                              <h3 className="font-semibold">{note.title}</h3>
                              {course && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <BookOpen className="mr-1 h-3 w-3" />
                                  <span>{course.title}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin(note.id);
                              }}
                              className="h-8 w-8 rounded-full"
                              title={note.isPinned ? "Unpin note" : "Pin note"}
                            >
                              <Pin className={`h-4 w-4 ${note.isPinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleArchive(note.id);
                              }}
                              className="h-8 w-8 rounded-full"
                              title={note.isArchived ? "Unarchive note" : "Archive note"}
                            >
                              <Archive className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNoteDetail(note);
                              }}
                              className="h-8 w-8 rounded-full"
                              title="View note details"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          <FormattedContent content={note.content} />
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="rounded-full px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>
                              {note.updatedAt.toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
      
      {/* Note Detail Modal */}
      {isNoteDetailOpen && selectedNote && (
        <NoteDetailModal
          note={selectedNote}
          isOpen={isNoteDetailOpen}
          onClose={handleCloseNoteDetail}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteFromDetail}
          onTogglePin={handleTogglePinFromDetail}
          onToggleArchive={handleToggleArchiveFromDetail}
        />
      )}
      
      {/* Note Create/Edit Modal */}
      <NoteCreateModal
        isOpen={isNoteCreateOpen}
        onClose={() => {
          setIsNoteCreateOpen(false);
          setEditingNote(null);
        }}
        onSave={editingNote ? handleUpdateNote : handleCreateNote}
        initialData={editingNote ? {
          title: editingNote.title,
          content: editingNote.content,
          courseId: editingNote.courseId || '',
          tags: editingNote.tags.join(', '),
          isPinned: editingNote.isPinned || false
        } : undefined}
      />
    </div>
  );
};

export default Notes;