import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Load immediate auth fix
if (typeof window !== "undefined") {
  import("@/utils/immediateAuthFix.js").catch(() => {
    console.log("Auth fix script not loaded");
  });
}
// Load recreation utilities for development
if (import.meta.env.DEV) {
  // Load auth debugging utilities immediately
  Promise.all([
    import("@/utils/recreateEmployeeUsers"),
    import("@/utils/quickFixEmployee"),
    import("@/utils/connectionTest"),
    import("@/utils/syncVacations"),
    import("@/utils/debugRLS"),
    import("@/utils/fixAuthUsers"),
    import("@/utils/emergencyAuth"),
    import("@/utils/emergencyAuthRepair"),
    import("@/utils/fixNachitoUser"),
    import("@/utils/createEmployeeUsers"),
    import("@/utils/diagnoseDatabase"),
    import("@/utils/debugControl"),
  ])
    .then(
      ([
        recreateModule,
        quickFixModule,
        connectionModule,
        syncModule,
        debugModule,
        fixAuthModule,
        emergencyModule,
        repairModule,
        nachitoModule,
        createUsersModule,
        diagnoseModule,
        debugControlModule,
      ]) => {
        // Expose all functions globally
        (window as any).recreateEmployeeUsers =
          recreateModule.recreateEmployeeUsers;
        (window as any).checkEmployeeUserStatus =
          recreateModule.checkEmployeeUserStatus;
        (window as any).recreateEmployee44586777 =
          quickFixModule.recreateEmployee44586777;
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
        (window as any).emergencyAuthRepair = repairModule.emergencyAuthRepair;
        (window as any).fixSupabaseAuthSettings =
          repairModule.fixSupabaseAuthSettings;
        (window as any).testBasicAuth = repairModule.testBasicAuth;
        (window as any).fixNachitoUser = nachitoModule.fixNachitoUser;
        (window as any).testNachitoLogin = nachitoModule.testNachitoLogin;
        (window as any).createUserForEmployee =
          createUsersModule.createUserForEmployee;
        (window as any).createUsersForAllEmployees =
          createUsersModule.createUsersForAllEmployees;
        (window as any).findEmployeesWithoutUsers =
          createUsersModule.findEmployeesWithoutUsers;
        (window as any).diagnoseEmployeesTable =
          diagnoseModule.diagnoseEmployeesTable;
        (window as any).fixEmployeeUsersQuery =
          diagnoseModule.fixEmployeeUsersQuery;

        // Debug control functions are auto-exposed by the module

        console.log("🔧 Dev tools loaded and available:");
        console.log("   - recreateEmployeeUsers()");
        console.log("   - checkEmployeeUserStatus()");
        console.log("   - testConnection()");
        console.log("   - syncVacationsTaken()");
        console.log("   - manualSyncVacations()");
        console.log("   - debugRLSPermissions()");
        console.log(
          "   - verifyAuthUsers() [NOW INCLUDES nachito_ja@hotmail.com]",
        );
        console.log("   - resetUserPassword(email, password)");
        console.log("   - listAuthUsers()");
        console.log("   - emergencyAdminLogin() [EMERGENCY ONLY]");
        console.log("   - recreateEmployee44586777()");
        console.log("   🚨 EMERGENCY AUTH REPAIR:");
        console.log("   - emergencyAuthRepair() - Complete auth diagnosis");
        console.log("   - fixSupabaseAuthSettings() - Configuration guide");
        console.log("   - testBasicAuth() - Basic signup/signin test");
        console.log("   🔧 SPECIFIC USER FIXES:");
        console.log("   - fixNachitoUser() - Fix nachito_ja@hotmail.com");
        console.log("   - testNachitoLogin() - Test nachito login");
        console.log("   👥 EMPLOYEE USER CREATION:");
        console.log(
          "   - findEmployeesWithoutUsers() - List employees without users",
        );
        console.log(
          "   - createUsersForAllEmployees() - Create users for all employees",
        );
        console.log(
          "   - createUserForEmployee({ id, name, dni, email }) - Specific employee",
        );
        console.log("   🔍 DATABASE DIAGNOSIS:");
        console.log("   - diagnoseEmployeesTable() - Check table structure");
        console.log("   - fixEmployeeUsersQuery() - Safe employee/user query");
        console.log("   🔇 DEBUG CONTROL:");
        console.log("   - silentMode() - Turn off console noise");
        console.log("   - debugModeProduction() - Only errors");
        console.log("   - showDebugStatus() - Current debug settings");
        console.log("   🔧 USER FIXES:");
        console.log("   - fixUser35940844() - Fix DNI 35940844 user");
        console.log("   - testUser35940844Login() - Test DNI 35940844 login");
      },
    )
    .catch((error) => {
      console.error("❌ Failed to load dev tools:", error);
    });
}
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
import { AuthProvider, useAuth } from "@/hooks/use-auth-simple";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthRedirect from "@/components/AuthRedirect";

