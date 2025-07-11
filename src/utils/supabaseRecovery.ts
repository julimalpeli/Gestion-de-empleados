import { supabase } from "@/lib/supabase";

// Función de recuperación para queries que fallan
export const recoverSupabaseQueries = async () => {
  console.log("🔧 Ejecutando recuperación de Supabase...");

  try {
    // Test 1: Verificar conexión básica
    console.log("1. Probando conexión básica...");
    const { data: authUser } = await supabase.auth.getUser();
    console.log("✅ Auth funciona:", !!authUser);

    // Test 2: Probar query simple de empleados
    console.log("2. Probando query de empleados...");
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name")
      .limit(1);

    if (empError) {
      console.error("❌ Error empleados:", empError);
    } else {
      console.log("✅ Empleados OK:", employees?.length || 0);
    }

    // Test 3: Probar query de payroll
    console.log("3. Probando query de payroll...");
    const { data: payroll, error: payError } = await supabase
      .from("payroll_records")
      .select("id, period")
      .limit(1);

    if (payError) {
      console.error("❌ Error payroll:", payError);
    } else {
      console.log("✅ Payroll OK:", payroll?.length || 0);
    }

    // Test 4: Verificar estado de RLS
    console.log("4. Probando permisos RLS...");
    const { data: rls, error: rlsError } = await supabase.rpc("version");

    if (rlsError) {
      console.warn("⚠️ RLS test failed:", rlsError);
    } else {
      console.log("✅ RLS/Permisos OK");
    }

    return {
      success: true,
      auth: !!authUser,
      employees: !empError,
      payroll: !payError,
      rls: !rlsError,
    };
  } catch (error) {
    console.error("❌ Error en recuperación:", error);
    return { success: false, error };
  }
};

// Función para limpiar cache y reiniciar cliente
export const refreshSupabaseClient = () => {
  console.log("🔄 Refrescando cliente Supabase...");

  // Limpiar cualquier cache local
  if (typeof window !== "undefined") {
    // Limpiar localStorage relacionado con Supabase
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes("supabase") || key.includes("sb-")) {
        localStorage.removeItem(key);
        console.log("🧹 Limpiado:", key);
      }
    });
  }

  // Intentar reconectar
  return supabase.auth.getSession();
};

// Función para verificar y reparar empleados específicos
export const checkEmployeeData = async (email?: string) => {
  console.log("👥 Verificando datos de empleados...");

  try {
    let query = supabase.from("employees").select("*");

    if (email) {
      query = query.eq("email", email);
    } else {
      query = query.limit(5);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error obteniendo empleados:", error);
      return { success: false, error };
    }

    console.log("✅ Empleados encontrados:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("📊 Primer empleado:", {
        name: data[0].name,
        email: data[0].email,
        status: data[0].status,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("❌ Error verificando empleados:", error);
    return { success: false, error };
  }
};

// Función para verificar payroll específico
export const checkPayrollData = async (employeeEmail?: string) => {
  console.log("💰 Verificando datos de payroll...");

  try {
    let query = supabase.from("payroll_records").select(`
        *,
        employee:employees(name, email, white_wage, informal_wage)
      `);

    if (employeeEmail) {
      query = query.eq("employee.email", employeeEmail);
    } else {
      query = query.limit(5);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error obteniendo payroll:", error);
      return { success: false, error };
    }

    console.log("✅ Registros payroll encontrados:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("📊 Primer registro:", {
        period: data[0].period,
        employee: data[0].employee?.name,
        netTotal: data[0].net_total,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("❌ Error verificando payroll:", error);
    return { success: false, error };
  }
};

// Hacer funciones disponibles globalmente
if (typeof window !== "undefined") {
  (window as any).recoverSupabaseQueries = recoverSupabaseQueries;
  (window as any).refreshSupabaseClient = refreshSupabaseClient;
  (window as any).checkEmployeeData = checkEmployeeData;
  (window as any).checkPayrollData = checkPayrollData;
}
