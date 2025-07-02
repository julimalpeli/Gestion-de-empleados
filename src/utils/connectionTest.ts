import { supabase } from "@/lib/supabase";

export const testConnection = async () => {
  console.log("🔄 Testing network connectivity...");

  try {
    // Test basic connectivity to Supabase
    const startTime = Date.now();

    // Simple connectivity test
    const { data, error } = await supabase
      .from("employees")
      .select("count")
      .limit(1);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (error) {
      console.error("❌ Supabase connection failed:", error);
      return {
        success: false,
        error: error.message,
        suggestion:
          "Verifique la configuración de Supabase y la conexión a internet",
      };
    }

    console.log(`✅ Supabase connection successful (${responseTime}ms)`);
    return {
      success: true,
      responseTime,
      message: "Conexión exitosa a Supabase",
    };
  } catch (error) {
    console.error("❌ Network error:", error);

    if (error.message?.includes("Failed to fetch")) {
      return {
        success: false,
        error: "Network connectivity issue",
        suggestion:
          "Verifique su conexión a internet. Puede que Supabase esté temporalmente no disponible.",
      };
    }

    return {
      success: false,
      error: error.message,
      suggestion: "Error desconocido de conectividad",
    };
  }
};

// Make available globally for debugging
if (typeof window !== "undefined") {
  (window as any).testConnection = testConnection;
  console.log("🔧 testConnection() available in console");
}
