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

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-client-info': 'cadiz-bar-tapas-app'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Connection state management
let connectionState: 'testing' | 'connected' | 'disconnected' | 'error' = 'testing';
let lastSuccessfulConnection: Date | null = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;

// Test connectivity function with enhanced error handling
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("🔄 Testing Supabase connection...");
    console.log("   - URL:", supabaseUrl);
    console.log("   - Key length:", supabaseAnonKey?.length || 0);
    console.log("   - Key prefix:", supabaseAnonKey?.slice(0, 20) + "...");

    connectionState = 'testing';
    
    // Simple health check query with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const { data, error } = await supabase
      .from("employees")
      .select("count", { count: "exact", head: true })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      console.error("❌ Supabase connection test failed:");
      console.error("   - Error code:", error.code);
      console.error("   - Error message:", error.message);
      console.error("   - Error details:", error.details);
      console.error("   - Error hint:", error.hint);
      
      connectionState = 'error';
      connectionRetries++;
      return false;
    }

    console.log("✅ Supabase connection test successful");
    console.log("   - Count data:", data);
    
    connectionState = 'connected';
    lastSuccessfulConnection = new Date();
    connectionRetries = 0;
    return true;
  } catch (error) {
    console.error("💥 Supabase connection test exception:");
    console.error("   - Error type:", typeof error);
    console.error(
      "   - Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("   - Error constructor:", error?.constructor?.name);
    
    // Check for specific network errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error("   - 🕐 CONNECTION TIMEOUT: Request took longer than 10 seconds");
      } else if (error.message.includes('Failed to fetch')) {
        console.error("   - 🌐 NETWORK ERROR: Cannot reach Supabase server");
        console.error("   - 🔗 Check internet connection and Supabase URL");
      } else if (error.message.includes('NetworkError')) {
        console.error("   - 🌐 NETWORK ERROR: Network request failed");
      }
    }
    
    connectionState = 'disconnected';
    connectionRetries++;
    return false;
  }
};

// Enhanced error logging utility
export const logSupabaseError = (context: string, error: any) => {
  console.group(`❌ ${context}`);

  if (error && typeof error === "object") {
    console.error(
      "Error details:",
      JSON.stringify(
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          errorType: typeof error,
          errorConstructor: error.constructor?.name,
        },
        null,
        2,
      ),
    );
  }

  console.error("Raw error object:", error);

  // Enhanced error analysis
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    console.error("🌐 NETWORK ERROR: Cannot reach Supabase server");
    console.error("🔗 Possible causes:");
    console.error("   - Internet connection issues");
    console.error("   - Supabase URL is incorrect");
    console.error("   - Firewall blocking the request");
    console.error("   - CORS configuration issues");
  } else if (error?.code === 'PGRST301') {
    console.error("🔒 RLS POLICY ERROR: Row Level Security is blocking the query");
  } else if (error?.code === '42501') {
    console.error("🔒 PERMISSION ERROR: Insufficient database permissions");
  } else if (error?.code === 'PGRST116') {
    console.error("📊 QUERY ERROR: Malformed query or missing table");
  }
  
  console.error("🌍 Connection state:", connectionState);
  console.error("📅 Last successful connection:", lastSuccessfulConnection?.toISOString() || 'Never');
  console.error("🔄 Connection retries:", connectionRetries);
  
  console.groupEnd();
};

// Connection health checker
export const getConnectionHealth = () => {
  return {
    state: connectionState,
    lastSuccessfulConnection,
    retries: connectionRetries,
    isHealthy: connectionState === 'connected' && connectionRetries < MAX_RETRIES
  };
};

// Retry mechanism for queries
export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 2
): Promise<T> => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`🔄 ${operationName} (attempt ${attempt}/${maxRetries + 1})`);
      
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded on retry attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      logSupabaseError(`${operationName} - Attempt ${attempt}`, error);
      
      // Don't retry on certain types of errors
      if (error && typeof error === 'object') {
        const errorCode = (error as any).code;
        const errorMessage = (error as any).message;
        
        // Don't retry on authentication/permission errors
        if (errorCode === '42501' || errorCode === 'PGRST301') {
          console.log(`❌ ${operationName} - Not retrying auth/permission error`);
          break;
        }
        
        // Don't retry on malformed queries
        if (errorCode === 'PGRST116') {
          console.log(`❌ ${operationName} - Not retrying query error`);
          break;
        }
      }
      
      // Check if it's a network error that we can retry
      const isNetworkError = 
        error instanceof TypeError && 
        (error.message.includes("Failed to fetch") || 
         error.message.includes("NetworkError") ||
         error.message.includes("AbortError"));
      
      if (attempt <= maxRetries && isNetworkError) {
        const delay = attempt * 1000; // Progressive delay: 1s, 2s, 3s
        console.log(`⏳ ${operationName} - Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a network error or we're out of retries, break
      break;
    }
  }
  
  throw lastError;
};

// Test connection on module load in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    testSupabaseConnection().then((success) => {
      if (!success) {
        console.warn(
          "⚠️ Supabase connection failed - app will fall back to offline mode",
        );
      }
    });
  }, 1000);
}

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
  sueldo_base: number;
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
