import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import EmployeePortal from "./pages/EmployeePortal";
import NotFound from "./pages/NotFound";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/empleado" element={<EmployeePortal />} />
          <Route
            path="/*"
            element={
              <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/empleados" element={<Employees />} />
                    <Route path="/liquidaciones" element={<Payroll />} />
                    <Route path="/reportes" element={<Reports />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </SidebarProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
