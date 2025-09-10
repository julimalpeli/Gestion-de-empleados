import { createClient } from "@supabase/supabase-js";

// Variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

// Debug environment variables on startup
console.log("🔧 Supabase Configuration:");
console.log("   - URL:", supabaseUrl);
console.log(
  "   - Key configured:",
  !!supabaseAnonKey && supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY",
);
console.log("   - Key starts with:", supabaseAnonKey?.slice(0, 20) + "...");

if (
  supabaseUrl === "YOUR_SUPABASE_URL" ||
  supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY"
) {
  console.error("❌ Supabase environment variables not configured!");
  console.error("   - Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  console.error("   - Current URL:", supabaseUrl);
  console.error("   - Current key configured:", !!supabaseAnonKey);
}

// Test connection on module load in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    testSupabaseConnection().then((success) => {
      if (!success) {
        console.warn("⚠️ Supabase connection failed - app may fall back to offline mode");
      }
    });
  }, 1000);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connectivity function
export const testSupabaseConnection = async () => {
  try {
    console.log("🔄 Testing Supabase connection...");
    console.log("   - URL:", supabaseUrl);
    console.log("   - Key length:", supabaseAnonKey?.length || 0);
    console.log("   - Key prefix:", supabaseAnonKey?.slice(0, 20) + "...");

    const { data, error } = await supabase
      .from("employees")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("❌ Supabase connection test failed:");
      console.error("   - Error code:", error.code);
      console.error("   - Error message:", error.message);
      console.error("   - Error details:", error.details);
      console.error("   - Error hint:", error.hint);
      console.error("   - Full error object:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("✅ Supabase connection test successful");
    console.log("   - Count data:", data);
    return true;
  } catch (error) {
    console.error("�� Supabase connection test exception:");
    console.error("   - Error type:", typeof error);
    console.error(
      "   - Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("   - Error constructor:", error?.constructor?.name);
    console.error("   - Full error object:", JSON.stringify(error, null, 2));
    console.error("   - Raw error:", error);
    return false;
  }
};

// Enhanced error logging utility
export const logSupabaseError = (context: string, error: any) => {
  console.error(`❌ ${context}:`);

  if (error && typeof error === "object") {
    console.error("   - Error details:", JSON.stringify({
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      errorType: typeof error,
      errorConstructor: error.constructor?.name,
    }, null, 2));
  }

  console.error("   - Raw error object:", error);

  // Check for common network errors
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    console.error("   - 🌐 NETWORK ERROR: Cannot reach Supabase server");
    console.error("   - 🔗 Check internet connection and Supabase URL");
  }
};

// Database Types - Estas se generarán automáticamente después
export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee;
        Insert: Omit<Employee, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Employee, "id" | "created_at">>;
      };
      payroll_records: {
        Row: PayrollRecord;
        Insert: Omit<PayrollRecord, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PayrollRecord, "id" | "created_at">>;
      };
      vacation_requests: {
        Row: VacationRequest;
        Insert: Omit<VacationRequest, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<VacationRequest, "id" | "created_at">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
    };
  };
}

// Interfaces de dominio
export interface Employee {
  id: string;
  name: string;
  job_position: string;
  white_wage: number;
  informal_wage: number;
  daily_wage: number;
  presentismo: number;
  loses_presentismo: boolean;
  status: "active" | "inactive";
  start_date: string;
  vacation_days: number;
  vacations_taken: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period: string;
  base_days: number;
  holiday_days: number;
  base_amount: number;
  holiday_bonus: number;
  aguinaldo: number;
  discounts: number;
  advances: number;
  white_amount: number;
  informal_amount: number;
  presentismo_amount: number;
  overtime_hours?: number;
  overtime_amount?: number;
  bonus_amount?: number;
  net_total: number;
  status: "draft" | "pending" | "processed";
  processed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface VacationRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  request_date: string;
  approved_by?: string;
  approved_date?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "hr" | "employee" | "readonly";
  employee_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
