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
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📊 Respuesta de Supabase:", { data, error });

      if (error) {
        console.error("❌ Error de Supabase:", error);
        throw error;
      }

      const mappedData = data.map(this.mapFromSupabase);
      console.log("✅ Datos mapeados:", mappedData);
      return mappedData;
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      throw new Error("Failed to fetch employees");
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

      // Recalcular vacaciones si cambió la fecha de inicio
      if (employee.startDate) {
        const vacationInfo = this.calculateVacationDays(employee.startDate);
        updateData.vacation_days = vacationInfo.vacationDays;
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

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw new Error("Failed to delete employee");
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

  async getAllEmployees(): Promise<Employee[]> {
    try {
      console.log("🔄 Consultando empleados en Supabase...");
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      console.log("📊 Respuesta de Supabase:", { data, error });

      if (error) {
        console.error("❌ Error de Supabase:", error);
        throw error;
      }

      const mappedData = data.map(this.mapFromSupabase);
      console.log("✅ Datos mapeados:", mappedData);
      return mappedData;
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      throw new Error("Failed to fetch employees");
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

    // Calcular años de antigüedad
    const yearsDiff = today.getFullYear() - start.getFullYear();
    const monthsDiff = today.getMonth() - start.getMonth();
    const daysDiff = today.getDate() - start.getDate();

    let years = yearsDiff;
    if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
      years--;
    }

    // Determinar días de vacaciones según antigüedad
    let vacationDays = 14; // Por defecto hasta 5 años
    if (years >= 20) {
      vacationDays = 35;
    } else if (years >= 10) {
      vacationDays = 28;
    } else if (years >= 5) {
      vacationDays = 21;
    }

    return {
      years,
      vacationDays,
      startDate: start.toLocaleDateString("es-AR"),
    };
  }

  // Helper para mapear datos de Supabase a nuestro modelo
  private mapFromSupabase(data: any): Employee {
    return {
      id: data.id,
      name: data.name,
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
