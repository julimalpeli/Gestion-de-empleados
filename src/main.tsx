import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./hooks/use-auth-simple";
import "./index.css";
import { testSupabaseConnection } from "./lib/supabase";
import "./utils/autoReloadOnError"; // Initialize auto-reload error handler
import "./utils/emergencyPayrollRecovery"; // Emergency payroll recovery

// Suppress ResizeObserver warnings
const resizeObserverErrorHandler = (e: ErrorEvent) => {
  if (
    e.message ===
    "ResizeObserver loop completed with undelivered notifications."
  ) {
    e.stopImmediatePropagation();
  }
};

window.addEventListener("error", resizeObserverErrorHandler);

// Test Supabase connection on startup
testSupabaseConnection().then((success) => {
  if (!success) {
    console.warn("⚠️ Supabase connection test failed, but app will continue");
  }
});

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
