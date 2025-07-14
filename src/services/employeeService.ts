import { supabase } from "@/lib/supabase";
import { auditService } from "@/services/auditService";
import type {
  IEmployeeService,
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  VacationCalculation,
} from "./interfaces";

// Implementación con Supabase - Se puede cambiar fácilmente
export class SupabaseEmployeeService implements IEmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔄 Consultando empleados en Supabase (intento ${attempt}/${maxRetries})...`,
        );

        if (attempt === 1) {
          console.log("🔗 URL Supabase:", import.meta.env.VITE_SUPABASE_URL);
          console.log(
            "🔑 Key configurada:",
            !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          );
        }

        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Error de Supabase completo:", error);
          console.error("❌ Error message:", error.message);
          console.error("❌ Error code:", error.code);
          console.error("❌ Error details:", error.details);
          console.error("❌ Error hint:", error.hint);
          throw new Error(
            `Supabase error: ${error.message} (Code: ${error.code})`,
          );
        }

        console.log(
          `✅ Successfully fetched ${data.length} employees on attempt ${attempt}`,
        );
        const mappedData = data.map(this.mapFromSupabase);
        return mappedData;
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error);

        // Check if it's a network connectivity error
        const isNetworkError =
          error instanceof TypeError &&
          (error.message.includes("Failed to fetch") ||
            error.message.includes("Network"));

        if (attempt < maxRetries && isNetworkError) {
          console.log(
            `⏳ Network error detected, retrying in ${attempt * 2} seconds...`,
          );
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
          continue;
        }

        // If it's not a network error or we're out of retries, break
        break;
      }
    }

    // If we get here, all retries failed
    console.error("❌ All retries failed. Last error:", lastError);

    if (
      lastError instanceof TypeError &&
      lastError.message === "Failed to fetch"
    ) {
      throw new Error(
        "Error de conectividad: No se puede conectar a la base de datos. Verifique su conexión a internet.",
      );
    }

    throw lastError || new Error("Unknown error occurred");
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      console.log(`🔍 Looking for employee with ID: ${id}`);

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id);

      console.log("📊 Employee lookup result:", {
        data,
        error,
        found: data?.length,
      });

      if (error) {
        console.error("Error in getEmployeeById:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("❌ Employee not found");
        return null;
      }

      console.log("✅ Employee found:", data[0].name);
      return this.mapFromSupabase(data[0]);
    } catch (error) {
      console.error("Error fetching employee:", error);
      throw new Error("Failed to fetch employee");
    }
  }

  async createEmployee(employee: CreateEmployeeRequest): Promise<Employee> {
    try {
      console.log("Creating employee with input:", employee);

      const dailyWage = (employee.whiteWage + employee.informalWage) / 30;
      const vacationInfo = this.calculateVacationDays(employee.startDate);

      const newEmployee = {
        name: employee.name,
        dni: employee.dni,
        document_type: employee.documentType || "dni",
        job_position: employee.position,
        white_wage: employee.whiteWage,
        informal_wage: employee.informalWage,
        daily_wage: Math.round(dailyWage),
        presentismo: employee.presentismo,
        loses_presentismo: false,
        status: "active" as const,
        start_date: employee.startDate,
        vacation_days: vacationInfo.vacationDays,
        vacations_taken: 0,
        address: employee.address || "",
        email: employee.email || "",
      };

      console.log("Sending to Supabase:", newEmployee);

      const { data, error } = await supabase
        .from("employees")
        .insert(newEmployee)
        .select()
        .single();

      console.log("Supabase response:", { data, error });

      if (error) throw error;

      return this.mapFromSupabase(data);
    } catch (error) {
      console.error("Error creating employee:", error);
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(`Failed to create employee: ${error.message}`);
      }
      throw new Error("Failed to create employee: Unknown error");
    }
  }

  async updateEmployee(
    id: string,
    employee: UpdateEmployeeRequest,
  ): Promise<Employee> {
    try {
      console.log(`🔄 Updating employee ${id} with data:`, employee);

      // Check for problematic ID and provide specific diagnostics
      if (id === "f33d0128-11b8-4ff2-b226-c6e9a2014fed") {
        console.warn(
          "⚠️ Problematic employee ID detected, running full diagnostics...",
        );

        // Get all employees to see what's available
        const { data: allEmployees, error: allError } = await supabase
          .from("employees")
          .select("id, name, status")
          .limit(5);

        console.log(
          "📊 Sample employees:",
          JSON.stringify(allEmployees, null, 2),
        );
        console.log("📊 Total query error:", JSON.stringify(allError, null, 2));

        const found = allEmployees?.find((emp) => emp.id === id);
        if (!found) {
          throw new Error(
            `Employee ${id} does not exist. Available employees: ${allEmployees?.length || 0}. This may be a stale ID from the frontend.`,
          );
        }
      }

      console.log("⚡ Proceeding with update...");

      const updateData: any = {};

      if (employee.name) updateData.name = employee.name;
      if (employee.dni) updateData.dni = employee.dni;
      if (employee.documentType)
        updateData.document_type = employee.documentType;
      if (employee.position) updateData.job_position = employee.position;
      if (employee.whiteWage !== undefined)
        updateData.white_wage = employee.whiteWage;
      if (employee.informalWage !== undefined)
        updateData.informal_wage = employee.informalWage;
      if (employee.presentismo !== undefined)
        updateData.presentismo = employee.presentismo;
      if (employee.losesPresentismo !== undefined)
        updateData.loses_presentismo = employee.losesPresentismo;
      if (employee.status) updateData.status = employee.status;
      if (employee.startDate) updateData.start_date = employee.startDate;
      if (employee.address !== undefined) updateData.address = employee.address;
      if (employee.email !== undefined) updateData.email = employee.email;

      // Recalcular sueldo diario si cambiaron los sueldos
      if (
        employee.whiteWage !== undefined ||
        employee.informalWage !== undefined
      ) {
        const current = await this.getEmployeeById(id);
        if (current) {
          const whiteWage = employee.whiteWage ?? current.whiteWage;
          const informalWage = employee.informalWage ?? current.informalWage;
          updateData.daily_wage = Math.round((whiteWage + informalWage) / 30);
        }
      }

      // Recalcular automáticamente vacaciones si cambió la fecha de inicio
      if (employee.startDate) {
        const vacationInfo = this.calculateVacationDays(employee.startDate);
        updateData.vacation_days = vacationInfo.vacationDays;
        updateData.start_date = employee.startDate;
        console.log(
          `🔄 Recalculando vacaciones para nueva fecha: ${employee.startDate} ��� ${vacationInfo.vacationDays} días`,
        );
      }

      updateData.updated_at = new Date().toISOString();

      console.log("📝 Update data prepared:", updateData);

      const { data, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", id)
        .select();

      console.log("📊 Update query result:", {
        data,
        error,
        rowsAffected: data?.length,
      });

      if (error) {
        console.error("Supabase update error:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          updateData,
          employeeId: id,
        });
        throw error;
      }

      // Check if any rows were updated
      if (!data || data.length === 0) {
        console.error("❌ No rows were updated. Running diagnostics...");

        // Try a simple count query to check if employee exists
        try {
          const { data: checkData, error: checkError } = await supabase
            .from("employees")
            .select("count", { count: "exact", head: true })
            .eq("id", id);

          console.error("🔍 Employee existence check:");
          console.error("   - Data:", JSON.stringify(checkData, null, 2));
          console.error("   - Error:", JSON.stringify(checkError, null, 2));

          // Also try to get the actual employee record
          const { data: employeeData, error: employeeError } = await supabase
            .from("employees")
            .select("id, name, status")
            .eq("id", id);

          console.error("🔍 Employee record check:");
          console.error("   - Data:", JSON.stringify(employeeData, null, 2));
          console.error("   - Error:", JSON.stringify(employeeError, null, 2));
        } catch (checkErr) {
          console.error(
            "❌ Error checking employee existence:",
            JSON.stringify(checkErr, null, 2),
          );
        }

        throw new Error(
          `Employee with ID ${id} not found or could not be updated`,
        );
      }

      if (data.length > 1) {
        console.warn(`Multiple employees found with ID ${id}, using first one`);
      }

      return this.mapFromSupabase(data[0]);
    } catch (error) {
      console.error("Error updating employee:", error);
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(`Failed to update employee: ${(error as any).message}`);
      }
      throw new Error("Failed to update employee: Unknown error");
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);

      if (error) {
        console.error("Supabase delete error:", JSON.stringify(error, null, 2));

        // Handle specific database errors
        if (error.code === "23503") {
          if (error.details?.includes('table "users"')) {
            throw new Error(
              "No se puede eliminar el empleado porque tiene una cuenta de usuario asociada. Elimina primero el usuario en la sección 'Gestión de Usuarios' o desactiva el empleado.",
            );
          } else if (error.details?.includes("payroll")) {
            throw new Error(
              "No se puede eliminar el empleado porque tiene registros de liquidaciones. Primero desactívalo.",
            );
          } else {
            throw new Error(
              "No se puede eliminar el empleado porque tiene registros relacionados. Primero desactívalo.",
            );
          }
        }

        if (error.code === "23505") {
          throw new Error("Error de integridad de datos al eliminar empleado");
        }

        // Handle policy violations (RLS)
        if (error.code === "42501" || error.message?.includes("permission")) {
          throw new Error("No tienes permisos para eliminar este empleado");
        }

        // Generic database error with specific message
        throw new Error(
          `Error de base de datos: ${error.message || error.details || "Error desconocido"}`,
        );
      }
    } catch (error) {
      console.error("Error deleting employee:", error);

      // If it's already our custom error, re-throw it
      if (
        error instanceof Error &&
        error.message !== "Failed to delete employee"
      ) {
        throw error;
      }

      // Generic fallback
      throw new Error(
        `No se pudo eliminar el empleado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  async toggleEmployeeStatus(id: string): Promise<Employee> {
    try {
      const current = await this.getEmployeeById(id);
      if (!current) throw new Error("Employee not found");

      const newStatus = current.status === "active" ? "inactive" : "active";
      return await this.updateEmployee(id, { status: newStatus });
    } catch (error) {
      console.error("Error toggling employee status:", error);
      throw new Error("Failed to toggle employee status");
    }
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .or(`name.ilike.%${query}%, job_position.ilike.%${query}%`)
        .order("name");

      if (error) throw error;

      return data.map(this.mapFromSupabase);
    } catch (error) {
      console.error("Error searching employees:", error);
      throw new Error("Failed to search employees");
    }
  }

  calculateVacationDays(startDate: string): VacationCalculation {
    const start = new Date(startDate);
    const today = new Date();

    // Calcular años y meses de antigüedad
    const yearsDiff = today.getFullYear() - start.getFullYear();
    const monthsDiff = today.getMonth() - start.getMonth();
    const daysDiff = today.getDate() - start.getDate();

    let years = yearsDiff;
    let totalMonths = years * 12 + monthsDiff;

    if (daysDiff < 0) {
      totalMonths--;
    }

    if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
      years--;
    }

    // Solo otorgar vacaciones después de 6 meses de antigüedad
    let vacationDays = 0;

    if (totalMonths >= 6) {
      // Determinar días de vacaciones según antigüedad (después de 6 meses)
      vacationDays = 14; // Por defecto hasta 5 años
      if (years >= 20) {
        vacationDays = 35;
      } else if (years >= 10) {
        vacationDays = 28;
      } else if (years >= 5) {
        vacationDays = 21;
      }
    }

    return {
      years,
      vacationDays,
      totalMonths,
      eligibleForVacations: totalMonths >= 6,
      startDate: start.toLocaleDateString("es-AR"),
    };
  }

  // Helper para mapear datos de Supabase a nuestro modelo
  private mapFromSupabase(data: any): Employee {
    return {
      id: data.id,
      name: data.name,
      dni: data.dni,
      documentType: data.document_type,
      position: data.job_position,
      whiteWage: data.white_wage,
      informalWage: data.informal_wage,
      dailyWage: data.daily_wage,
      presentismo: data.presentismo,
      losesPresentismo: data.loses_presentismo,
      status: data.status,
      startDate: data.start_date,
      vacationDays: data.vacation_days,
      vacationsTaken: data.vacations_taken,
      address: data.address || "",
      email: data.email || "",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Factory para crear la instancia - Fácil cambiar implementación
export const createEmployeeService = (): IEmployeeService => {
  return new SupabaseEmployeeService();
};

// Instancia singleton
export const employeeService = createEmployeeService();
