import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AssignmentsProvider } from "@/contexts/AssignmentsContext";
import { CalendarEventsProvider } from "@/contexts/CalendarEventsContext";
import { CoursesProvider } from "@/contexts/CoursesContext";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Assignments from "./pages/Assignments";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";
import AIAssistantSearchBar from "./components/AIAssistantSearchBar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AssignmentsProvider>
      <CalendarEventsProvider>
        <CoursesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/calendar" element={<Calendar />} />
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
        </CoursesProvider>
      </CalendarEventsProvider>
    </AssignmentsProvider>
  </QueryClientProvider>
);

export default App;