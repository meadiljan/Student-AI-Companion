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
  StickyNote
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from 'pdfjs-dist';

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
  
  // Get lecture data from navigation state or use fallback
  const lectureData: LectureData = location.state?.lecture || mockLectureData;
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [noteType, setNoteType] = useState<'text' | 'highlight' | 'important'>('text');
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

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

  const saveNotes = async () => {
    setIsSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
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
        return 'bg-blue-50 border-blue-200 text-blue-800';
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
              onClick={saveNotes}
              disabled={isSaving || notes.length === 0}
              variant="outline"
              className="rounded-2xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Notes"}
            </Button>
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
        <div className="w-96 flex flex-col">
          <Card className="flex-1 rounded-3xl border-0 bg-white shadow-lg">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Notes Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-3xl">
                <h3 className="font-semibold text-gray-900 text-lg">Lecture Notes</h3>
                <p className="text-sm text-gray-600">{notes.length} notes</p>
              </div>

              {/* Note Input */}
              <div className="p-6 border-b border-gray-200">
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

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-6">
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
                          "p-4 rounded-2xl border-2 relative group",
                          getNoteTypeStyle(note.type)
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNoteTypeIcon(note.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed">{note.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs opacity-70">
                                {note.timestamp.toLocaleTimeString()}
                              </p>
                              {note.pageNumber && (
                                <span className="text-xs opacity-70">
                                  Page {note.pageNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LecturePage;