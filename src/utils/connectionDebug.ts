import { supabase, testSupabaseConnection, logSupabaseError } from "@/lib/supabase";

// Simple connection test utility for debugging
export const debugConnection = async () => {
  console.log("🔧 === SUPABASE CONNECTION DEBUG ===");
  
  // Check environment variables
  console.log("📋 Environment Check:");
  console.log("   - URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("   - Key configured:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log("   - Key length:", import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0);
  console.log("   - Key prefix:", import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20) + "...");
  
  // Test basic connection
  console.log("\n🔄 Testing Basic Connection:");
  const isConnected = await testSupabaseConnection();
  
  if (!isConnected) {
    console.log("❌ Basic connection failed");
    
    // Try a simple auth test
    console.log("\n🔄 Testing Auth Service:");
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log("   - Auth data:", data);
      console.log("   - Auth error:", error);
    } catch (authError) {
      logSupabaseError("Auth test", authError);
    }
    
    // Try a simple table query
    console.log("\n🔄 Testing Table Access:");
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("count")
        .limit(1);
      
      console.log("   - Table data:", data);
      console.log("   - Table error:", error);
    } catch (tableError) {
      logSupabaseError("Table test", tableError);
    }
  } else {
    console.log("✅ Connection successful!");
    
    // Test data access
    console.log("\n🔄 Testing Data Access:");
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name")
        .limit(3);
        
      if (error) {
        logSupabaseError("Data access test", error);
      } else {
        console.log("   - Sample employees:", data);
      }
    } catch (dataError) {
      logSupabaseError("Data access test", dataError);
    }
  }
  
  console.log("\n🏁 Connection debug complete");
  return isConnected;
};

// Simple retry utility
export const retryConnection = async (maxRetries = 3) => {
  console.log(`🔄 Retrying connection (max ${maxRetries} attempts)...`);
  
  for (let i = 1; i <= maxRetries; i++) {
    console.log(`   - Attempt ${i}/${maxRetries}`);
    const isConnected = await testSupabaseConnection();
    
    if (isConnected) {
      console.log("✅ Connection restored!");
      return true;
    }
    
    if (i < maxRetries) {
      console.log(`   - Failed, waiting 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("❌ All retry attempts failed");
  return false;
};

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).debugConnection = debugConnection;
  (window as any).retryConnection = retryConnection;
  
  console.log("🔧 Connection debug tools loaded:");
  console.log("   - debugConnection() - Run full connection diagnosis");
  console.log("   - retryConnection() - Retry connection with delays");
}
