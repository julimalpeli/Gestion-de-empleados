import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import UserRoles from "./pages/UserRoles";
import EmployeePortal from "./pages/EmployeePortal";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthRedirect from "@/components/AuthRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Employee portal */}
            <Route
              path="/portal-empleado"
              element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeePortal />
                </ProtectedRoute>
              }
            />

            {/* Admin dashboard with sidebar */}
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <Index />
                    </main>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/empleados"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <Employees />
                    </main>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/liquidaciones"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <Payroll />
                    </main>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reportes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <Reports />
                    </main>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            {/* Fallback routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
