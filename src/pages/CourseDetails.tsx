"use client";

import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, PlayCircle, Lock, Clapperboard, Plus, X, Upload, FileText, ChevronDown, ChevronUp, Minus, RotateCcw } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from 'pdfjs-dist';
import { useCourses, Lecture } from "@/contexts/CoursesContext";

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}



const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { getCourse, addLectureToCourse, deleteLecture, uncompleteLecture } = useCourses();
  const course = getCourse(courseId!);
  const [showNewLectureModal, setShowNewLectureModal] = useState(false);
  const [newLecture, setNewLecture] = useState({
    title: "",
    duration: "",
    pdfFile: null as File | null,
    pdfUrl: null as string | null
  });
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  
  // Duration options in minutes
  const durationOptions = [
    { value: "15 min", minutes: 15 },
    { value: "30 min", minutes: 30 },
    { value: "45 min", minutes: 45 },
    { value: "60 min", minutes: 60 },
    { value: "1h 15min", minutes: 75 },
    { value: "1h 30min", minutes: 90 },
    { value: "1h 45min", minutes: 105 },
    { value: "2h", minutes: 120 },
    { value: "2h 30min", minutes: 150 },
    { value: "3h", minutes: 180 }
  ];
  
  const parseDurationToMinutes = (duration: string): number => {
    const hourMatch = duration.match(/(\d+)h/);
    const minMatch = duration.match(/(\d+)\s*min/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minMatch ? parseInt(minMatch[1]) : 0;
    
    return hours * 60 + minutes;
  };
  
  const formatMinutesToDuration = (totalMinutes: number): string => {
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };
  
  const adjustDuration = (increment: boolean) => {
    const currentMinutes = parseDurationToMinutes(newLecture.duration || "45 min");
    const step = 15; // 15-minute increments
    const newMinutes = increment ? currentMinutes + step : Math.max(15, currentMinutes - step);
    const newDuration = formatMinutesToDuration(newMinutes);
    
    setNewLecture(prev => ({ ...prev, duration: newDuration }));
  };

  const addNewLecture = () => {
    if (!newLecture.title.trim() || !newLecture.duration.trim() || !courseId) return;

    const lecture: Lecture = {
      id: (course?.lectures?.length || 0) + 1,
      title: newLecture.title,
      duration: newLecture.duration,
      status: "upcoming" as const, // Initial status, will be set correctly in context
      pdfFile: newLecture.pdfFile
    };

    addLectureToCourse(courseId, lecture);
    
    // Clean up the object URL to prevent memory leaks
    if (newLecture.pdfUrl) {
      URL.revokeObjectURL(newLecture.pdfUrl);
    }
    
    setNewLecture({ title: "", duration: "", pdfFile: null, pdfUrl: null });
    setShowNewLectureModal(false);
  };

  const handleDeleteLecture = (lectureId: number) => {
    if (courseId) {
      deleteLecture(courseId, lectureId);
    }
  };

  const handleUncompleteLecture = (lectureId: number) => {
    if (courseId) {
      uncompleteLecture(courseId, lectureId);
    }
  };

  // PDF processing functions
  const extractTitleFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Try to get title from metadata first
      const metadata = await pdf.getMetadata();
      const info = metadata.info as any;
      if (info && info.Title && typeof info.Title === 'string' && info.Title.trim()) {
        return info.Title.trim();
      }
      
      // If no metadata title, try to extract from first page content
      if (pdf.numPages > 0) {
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        // Look for potential title patterns (first line, largest text, etc.)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          const firstLine = lines[0].trim();
          // Return first meaningful line as title (max 100 chars)
          return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting title from PDF:', error);
      return '';
    }
  };
  
  const estimateDurationFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let totalWords = 0;
      let totalPages = pdf.numPages;
      
      // Sample first few pages to estimate content density
      const pagesToSample = Math.min(3, totalPages);
      
      for (let i = 1; i <= pagesToSample; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        // Count words (rough estimation)
        const words = text.split(/\s+/).filter(word => word.length > 0).length;
        totalWords += words;
      }
      
      // Estimate total words based on sample
      const avgWordsPerPage = totalWords / pagesToSample;
      const estimatedTotalWords = avgWordsPerPage * totalPages;
      
      // Calculate duration based on reading speed and content type
      // Academic content: ~150-200 words per minute
      // Regular content: ~200-250 words per minute
      // Assuming academic lecture content with discussion time
      const wordsPerMinute = 150;
      const estimatedMinutes = Math.round(estimatedTotalWords / wordsPerMinute);
      
      // Add buffer time for explanations, questions, etc. (30% more)
      const totalMinutes = Math.round(estimatedMinutes * 1.3);
      
      // Format duration
      if (totalMinutes < 60) {
        return `${totalMinutes} min`;
      } else {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
      }
    } catch (error) {
      console.error('Error estimating duration from PDF:', error);
      return '45 min'; // Default fallback
    }
  };
  
  const processPdfFile = async (file: File) => {
    setIsProcessingPdf(true);
    
    try {
      const url = URL.createObjectURL(file);
      
      // Extract title and estimate duration in parallel
      const [extractedTitle, estimatedDuration] = await Promise.all([
        extractTitleFromPdf(file),
        estimateDurationFromPdf(file)
      ]);
      
      setNewLecture(prev => ({
        ...prev,
        pdfFile: file,
        pdfUrl: url,
        title: extractedTitle || prev.title, // Only update if we got a title
        duration: estimatedDuration
      }));
    } catch (error) {
      console.error('Error processing PDF:', error);
      // Still set the file even if processing fails
      const url = URL.createObjectURL(file);
      setNewLecture(prev => ({
        ...prev,
        pdfFile: file,
        pdfUrl: url
      }));
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === "application/pdf") {
      const file = files[0];
      processPdfFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0] && files[0].type === "application/pdf") {
      const file = files[0];
      processPdfFile(file);
    }
  };

  if (!course) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Course Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The course you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-6 rounded-2xl">
          <Link to="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />;
      case "current":
        return <PlayCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />;
      case "upcoming":
        return <Lock className="h-6 w-6 text-gray-400 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const IconComponent = Icons[course.icon] as React.ElementType;

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link to="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground mt-2 text-lg">{course.instructor}</p>
          </div>
          <div className={cn("p-4 rounded-2xl text-white", course.color)}>
            {IconComponent && <IconComponent className="h-8 w-8" />}
          </div>
        </div>
      </div>

      <Card className="mb-6 rounded-3xl border-0 bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Course Progress</h3>
            <span className="text-lg font-bold text-foreground">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-3" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Lectures</h2>
        <Button
          onClick={() => setShowNewLectureModal(true)}
          className="bg-black hover:bg-gray-800 text-white rounded-2xl px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Lecture
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        {course?.lectures && course.lectures.length > 0 ? (
          <div className="space-y-3">
            {course.lectures.map((lecture, index) => (
              <Card
                key={lecture.id}
                className={cn(
                  "rounded-2xl border-0 transition-all group",
                  lecture.status === "current" ? "bg-primary/5" : "bg-muted/50",
                  lecture.status === "completed" && "opacity-60"
                )}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {getStatusIcon(lecture.status)}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {index + 1}. {lecture.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{lecture.duration}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(lecture.status === "current" || lecture.status === "upcoming") && (
                      <Button 
                        asChild
                        className="rounded-xl"
                        disabled={lecture.status === "upcoming"}
                      >
                        <Link 
                          to={`/courses/${courseId}/lecture/${lecture.id}`}
                          state={{ 
                            lecture: {
                              ...lecture,
                              course: {
                                title: course.title,
                                instructor: course.instructor,
                                id: courseId
                              }
                            }
                          }}
                        >
                          {lecture.status === "upcoming" ? "Not Available" : "Start Lecture"}
                        </Link>
                      </Button>
                    )}
                    {lecture.status === "completed" && (
                      <>
                        <Button 
                          asChild
                          variant="outline"
                          className="rounded-xl"
                        >
                          <Link 
                            to={`/courses/${courseId}/lecture/${lecture.id}`}
                            state={{ 
                              lecture: {
                                ...lecture,
                                course: {
                                  title: course.title,
                                  instructor: course.instructor,
                                  id: courseId
                                }
                              }
                            }}
                          >
                            Review Lecture
                          </Link>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUncompleteLecture(lecture.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
                          title="Mark as incomplete"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteLecture(lecture.id);
                      }}
                      className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Delete Lecture"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clapperboard className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Lectures Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Get started by creating your first lecture. You can upload PDFs and set durations to build your course content.
            </p>
            <Button
              onClick={() => setShowNewLectureModal(true)}
              className="bg-black hover:bg-gray-800 text-white rounded-2xl px-8 py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Lecture
            </Button>
          </div>
        )}
      </div>

      {/* Add Lecture Modal */}
      {showNewLectureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`bg-white/95 backdrop-blur-xl rounded-3xl p-8 mx-4 shadow-2xl border border-white/20 transition-all duration-300 ${
            newLecture.pdfFile ? 'w-full max-w-5xl' : 'w-full max-w-md'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Create New Lecture</h2>
              <button
                onClick={() => setShowNewLectureModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className={`flex gap-6 ${newLecture.pdfFile ? 'flex-row' : 'flex-col'}`}>
              {/* Form Section */}
              <div className={`space-y-4 ${newLecture.pdfFile ? 'w-80 flex-shrink-0' : 'w-full'}`}>
                {/* Lecture Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Lecture Title
                    {isProcessingPdf && (
                      <span className="ml-2 text-xs text-blue-600">(Auto-extracting...)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={newLecture.title}
                    onChange={(e) => setNewLecture(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent bg-white/80 backdrop-blur-sm text-sm"
                    placeholder={isProcessingPdf ? "Extracting title from PDF..." : "Enter lecture title"}
                    disabled={isProcessingPdf}
                  />
                </div>
                
                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Duration
                    {isProcessingPdf && (
                      <span className="ml-2 text-xs text-blue-600">(Auto-calculating...)</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      {/* Duration Input with Dropdown */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={newLecture.duration}
                          onChange={(e) => setNewLecture(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full p-2.5 pr-10 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent bg-white/80 backdrop-blur-sm text-sm"
                          placeholder={isProcessingPdf ? "Calculating duration..." : "e.g., 45 min"}
                          disabled={isProcessingPdf}
                        />
                        <button
                          type="button"
                          onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          disabled={isProcessingPdf}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        
                        {/* Duration Dropdown */}
                        {showDurationDropdown && (
                          <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-lg max-h-48 overflow-y-auto">
                            {durationOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setNewLecture(prev => ({ ...prev, duration: option.value }));
                                  setShowDurationDropdown(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                              >
                                {option.value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Increment/Decrement Controls */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => adjustDuration(true)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
                          disabled={isProcessingPdf}
                          title="Increase duration by 15 min"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustDuration(false)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
                          disabled={isProcessingPdf}
                          title="Decrease duration by 15 min"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Click outside to close dropdown */}
                    {showDurationDropdown && (
                      <div 
                        className="fixed inset-0 z-0" 
                        onClick={() => setShowDurationDropdown(false)}
                      />
                    )}
                  </div>
                  
                  {isProcessingPdf && (
                    <p className="text-xs text-gray-500">
                      Analyzing PDF content to estimate lecture duration...
                    </p>
                  )}
                </div>
                
                {/* PDF Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Upload PDF (Optional)</label>
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer",
                      dragActive
                        ? "border-black bg-black/5"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('pdf-file-input')?.click()}
                  >
                    <input
                      id="pdf-file-input"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {newLecture.pdfFile ? (
                      <div className="flex flex-col items-center space-y-2">
                        {isProcessingPdf ? (
                          <div className="flex flex-col items-center space-y-2 text-blue-600">
                            <div className="animate-spin">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">Processing PDF...</p>
                              <p className="text-xs text-gray-500">Extracting title and calculating duration</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2 text-green-600">
                            <FileText className="w-6 h-6" />
                            <div>
                              <p className="text-sm font-medium">{newLecture.pdfFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(newLecture.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2 text-gray-500">
                        <Upload className="w-10 h-10" />
                        <div>
                          <p className="font-medium">Drop your PDF here</p>
                          <p className="text-sm">or click to browse files</p>
                        </div>
                      </div>
                    )}
                    
                    {newLecture.pdfFile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (newLecture.pdfUrl) {
                            URL.revokeObjectURL(newLecture.pdfUrl);
                          }
                          setNewLecture(prev => ({ ...prev, pdfFile: null, pdfUrl: null }));
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    onClick={() => setShowNewLectureModal(false)}
                    className="rounded-2xl px-4 py-2 h-9 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addNewLecture}
                    disabled={!newLecture.title.trim() || !newLecture.duration.trim()}
                    className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-2xl px-4 py-2 h-9 text-sm font-medium"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Lecture
                  </Button>
                </div>
              </div>
              
              {/* PDF Preview Section */}
              {newLecture.pdfFile && newLecture.pdfUrl && (
                <div className="flex-1 min-w-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">PDF Preview</h3>
                      <div className="text-sm text-gray-500">
                        {(newLecture.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-gray-700 truncate">
                            {newLecture.pdfFile.name}
                          </span>
                        </div>
                      </div>
                      
                      {/* PDF Viewer */}
                      <div className="relative">
                        <iframe
                          src={newLecture.pdfUrl}
                          className="w-full h-80 border-0"
                          title="PDF Preview"
                          style={{
                            minHeight: '320px',
                            background: '#f8f9fa'
                          }}
                        />
                        
                        {/* Overlay for better visual feedback */}
                        <div className="absolute inset-0 pointer-events-none border border-gray-100 rounded-b-2xl" />
                      </div>
                      
                      <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(newLecture.pdfUrl!, '_blank')}
                            className="rounded-xl text-xs px-3 py-1.5"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Open Full View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (newLecture.pdfUrl) {
                                URL.revokeObjectURL(newLecture.pdfUrl);
                              }
                              setNewLecture(prev => ({ ...prev, pdfFile: null, pdfUrl: null }));
                            }}
                            className="rounded-xl text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      {isProcessingPdf ? (
                        "Processing PDF to auto-fill title and duration..."
                      ) : (
                        "Preview showing first page • This PDF will be attached to the lecture"
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;