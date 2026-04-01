/**
 * Emergency auth has been removed for security.
 * All authentication must go through Supabase Auth.
 * These functions are kept as no-ops for backward compatibility.
 */

export const emergencyAdminLogin = async () => {
  console.warn(
    "⛔ emergencyAdminLogin() has been removed. Use Supabase Auth to log in.",
  );
  return null;
};

export const clearEmergencyAuth = () => {
  localStorage.removeItem("emergency-auth");
};

export const checkEmergencyAuth = () => {
  // Always clean up old data and return null
  localStorage.removeItem("emergency-auth");
  return null;
};
