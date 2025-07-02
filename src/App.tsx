import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/utils/recreateEmployeeUsers";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import UserRoles from "./pages/UserRoles";
import UserManagement from "./pages/UserManagement";
import EmployeePortal from "./pages/EmployeePortal";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthRedirect from "@/components/AuthRedirect";

const queryClient = new QueryClient();

// Loading component for auth state
const AuthLoadingWrapper = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();

  // Only show loading on initial app load, not on login page
  if (loading && window.location.pathname !== "/login") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <Toaster />
      <Sonner />
      <AuthProvider>
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

            {/* Dashboard with sidebar - Allow admin, manager, hr */}
            <Route
              path="/"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "manager", "hr", "readonly"]}
                >
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
                <ProtectedRoute allowedRoles={["admin", "manager", "hr"]}>
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
                <ProtectedRoute allowedRoles={["admin", "manager", "hr"]}>
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
                <ProtectedRoute
                  allowedRoles={["admin", "manager", "hr", "readonly"]}
                >
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <Reports />
                    </main>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <UserRoles />
                    </main>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            {/* User Management - Solo Admin */}
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <UserManagement />
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
