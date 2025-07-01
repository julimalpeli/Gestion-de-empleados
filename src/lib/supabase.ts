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
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connectivity function
export const testSupabaseConnection = async () => {
  try {
    console.log("🔄 Testing Supabase connection...");
    const { data, error } = await supabase
      .from("employees")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("❌ Supabase connection test failed:", error);
      return false;
    }

    console.log("✅ Supabase connection test successful");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection test error:", error);
    return false;
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
