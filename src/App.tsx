import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TasksProvider } from "@/contexts/TasksContext";
import { CalendarEventsProvider } from "@/contexts/CalendarEventsContext";
import { CoursesProvider } from "@/contexts/CoursesContext";
import { UserProvider } from "@/contexts/UserContext";
// import { TimeTableProvider } from "@/contexts/TimeTableContext";
import MainLayout from "./components/MainLayout"; // Import the new MainLayout
import Dashboard from "./pages/Dashboard"; // Renamed from Index
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import LecturePage from "./pages/LecturePage";
import NotFound from "./pages/NotFound";
import Notes from "./pages/Notes";
import AIAssistantSearchBar from "./components/AIAssistantSearchBar";

const queryClient = new QueryClient();

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
                    <Route index element={<Dashboard />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:courseId" element={<CourseDetails />} />
                    <Route path="/courses/:courseId/lecture/:lectureId" element={<LecturePage />} />
                    <Route path="/timetable" element={<Calendar />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/study-focus" element={<div>Study Focus Page</div>} />
                    <Route path="*" element={<NotFound />} />
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