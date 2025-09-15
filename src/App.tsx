import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AssignmentsProvider } from "@/contexts/AssignmentsContext";
import { CalendarEventsProvider } from "@/contexts/CalendarEventsContext";
import MainLayout from "./components/MainLayout"; // Import the new MainLayout
import Dashboard from "./pages/Dashboard"; // Renamed from Index
import Calendar from "./pages/Calendar";
import Assignments from "./pages/Assignments";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import NotFound from "./pages/NotFound";
import AIAssistantSearchBar from "./components/AIAssistantSearchBar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AssignmentsProvider>
      <CalendarEventsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}> {/* Use MainLayout here */}
                <Route index element={<Dashboard />} /> {/* Dashboard as the default child route */}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:courseId" element={<CourseDetails />} />
                <Route path="/timetable" element={<Calendar />} />
                <Route path="/quizzes" element={<div>Quizzes Page</div>} />
                <Route path="/notes" element={<div>Notes Page</div>} />
                <Route path="/performance" element={<div>Performance Page</div>} />
                <Route path="/study-focus" element={<div>Study Focus Page</div>} />
                <Route path="/settings" element={<div>Settings Page</div>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <AIAssistantSearchBar />
          </BrowserRouter>
        </TooltipProvider>
      </CalendarEventsProvider>
    </AssignmentsProvider>
  </QueryClientProvider>
);

export default App;