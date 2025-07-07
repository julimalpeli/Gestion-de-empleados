import { supabase } from "@/lib/supabase";

// EMERGENCY AUTH BYPASS - ONLY FOR FIXING AUTH ISSUES
export const emergencyAdminLogin = async () => {
  console.log("🚨 EMERGENCY ADMIN LOGIN - USE ONLY FOR FIXING AUTH ISSUES");

  // Create a temporary session without Supabase auth
  const mockUser = {
    id: "emergency-admin-id",
    username: "admin",
    name: "Emergency Admin Access",
    role: "admin" as const,
    email: "julimalpeli@gmail.com",
    employeeId: undefined,
    permissions: ["all"],
    loginTime: new Date().toISOString(),
    needsPasswordChange: false,
  };

  // Store in localStorage temporarily
  localStorage.setItem("emergency-auth", JSON.stringify(mockUser));

  console.log("🔓 Emergency admin access granted");
  console.log("⚠️ This bypasses normal authentication");
  console.log("🔄 Please refresh the page to activate");

  return mockUser;
};

export const clearEmergencyAuth = () => {
  localStorage.removeItem("emergency-auth");
  console.log("🧹 Emergency auth cleared");
};

export const checkEmergencyAuth = () => {
  try {
    const stored = localStorage.getItem("emergency-auth");
    if (stored) {
      const user = JSON.parse(stored);
      console.log("🚨 Using emergency auth for:", user.email);
      return user;
    }
  } catch (error) {
    console.error("Error checking emergency auth:", error);
  }
  return null;
};

// Make functions available globally
if (typeof window !== "undefined") {
  (window as any).emergencyAdminLogin = emergencyAdminLogin;
  (window as any).clearEmergencyAuth = clearEmergencyAuth;
  (window as any).checkEmergencyAuth = checkEmergencyAuth;
  console.log("🚨 Emergency auth functions available:");
  console.log("   - emergencyAdminLogin() - EMERGENCY USE ONLY");
  console.log("   - clearEmergencyAuth()");
  console.log("   - checkEmergencyAuth()");
}
