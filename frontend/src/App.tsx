import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { TasksProvider } from "@/contexts/TasksContext";
import { CalendarEventsProvider } from "@/contexts/CalendarEventsContext";
import { CoursesProvider } from "@/contexts/CoursesContext";
import { UserProvider } from "@/contexts/UserContext";
// import { TimeTableProvider } from "@/contexts/TimeTableContext";
import MainLayout from "./components/MainLayout"; // Import the new MainLayout
import Dashboard from "./pages/Dashboard"; // Load Dashboard synchronously for fast initial load
import AIAssistantSearchBar from "./components/AIAssistantSearchBar";

// Lazy load other components for code splitting (not Dashboard)
const Calendar = lazy(() => import("./pages/Calendar"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetails = lazy(() => import("./pages/CourseDetails"));
const LecturePage = lazy(() => import("./pages/LecturePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notes = lazy(() => import("./pages/Notes"));
const Assistant = lazy(() => import("./pages/Assistant"));

const queryClient = new QueryClient();

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <CoursesProvider>
        <TasksProvider>
          <CalendarEventsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<MainLayout />}>
                    {/* Dashboard loads immediately without Suspense for fast initial load */}
                    <Route index element={<Dashboard />} />
                    
                    {/* Other routes are lazy-loaded with Suspense */}
                    <Route path="/tasks" element={
                      <Suspense fallback={<PageLoader />}>
                        <Tasks />
                      </Suspense>
                    } />
                    <Route path="/calendar" element={
                      <Suspense fallback={<PageLoader />}>
                        <Calendar />
                      </Suspense>
                    } />
                    <Route path="/courses" element={
                      <Suspense fallback={<PageLoader />}>
                        <Courses />
                      </Suspense>
                    } />
                    <Route path="/courses/:courseId" element={
                      <Suspense fallback={<PageLoader />}>
                        <CourseDetails />
                      </Suspense>
                    } />
                    <Route path="/courses/:courseId/lecture/:lectureId" element={
                      <Suspense fallback={<PageLoader />}>
                        <LecturePage />
                      </Suspense>
                    } />
                    <Route path="/timetable" element={
                      <Suspense fallback={<PageLoader />}>
                        <Calendar />
                      </Suspense>
                    } />
                    <Route path="/notes" element={
                      <Suspense fallback={<PageLoader />}>
                        <Notes />
                      </Suspense>
                    } />
                    <Route path="/assistant" element={
                      <Suspense fallback={<PageLoader />}>
                        <Assistant />
                      </Suspense>
                    } />
                    <Route path="*" element={
                      <Suspense fallback={<PageLoader />}>
                        <NotFound />
                      </Suspense>
                    } />
                  </Route>
                </Routes>
                <AIAssistantSearchBar />
              </BrowserRouter>
            </TooltipProvider>
          </CalendarEventsProvider>
        </TasksProvider>
      </CoursesProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;