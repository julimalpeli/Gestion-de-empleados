/**
 * Auth user utilities.
 * Hardcoded credentials have been removed for security.
 * User management should be done through the admin panel (Gestión de Usuarios).
 */

import { supabase } from "@/lib/supabase";

export const verifyAuthUsers = async () => {
  console.warn(
    "⛔ verifyAuthUsers() with hardcoded credentials has been removed for security.",
  );
  console.log(
    "💡 Use the admin panel (Gestión de Usuarios) to manage users.",
  );
};

export const resetUserPassword = async (email: string, newPassword: string) => {
  console.warn(
    "⛔ Use the admin panel (Gestión de Usuarios) to reset passwords.",
  );
  return false;
};

export const listAuthUsers = async () => {
  console.warn(
    "⛔ listAuthUsers() requires admin privileges. Use the Supabase dashboard.",
  );
};
