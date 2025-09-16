"use client";

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  FileText, 
  Save, 
  Download, 
  Trash2, 
  Plus,
  Bold,
  Italic,
  List,
  Type,
  Highlighter,
  StickyNote,
  CheckCircle2,
  RotateCcw,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from 'pdfjs-dist';
import { useCourses } from "@/contexts/CoursesContext";
import { useToast } from "@/hooks/use-toast";

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Mock lecture data - in real app this would come from state/context
const mockLectureData = {
  id: 1,
  title: "Introduction to React Components",
  duration: "45 min",
  pdfFile: {
    name: "react-components-guide.pdf",
    size: 2.5 * 1024 * 1024, // 2.5MB
    url: null as string | null // Will be set when available
  },
  course: {
    title: "Web Development",
    instructor: "Prof. Leo Rivera"
  }
};

interface Note {
  id: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'highlight' | 'important';
  pageNumber?: number;
}

interface LectureData {
  id: number;
  title: string;
  duration: string;
  pdfFile?: {
    name: string;
    size: number;
    url?: string;
  } | File | null;
  course: {
    title: string;
    instructor: string;
    id?: string;
  };
}

const LecturePage = () => {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { completeLecture, uncompleteLecture, getCourse } = useCourses();
  const { toast } = useToast();
  
  // Get lecture data from navigation state or use fallback
  const lectureData: LectureData = location.state?.lecture || mockLectureData;
  const course = getCourse(courseId!);
  const currentLecture = course?.lectures?.find(l => l.id === parseInt(lectureId!));
  const isLectureCompleted = currentLecture?.status === "completed";
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [noteType, setNoteType] = useState<'text' | 'highlight' | 'important'>('text');
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Process PDF file and create URL for viewing
  useEffect(() => {
    const processPdfFile = async () => {
      if (!lectureData.pdfFile) return;
      
      setIsLoadingPdf(true);
      setPdfError(null);
      
      try {
        let fileUrl: string;
        
        // Handle File object (newly uploaded)
        if (lectureData.pdfFile instanceof File) {
          fileUrl = URL.createObjectURL(lectureData.pdfFile);
          console.log('Created blob URL for PDF:', fileUrl);
        }
        // Handle existing PDF data with URL
        else if (lectureData.pdfFile.url) {
          fileUrl = lectureData.pdfFile.url;
        }
        else {
          throw new Error('No valid PDF file found');
        }
        
        // Set PDF URL immediately for iframe display
        setPdfUrl(fileUrl);
        
        // Try to validate PDF with PDF.js (optional - don't fail if this doesn't work)
        try {
          const pdf = await pdfjsLib.getDocument({ url: fileUrl }).promise;
          setTotalPages(pdf.numPages);
          console.log('PDF loaded successfully, pages:', pdf.numPages);
        } catch (pdfError) {
          console.warn('PDF.js validation failed, but will try iframe display:', pdfError);
          // Still show the PDF in iframe even if PDF.js fails
          setTotalPages(1); // Default to 1 page
        }
        
      } catch (error) {
        console.error('Error processing PDF:', error);
        setPdfError('Failed to load PDF file');
      } finally {
        setIsLoadingPdf(false);
      }
    };
    
    processPdfFile();
    
    // Cleanup function to revoke object URL
    return () => {
      if (pdfUrl && lectureData.pdfFile instanceof File) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [lectureData.pdfFile]);

  const addNote = () => {
    if (!currentNote.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentNote,
      timestamp: new Date(),
      type: noteType,
      pageNumber: currentPage // Use current PDF page
    };

    setNotes(prev => [newNote, ...prev]);
    setCurrentNote("");
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleCompleteLecture = async () => {
    if (!courseId || !lectureId) return;
    
    setIsSaving(true);
    // Simulate saving notes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark lecture as completed
    completeLecture(courseId, parseInt(lectureId));
    
    setIsSaving(false);
    
    // Find the next available lecture
    const currentLectureIndex = course?.lectures?.findIndex(l => l.id === parseInt(lectureId)) || -1;
    const nextLecture = course?.lectures?.[currentLectureIndex + 1];
    
    if (nextLecture && nextLecture.status === "current") {
      // Show toast notification about auto-navigation
      toast({
        title: "Lecture Completed! 🎉",
        description: `Moving to next lecture: "${nextLecture.title}"`
      });
      
      // Navigate to the next lecture if it's available
      navigate(`/courses/${courseId}/lecture/${nextLecture.id}`, {
        state: {
          lecture: {
            ...nextLecture,
            course: {
              title: course.title,
              instructor: course.instructor,
              id: courseId
            }
          }
        }
      });
    } else {
      // Show completion toast when course is finished
      const totalLectures = course?.lectures?.length || 0;
      const completedLectures = (course?.lectures?.filter(l => l.status === "completed").length || 0) + 1; // +1 for current completion
      
      toast({
        title: completedLectures === totalLectures ? "Course Completed! 🎊" : "Lecture Completed! 🎉",
        description: completedLectures === totalLectures 
          ? `Congratulations! You've completed all ${totalLectures} lectures in "${course?.title}"` 
          : `Lecture completed successfully. ${completedLectures}/${totalLectures} lectures done.`
      });
      
      // Navigate back to course details if no next lecture or course completed
      navigate(`/courses/${courseId}`);
    }
  };

  const handleUncompleteLecture = async () => {
    if (!courseId || !lectureId) return;
    
    setIsSaving(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mark lecture as uncompleted (current)
    uncompleteLecture(courseId, parseInt(lectureId));
    
    setIsSaving(false);
    
    // Show toast notification
    toast({
      title: "Lecture Marked as Incomplete ↩️",
      description: "You can now retake this lecture and continue from here."
    });
  };

  const downloadNotes = () => {
    const notesText = notes.map(note => 
      `[${note.timestamp.toLocaleTimeString()}] ${note.type.toUpperCase()}: ${note.content}`
    ).join('\n\n');
    
    const blob = new Blob([notesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lectureData.title}-notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getNoteTypeStyle = (type: string) => {
    switch (type) {
      case 'highlight':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'important':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'highlight':
        return <Highlighter className="w-4 h-4" />;
      case 'important':
        return <StickyNote className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const openNoteDialog = (note: Note) => {
    setSelectedNote(note);
    setShowNoteDialog(true);
  };

  const closeNoteDialog = () => {
    setSelectedNote(null);
    setShowNoteDialog(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              asChild 
              variant="ghost" 
              className="rounded-2xl"
            >
              <Link to={`/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lectureData.title}</h1>
              <p className="text-sm text-gray-600">
                {lectureData.course.title} • {lectureData.course.instructor} • {lectureData.duration}
                {lectureData.pdfFile && (
                  <>
                    {' • '}
                    {lectureData.pdfFile instanceof File 
                      ? `${(lectureData.pdfFile.size / 1024 / 1024).toFixed(1)} MB`
                      : lectureData.pdfFile?.size 
                        ? `${(lectureData.pdfFile.size / 1024 / 1024).toFixed(1)} MB`
                        : 'No file size available'
                    }
                    {totalPages > 0 && ` • ${totalPages} pages`}
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={downloadNotes}
              disabled={notes.length === 0}
              variant="outline"
              className="rounded-2xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Notes
            </Button>
            {isLectureCompleted ? (
              <Button
                onClick={handleUncompleteLecture}
                disabled={isSaving}
                variant="outline"
                className="rounded-2xl border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {isSaving ? "Processing..." : "Mark as Uncompleted"}
              </Button>
            ) : (
              <Button
                onClick={handleCompleteLecture}
                disabled={isSaving}
                className="rounded-2xl bg-black hover:bg-gray-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {(() => {
                  if (isSaving) return "Completing...";
                  
                  // Check if there's a next lecture
                  const currentLectureIndex = course?.lectures?.findIndex(l => l.id === parseInt(lectureId!)) || -1;
                  const nextLecture = course?.lectures?.[currentLectureIndex + 1];
                  
                  return nextLecture && nextLecture.status === "upcoming" 
                    ? "Complete & Continue" 
                    : "Complete Lecture";
                })()}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* PDF Viewer Section */}
        <div className="flex-1 min-w-0 flex">
          <Card className="flex-1 rounded-3xl border-0 bg-white shadow-lg flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="flex-1 min-h-0 p-6">
                <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                  {isLoadingPdf ? (
                    <div className="text-center text-gray-500">
                      <div className="animate-spin mb-4">
                        <FileText className="w-16 h-16 mx-auto" />
                      </div>
                      <p className="text-lg font-medium">Loading PDF...</p>
                      <p className="text-sm">Processing your lecture content</p>
                    </div>
                  ) : pdfError ? (
                    <div className="text-center text-red-500">
                      <FileText className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">Error Loading PDF</p>
                      <p className="text-sm">{pdfError}</p>
                    </div>
                  ) : pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-2xl border-0"
                      title="Lecture PDF"
                      onLoad={() => {
                        console.log('PDF iframe loaded successfully');
                      }}
                      onError={(e) => {
                        console.error('PDF iframe failed to load:', e);
                        setPdfError('Failed to display PDF in viewer');
                      }}
                    />
                  ) : lectureData.pdfFile ? (
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">PDF Processing</p>
                      <p className="text-sm">Preparing your lecture content...</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">No PDF Available</p>
                      <p className="text-sm">This lecture doesn't have an uploaded PDF file</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        <div className="w-96 flex flex-col h-full">
          <Card className="flex-1 rounded-3xl border-0 bg-white shadow-lg h-full flex flex-col">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Notes Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-3xl flex-shrink-0">
                <h3 className="font-semibold text-gray-900 text-lg">Lecture Notes</h3>
                <p className="text-sm text-gray-600">{notes.length} notes</p>
              </div>

              {/* Note Input */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="space-y-4">
                  {/* Note Type Selector */}
                  <div className="flex gap-2">
                    {[
                      { type: 'text', icon: Type, label: 'Note' },
                      { type: 'highlight', icon: Highlighter, label: 'Highlight' },
                      { type: 'important', icon: StickyNote, label: 'Important' }
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => setNoteType(type as any)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
                          noteType === type
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Note Input */}
                  <div className="space-y-3">
                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="Take a note..."
                      className="w-full p-3 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-black focus:border-transparent"
                      rows={3}
                    />
                    <Button
                      onClick={addNote}
                      disabled={!currentNote.trim()}
                      className="w-full bg-black hover:bg-gray-800 text-white rounded-2xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes List - Fixed Height with Scrollbar */}
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-y-auto scrollbar-hide p-6">
                  <div className="space-y-4">
                    {notes.length === 0 ? (
                      <div className="text-center py-12">
                        <StickyNote className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 font-medium">No notes yet</p>
                        <p className="text-sm text-gray-400">Start taking notes as you study</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className={cn(
                            "p-4 rounded-2xl border-2 relative group transition-all duration-200 hover:shadow-md",
                            getNoteTypeStyle(note.type)
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNoteTypeIcon(note.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div 
                                className="text-sm leading-relaxed cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openNoteDialog(note)}
                                title="Click to view full note"
                              >
                                {truncateText(note.content)}
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
                                <p className="text-xs opacity-70 font-medium">
                                  {note.timestamp.toLocaleTimeString()}
                                </p>
                                {note.pageNumber && (
                                  <span className="text-xs opacity-70 font-medium">
                                    Page {note.pageNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/50 flex-shrink-0"
                              title="Delete note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Note Detail Dialog */}
      {showNoteDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                {selectedNote && (
                  <div className={cn(
                    "p-2 rounded-xl",
                    selectedNote.type === 'highlight' && "bg-yellow-100",
                    selectedNote.type === 'important' && "bg-red-100",
                    selectedNote.type === 'text' && "bg-black/10"
                  )}>
                    {getNoteTypeIcon(selectedNote.type)}
                  </div>
                )}
                <span className="capitalize">{selectedNote?.type} Note</span>
              </h2>
              <button
                onClick={closeNoteDialog}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {selectedNote && (
              <div className="space-y-6">
                {/* Note Content */}
                <div className={cn(
                  "p-6 rounded-2xl border-2 max-h-[60vh] overflow-y-auto scrollbar-hide",
                  getNoteTypeStyle(selectedNote.type)
                )}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {selectedNote.content}
                  </div>
                </div>
                
                {/* Note Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-1">Created</div>
                    <div className="text-sm text-gray-900">{selectedNote.timestamp.toLocaleString()}</div>
                  </div>
                  {selectedNote.pageNumber && (
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">Page Reference</div>
                      <div className="text-sm text-gray-900">Page {selectedNote.pageNumber}</div>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      deleteNote(selectedNote.id);
                      closeNoteDialog();
                    }}
                    className="px-6 py-3 text-red-600 border border-red-200 hover:bg-red-50 rounded-2xl transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4 mr-2 inline" />
                    Delete Note
                  </button>
                  <button
                    onClick={closeNoteDialog}
                    className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6 py-3 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturePage;