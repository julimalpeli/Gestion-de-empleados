// Emergency navigation utilities for debugging routing issues

export const forceNavigateTo = (path: string) => {
  console.log(`🚀 Force navigating to: ${path}`);
  window.history.pushState({}, "", path);
  window.location.reload();
};

export const debugRouting = () => {
  console.log("🔍 Routing Debug Info:");
  console.log("- Current pathname:", window.location.pathname);
  console.log("- Current href:", window.location.href);
  console.log("- History state:", window.history.state);

  // Check what's actually mounted
  const loginElements = document.querySelectorAll('[data-loc*="Login"]');
  const employeeElements = document.querySelectorAll('[data-loc*="Employees"]');
  const dashboardElements = document.querySelectorAll(
    '[data-loc*="Dashboard"]',
  );

  console.log("- Login components mounted:", loginElements.length);
  console.log("- Employee components mounted:", employeeElements.length);
  console.log("- Dashboard components mounted:", dashboardElements.length);

  if (loginElements.length > 0) {
    console.log("❌ Login component is being rendered when it shouldn't be");
  }
};

export const forceEmployeesView = () => {
  console.log("👥 Forcing employees view...");
  forceNavigateTo("/empleados");
};

export const forceDashboardView = () => {
  console.log("📊 Forcing dashboard view...");
  forceNavigateTo("/");
};

export const forcePayrollView = () => {
  console.log("💰 Forcing payroll view...");
  forceNavigateTo("/liquidaciones");
};

// Auto-expose functions globally
if (typeof window !== "undefined") {
  (window as any).forceNavigateTo = forceNavigateTo;
  (window as any).debugRouting = debugRouting;
  (window as any).forceEmployeesView = forceEmployeesView;
  (window as any).forceDashboardView = forceDashboardView;
  (window as any).forcePayrollView = forcePayrollView;

  console.log("🚀 EMERGENCY NAVIGATION LOADED:");
  console.log("   - debugRouting() - Show routing debug info");
  console.log("   - forceEmployeesView() - Force navigate to employees");
  console.log("   - forceDashboardView() - Force navigate to dashboard");
  console.log("   - forcePayrollView() - Force navigate to payroll");
  console.log("   - forceNavigateTo('/path') - Force navigate to any path");
}
