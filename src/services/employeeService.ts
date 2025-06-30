import { supabase } from "@/lib/supabase";
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
    try {
      console.log("🔄 Consultando empleados en Supabase...");
      console.log("🔗 URL Supabase:", import.meta.env.VITE_SUPABASE_URL);
      console.log(
        "🔑 Key configurada:",
        !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      );

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📊 Respuesta de Supabase:", {
        data,
        error,
        dataLength: data?.length,
      });

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

      const mappedData = data.map(this.mapFromSupabase);
      console.log("✅ Datos mapeados:", mappedData);
      return mappedData;
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      if (error instanceof Error) {
        throw error; // Re-throw the original error with details
      }
      throw new Error("Failed to fetch employees: Unknown error");
    }
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return this.mapFromSupabase(data);
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
          `🔄 Recalculando vacaciones para nueva fecha: ${employee.startDate} → ${vacationInfo.vacationDays} días`,
        );
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromSupabase(data);
    } catch (error) {
      console.error("Error updating employee:", error);
      throw new Error("Failed to update employee");
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
