import { supabase, testSupabaseConnection, getConnectionHealth } from "@/lib/supabase";

// Test all critical connections
export const testAllConnections = async () => {
  console.log("🔍 Testing all system connections...");
  
  const results = {
    supabase: false,
    internet: false,
    timestamp: new Date().toISOString()
  };
  
  // Test internet connectivity
  try {
    await fetch('https://www.google.com/favicon.ico', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    results.internet = true;
    console.log("✅ Internet connection: OK");
  } catch (error) {
    console.log("❌ Internet connection: FAILED");
    console.error("Internet test error:", error);
  }
  
  // Test Supabase connection
  results.supabase = await testSupabaseConnection();
  
  // Log health status
  const health = getConnectionHealth();
  console.log("💊 Overall connection health:", {
    ...results,
    health
  });
  
  return results;
};

// Diagnose specific connection issues
export const diagnoseConnectionIssues = async () => {
  console.log("🔍 Diagnosing connection issues...");
  
  const issues = [];
  const suggestions = [];
  
  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    issues.push("VITE_SUPABASE_URL not configured");
    suggestions.push("Set VITE_SUPABASE_URL in environment variables");
  }
  
  if (!supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
    issues.push("VITE_SUPABASE_ANON_KEY not configured");
    suggestions.push("Set VITE_SUPABASE_ANON_KEY in environment variables");
  }
  
  // Test basic connectivity
  const connectionTest = await testAllConnections();
  
  if (!connectionTest.internet) {
    issues.push("No internet connectivity");
    suggestions.push("Check your internet connection");
  }
  
  if (!connectionTest.supabase) {
    issues.push("Supabase connection failed");
    suggestions.push("Check Supabase URL and API key");
    suggestions.push("Verify Supabase project is active");
  }
  
  // Test specific Supabase functionality
  try {
    const { data, error } = await supabase.from('employees').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST301') {
        issues.push("Row Level Security is blocking queries");
        suggestions.push("Check RLS policies on employees table");
      } else if (error.code === '42501') {
        issues.push("Insufficient database permissions");
        suggestions.push("Check user permissions in Supabase");
      } else {
        issues.push(`Database error: ${error.message}`);
        suggestions.push("Check Supabase logs for more details");
      }
    }
  } catch (queryError) {
    issues.push("Failed to execute test query");
    suggestions.push("Check network connectivity to Supabase");
  }
  
  const diagnosis = {
    timestamp: new Date().toISOString(),
    issues,
    suggestions,
    connectionTest,
    environment: {
      hasUrl: !!supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL',
      hasKey: !!supabaseKey && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY',
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    }
  };
  
  console.log("🏥 Connection diagnosis:", diagnosis);
  return diagnosis;
};

// Auto-retry mechanism for critical operations
export const withConnectionRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} (attempt ${attempt}/${maxRetries})`);
      
      if (attempt > 1) {
        // Test connection before retry
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          console.log(`❌ ${operationName} - Connection still down, skipping retry`);
          throw new Error("Connection unavailable");
        }
      }
      
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded on retry attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ ${operationName} attempt ${attempt} failed:`, error);
      
      // Don't retry on certain types of errors
      if (error && typeof error === 'object') {
        const errorCode = (error as any).code;
        
        // Don't retry on authentication/permission errors
        if (errorCode === '42501' || errorCode === 'PGRST301') {
          console.log(`❌ ${operationName} - Not retrying auth/permission error`);
          break;
        }
      }
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // Progressive delay
        console.log(`⏳ ${operationName} - Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
