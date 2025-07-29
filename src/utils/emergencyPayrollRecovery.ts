// Emergency payroll recovery utility

export const activatePayrollFallbackNow = async () => {
  console.log("🚨 EMERGENCY PAYROLL RECOVERY INITIATED");
  
  try {
    // Import fallback data
    const { getFallbackPayrollData } = await import("@/utils/offlineFallback");
    const fallbackData = getFallbackPayrollData();
    
    if (!fallbackData || fallbackData.length === 0) {
      console.error("❌ No fallback data available");
      return { success: false, error: "No fallback data" };
    }
    
    console.log("✅ Fallback data loaded:", fallbackData.length, "records");
    
    // Trigger a custom event to notify the payroll hook
    window.dispatchEvent(new CustomEvent('emergency-payroll-fallback', {
      detail: { data: fallbackData }
    }));
    
    console.log("🎉 Emergency recovery complete - payroll should work now");
    return { success: true, data: fallbackData };
    
  } catch (error) {
    console.error("💥 Emergency recovery failed:", error);
    return { success: false, error };
  }
};

// Quick test function
export const testPayrollFallback = async () => {
  console.log("🧪 Testing payroll fallback...");
  
  try {
    const { getFallbackPayrollData } = await import("@/utils/offlineFallback");
    const data = getFallbackPayrollData();
    
    console.log("📊 Fallback test results:");
    console.log("  - Records available:", data?.length || 0);
    console.log("  - Sample record:", data?.[0]);
    
    return data;
  } catch (error) {
    console.error("❌ Fallback test failed:", error);
    return null;
  }
};

// Auto-activate in development
if (import.meta.env.DEV) {
  (window as any).emergencyPayrollRecovery = activatePayrollFallbackNow;
  (window as any).testPayrollFallback = testPayrollFallback;
  
  console.log("🛠️ Emergency payroll functions available:");
  console.log("  - emergencyPayrollRecovery()");
  console.log("  - testPayrollFallback()");
}