const queryClient = new QueryClient();

// IMMEDIATE FIX FUNCTIONS - Available right away
const createUserFor35940844 = async () => {
  console.log("🚨 === EMERGENCY USER CREATION FOR DNI 35940844 ===");

  try {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("dni", "35940844")
      .single();

    if (empError || !employee) {
      console.error("❌ Employee not found:", empError);
      return { success: false, error: "Employee not found" };
    }

    console.log("👤 Found employee:", employee.name, employee.email);

    if (!employee.email) {
      console.error("❌ Employee has no email");
      return { success: false, error: "Employee has no email" };
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", employee.email)
      .single();

    if (existingUser) {
      console.log("ℹ️ User already exists in database");
      return { success: true, message: "User already exists" };
    }

    console.log("🔄 Creating auth user...");
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: employee.email,
      password: employee.dni,
      options: {
        data: {
          name: employee.name,
          role: "employee",
        },
      },
    });

    if (authError) {
      console.error("❌ Auth signup failed:", authError.message);

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: employee.email,
          password: employee.dni,
        });

      if (!signInError && signInData.user) {
        console.log("✅ User exists in auth, creating users table entry");

        const { error: usersError } = await supabase.from("users").insert({
          id: signInData.user.id,
          username: employee.dni,
          email: employee.email,
          name: employee.name,
          role: "employee",
          is_active: true,
          password_hash: btoa(employee.dni),
          needs_password_change: false,
          employee_id: employee.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        await supabase.auth.signOut();

        if (usersError) {
          console.error("❌ Failed to create users table entry:", usersError);
          return { success: false, error: usersError.message };
        }

        console.log("✅ User created successfully!");
        return {
          success: true,
          message: "User created from existing auth user",
        };
      }

      return { success: false, error: authError.message };
    }

    if (!authUser.user) {
      console.error("❌ No user returned from signup");
      return { success: false, error: "No user returned" };
    }

    console.log("✅ Auth user created, now creating users table entry...");

    const { error: usersError } = await supabase.from("users").insert({
      id: authUser.user.id,
      username: employee.dni,
      email: employee.email,
      name: employee.name,
      role: "employee",
      is_active: true,
      password_hash: btoa(employee.dni),
      needs_password_change: false,
      employee_id: employee.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (usersError) {
      console.error("❌ Failed to create users table entry:", usersError);
      return { success: false, error: usersError.message };
    }

    console.log("🎉 === USER CREATED SUCCESSFULLY ===");
    console.log(`Employee: ${employee.name}`);
    console.log(`Email: ${employee.email}`);
    console.log(`Password: ${employee.dni} (DNI)`);
    console.log(`Status: Active`);

    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return { success: false, error: error.message };
  }
};

const quickCheckEmployeesWithoutUsers = async () => {
  console.log("🔍 Quick check for employees without users...");

  try {
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name, dni, email")
      .not("email", "is", null)
      .neq("email", "");

    if (empError) {
      console.error("❌ Failed to fetch employees:", empError);
      return;
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("employee_id");

    if (usersError) {
      console.error("❌ Failed to fetch users:", usersError);
      return;
    }

    const employeeIdsWithUsers = users
      .filter((u) => u.employee_id)
      .map((u) => u.employee_id);

    const employeesWithoutUsers = employees.filter(
      (emp) => !employeeIdsWithUsers.includes(emp.id),
    );

    console.log(`📊 Total employees with email: ${employees.length}`);
    console.log(`👤 Employees with users: ${employeeIdsWithUsers.length}`);
    console.log(`❌ Employees without users: ${employeesWithoutUsers.length}`);

    if (employeesWithoutUsers.length > 0) {
      console.log("\n📋 Employees without users:");
      employeesWithoutUsers.forEach((emp) => {
        console.log(`  - ${emp.name} (DNI: ${emp.dni}, Email: ${emp.email})`);
      });
    }

    return employeesWithoutUsers;
  } catch (error) {
    console.error("💥 Check failed:", error);
  }
};

// Expose functions globally immediately
(window as any).createUserFor35940844 = createUserFor35940844;
(window as any).quickCheckEmployeesWithoutUsers =
  quickCheckEmployeesWithoutUsers;

console.log("🚨 IMMEDIATE FIX FUNCTIONS LOADED:");
console.log("  - createUserFor35940844()");
console.log("  - quickCheckEmployeesWithoutUsers()");

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
