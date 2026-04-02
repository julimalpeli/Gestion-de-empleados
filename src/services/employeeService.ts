import {
  supabase,
  logSupabaseError,
  withRetry,
  getConnectionHealth,
} from "@/lib/supabase";
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
    try {
      let activeSession: any = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        activeSession = session;
      } catch (sessionError) {
        // Session check failed
      }

      if (!activeSession?.user) {
        return [];
      }

      const health = getConnectionHealth();

      if (health.state === "disconnected" && health.retries >= 3) {
        return this.getFallbackEmployees();
      }

      const result = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from("employees")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) {
            if (error instanceof Error) {
              throw error;
            }

            throw new Error(
              `Supabase error: ${error.message} (Code: ${error.code || "UNKNOWN"})`,
            );
          }

          return data ?? [];
        },
        "getAllEmployees",
        2,
      );

      if (!result || result.length === 0) {
        return this.getFallbackEmployees();
      }
      return result.map((record) => this.mapFromSupabase(record));
    } catch (error) {
      logSupabaseError("getAllEmployees - Final error", error);
      return this.getFallbackEmployees();
    }
  }

  private async getFallbackEmployees(): Promise<Employee[]> {
    try {
      const { getFallbackEmployeesData } = await import(
        "@/utils/offlineFallback"
      );
      const fallbackData = getFallbackEmployeesData();
      return fallbackData.map((employee) =>
        this.mapFromSupabase({
          ...employee,
          job_position: employee.job_position ?? employee.position ?? "",
          document_type:
            employee.document_type ?? employee.documentType ?? "dni",
          sueldo_base:
            employee.sueldoBase ??
            (employee.whiteWage ?? 0) + (employee.informalWage ?? 0),
          white_wage: employee.whiteWage ?? employee.sueldoBase ?? 0,
          informal_wage: employee.informalWage ?? 0,
          daily_wage:
            employee.daily_wage ??
            employee.dailyWage ??
            Math.round(
              ((employee.whiteWage ?? 0) + (employee.informalWage ?? 0)) / 30,
            ),
          presentismo: employee.presentismo ?? employee.presentismoAmount ?? 0,
          loses_presentismo:
            employee.loses_presentismo ??
            employee.losesPresentismo ??
            employee.losesPresent ??
            false,
          status: employee.status ?? "active",
          start_date: employee.start_date ?? employee.startDate ?? "",
          vacation_days: employee.vacation_days ?? employee.vacationDays ?? 0,
          vacations_taken:
            employee.vacations_taken ?? employee.vacationsTaken ?? 0,
          address: employee.address ?? "",
          email: employee.email ?? "",
          created_at:
            employee.created_at ??
            employee.createdAt ??
            new Date().toISOString(),
          updated_at:
            employee.updated_at ??
            employee.updatedAt ??
            new Date().toISOString(),
        }),
      );
    } catch (fallbackError) {
      // Return minimal fallback as last resort
      return [
        {
          id: "fallback-employee-1",
          name: "Empleado de Ejemplo",
          dni: "00000000",
          documentType: "dni",
          position: "Empleado",
          sueldoBase: 500000,
          dailyWage: 16667,
          presentismo: 0,
          losesPresentismo: false,
          status: "active",
          startDate: "2024-01-01",
          vacationDays: 14,
          vacationsTaken: 0,
          address: "",
          email: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      return this.mapFromSupabase(data[0]);
    } catch (error) {
      throw new Error("Failed to fetch employee");
    }
  }

  async createEmployee(employee: CreateEmployeeRequest): Promise<Employee> {
    try {
      const sueldoBase = this.toNumber(employee.sueldoBase);
      const dailyWage = sueldoBase / 30;
      const vacationInfo = this.calculateVacationDays(employee.startDate);

      const newEmployee: any = {
        name: employee.name,
        dni: employee.dni,
        document_type: employee.documentType || "dni",
        job_position: employee.position,
        sueldo_base: sueldoBase,
        white_wage: sueldoBase,
        informal_wage: 0,
        daily_wage: Math.round(dailyWage),
        presentismo: employee.presentismo,
        // NOTE: receives_presentismo will be added if the column exists in DB
        loses_presentismo: false,
        status: "active" as const,
        start_date: employee.startDate,
        vacation_days: vacationInfo.vacationDays,
        vacations_taken: 0,
        address: employee.address || "",
        email: employee.email || "",
      };

      // Add receives_presentismo if provided (will be ignored if column doesn't exist in DB)
      if (employee.receives_presentismo !== undefined) {
        newEmployee.receives_presentismo = employee.receives_presentismo;
      }

      let { data, error } = await supabase
        .from("employees")
        .insert(newEmployee)
        .select()
        .single();

      // If column doesn't exist, retry without it
      if (
        error &&
        error.message?.includes("receives_presentismo") &&
        error.message?.includes("column")
      ) {
        // Column doesn't exist yet, retry without it
        delete newEmployee.receives_presentismo;
        const retryResult = await supabase
          .from("employees")
          .insert(newEmployee)
          .select()
          .single();

        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) throw error;

      const mappedEmployee = this.mapFromSupabase(data);

      // Auditar creación de empleado
      try {
        await auditService.auditEmployee(
          "INSERT",
          data.id,
          null, // No hay valores anteriores
          {
            name: mappedEmployee.name,
            dni: mappedEmployee.dni,
            position: mappedEmployee.position,
            sueldoBase: mappedEmployee.sueldoBase,
            presentismo: mappedEmployee.presentismo,
            status: mappedEmployee.status,
            startDate: mappedEmployee.startDate,
          },
        );
      } catch (auditError) {
        // Audit errors should not block the operation
      }

      return mappedEmployee;
    } catch (error) {
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
      if (employee.sueldoBase !== undefined) {
        const sueldoBase = this.toNumber(employee.sueldoBase);
        updateData.sueldo_base = sueldoBase;
        updateData.white_wage = sueldoBase;
        updateData.informal_wage = 0;
        updateData.daily_wage = Math.round(sueldoBase / 30);
      }
      if (employee.presentismo !== undefined)
        updateData.presentismo = employee.presentismo;
      // NOTE: receives_presentismo will be added only if the column exists in the DB
      // This is handled gracefully below
      if (employee.losesPresentismo !== undefined)
        updateData.loses_presentismo = employee.losesPresentismo;
      if (employee.status) updateData.status = employee.status;
      if (employee.startDate) updateData.start_date = employee.startDate;
      if (employee.address !== undefined) updateData.address = employee.address;
      if (employee.email !== undefined) updateData.email = employee.email;

      // Recalcular automáticamente vacaciones si cambió la fecha de inicio
      if (employee.startDate) {
        const vacationInfo = this.calculateVacationDays(employee.startDate);
        updateData.vacation_days = vacationInfo.vacationDays;
        updateData.start_date = employee.startDate;
      }

      updateData.updated_at = new Date().toISOString();

      // First try to update with receives_presentismo if provided
      let updatePayload = { ...updateData };
      if (employee.receives_presentismo !== undefined) {
        updatePayload.receives_presentismo = employee.receives_presentismo;
      }

      let { data, error } = await supabase
        .from("employees")
        .update(updatePayload)
        .eq("id", id)
        .select();

      // If we get a "column not found" error for receives_presentismo, try without it
      if (
        error &&
        error.message?.includes("receives_presentismo") &&
        error.message?.includes("column")
      ) {
        // Column doesn't exist yet, retry without it
        const fallbackPayload = { ...updateData };
        delete fallbackPayload.receives_presentismo;

        const retryResult = await supabase
          .from("employees")
          .update(fallbackPayload)
          .eq("id", id)
          .select();

        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          `Employee with ID ${id} not found or could not be updated`,
        );
      }

      const updatedEmployee = this.mapFromSupabase(data[0]);

      // Auditar actualización de empleado
      try {
        const oldValues = await this.getEmployeeById(id);
        await auditService.auditEmployee(
          "UPDATE",
          id,
          oldValues
            ? {
                name: oldValues.name,
                dni: oldValues.dni,
                position: oldValues.position,
                sueldoBase: oldValues.sueldoBase,
                presentismo: oldValues.presentismo,
                status: oldValues.status,
              }
            : null,
          {
            name: updatedEmployee.name,
            dni: updatedEmployee.dni,
            position: updatedEmployee.position,
            sueldoBase: updatedEmployee.sueldoBase,
            presentismo: updatedEmployee.presentismo,
            status: updatedEmployee.status,
          },
        );
      } catch (auditError) {
        // Audit errors should not block the operation
      }

      return updatedEmployee;
    } catch (error) {
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

      return data.map((employee) => this.mapFromSupabase(employee));
    } catch (error) {
      throw new Error("Failed to search employees");
    }
  }

  calculateVacationDays(startDate: string): VacationCalculation {
    const start = new Date(startDate + "T00:00:00");
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
      // Sistema acumulativo: 14 días por año trabajado
      // Se consideran años completos trabajados
      vacationDays = Math.max(years, 0) * 14;

      // Si tiene al menos 6 meses pero menos de 1 año, otorgar días proporcionales
      if (years === 0 && totalMonths >= 6) {
        vacationDays = 14; // Primer año completo de 14 días después de 6 meses
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

  private toNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private resolveSueldoBase(data: any): number {
    const direct = data?.sueldo_base ?? data?.sueldoBase;
    const directValue =
      direct !== undefined && direct !== null ? this.toNumber(direct) : null;
    if (directValue !== null) {
      return directValue;
    }
    const white = this.toNumber(data?.white_wage ?? data?.whiteWage);
    const informal = this.toNumber(data?.informal_wage ?? data?.informalWage);
    return white + informal;
  }

  // Helper para mapear datos de Supabase a nuestro modelo
  private mapFromSupabase(data: any): Employee {
    const sueldoBase = this.resolveSueldoBase(data);

    return {
      id: data.id,
      name: data.name,
      dni: data.dni,
      documentType: data.document_type,
      position: data.job_position,
      sueldoBase,
      dailyWage: this.toNumber(data.daily_wage),
      presentismo: this.toNumber(data.presentismo),
      receives_presentismo: data.receives_presentismo ?? true, // NEW: Default true for backward compatibility
      losesPresentismo: Boolean(data.loses_presentismo),
      status: data.status,
      startDate: data.start_date,
      vacationDays: this.toNumber(data.vacation_days),
      vacationsTaken: this.toNumber(data.vacations_taken),
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
