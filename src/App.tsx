import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout"; // Import the new MainLayout
import Dashboard from "./pages/Dashboard"; // Renamed from Index
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}> {/* Use MainLayout here */}
            <Route index element={<Dashboard />} /> {/* Dashboard as the default child route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/assignments" element={<div>Assignments Page</div>} />
            <Route path="/timetable" element={<div>Timetable Page</div>} />
            <Route path="/quizzes" element={<div>Quizzes Page</div>} />
            <Route path="/notes" element={<div>Notes Page</div>} />
            <Route path="/performance" element={<div>Performance Page</div>} />
            <Route path="/study-focus" element={<div>Study Focus Page</div>} />
            <Route path="/settings" element={<div>Settings Page</div>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;