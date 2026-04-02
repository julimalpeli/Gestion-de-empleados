import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { testSupabaseConnection } from "@/lib/supabase";
import ForcePasswordChange from "@/components/ForcePasswordChange";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

// Load dev utilities only in development mode
if (import.meta.env.DEV) {
  Promise.all([
    import("@/utils/connectionTest"),
    import("@/utils/connectionDebug"),
    import("@/utils/syncVacations"),
    import("@/utils/debugRLS"),
    import("@/utils/fixAuthUsers"),
    import("@/utils/emergencyAuth"),
    import("@/utils/diagnoseDatabase"),
    import("@/utils/debugControl"),
    import("@/utils/confirmEmail"),
    import("@/utils/emergencyNav"),
    import("@/utils/recalculateAguinaldos"),
  ])
    .then(
      ([
        connectionModule,
        _connectionDebugModule,
        syncModule,
        debugModule,
        fixAuthModule,
        emergencyModule,
        diagnoseModule,
        _debugControlModule,
        _confirmEmailModule,
        _emergencyNavModule,
        recalculateAguinaldosModule,
      ]) => {
        (window as any).testConnection = connectionModule.testConnection;
        (window as any).syncVacationsTaken = syncModule.syncVacationsTaken;
        (window as any).manualSyncVacations = syncModule.manualSyncVacations;
        (window as any).debugRLSPermissions = debugModule.debugRLSPermissions;
        (window as any).verifyAuthUsers = fixAuthModule.verifyAuthUsers;
        (window as any).resetUserPassword = fixAuthModule.resetUserPassword;
        (window as any).listAuthUsers = fixAuthModule.listAuthUsers;
        (window as any).emergencyAdminLogin =
          emergencyModule.emergencyAdminLogin;
        (window as any).clearEmergencyAuth = emergencyModule.clearEmergencyAuth;
        (window as any).checkEmergencyAuth = emergencyModule.checkEmergencyAuth;
        (window as any).diagnoseEmployeesTable =
          diagnoseModule.diagnoseEmployeesTable;
        (window as any).fixEmployeeUsersQuery =
          diagnoseModule.fixEmployeeUsersQuery;
        (window as any).recalculateAguinaldosForPeriod =
          recalculateAguinaldosModule.recalculateAguinaldosForPeriod;

        console.log("🔧 Dev tools loaded");
      },
    )
    .catch(() => {});
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import UserRoles from "./pages/UserRoles";
import UserManagement from "./pages/UserManagement";
import EmployeePortal from "./pages/EmployeePortal";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import InactiveUser from "./pages/InactiveUser";
import NotFound from "./pages/NotFound";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth, AuthProvider } from "@/hooks/use-auth-simple";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

// Loading component for auth state
const AuthLoadingWrapper = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();

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

// Component wrapper para manejar ForcePasswordChange
const AppContent = () => {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await testSupabaseConnection();
      setIsOffline(!isConnected);
    };

    testConnection();

    const handleMessage = (event: any) => {
      if (event.data?.type === "FALLBACK_ACTIVATED") {
        setIsOffline(true);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <>
      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-100 border-b border-orange-200">
          <Alert className="rounded-none border-0 bg-orange-100">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Modo Offline:</strong> Sin conexión a internet. Los
                datos mostrados son una copia local.
              </span>
              <button
                onClick={() => window.location.reload()}
                className="text-orange-800 underline hover:no-underline"
              >
                Reintentar conexión
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className={isOffline ? "mt-16" : ""}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/inactive" element={<InactiveUser />} />

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
                      <Dashboard />
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

        {/* Force Password Change Dialog */}
        {user && user.needsPasswordChange && (
          <ForcePasswordChange
            isOpen={true}
            username={user.username}
            onPasswordChanged={() => {
              window.location.reload();
            }}
          />
        )}
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
