import { supabase } from "@/lib/supabase";

export interface SalaryHistoryRecord {
  id: string;
  employee_id: string;
  effective_date: string;
  impact_period: string;
  white_wage: number;
  informal_wage: number;
  presentismo: number;
  previous_white_wage?: number;
  previous_informal_wage?: number;
  previous_presentismo?: number;
  change_type: "aumento" | "correccion";
  reason?: string;
  applied_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryForPeriod {
  white_wage: number;
  informal_wage: number;
  presentismo: number;
  source: "history" | "current" | "not_found";
}

export interface CreateSalaryHistoryRequest {
  employee_id: string;
  effective_date: string;
  impact_period: string;
  white_wage: number;
  informal_wage: number;
  presentismo: number;
  previous_white_wage?: number;
  previous_informal_wage?: number;
  previous_presentismo?: number;
  change_type: "aumento" | "correccion";
  reason?: string;
}

class SalaryHistoryService {
  // Obtener todo el historial de un empleado
  async getEmployeeSalaryHistory(
    employeeId: string,
  ): Promise<SalaryHistoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from("salary_history")
        .select(
          `
          *,
          applied_by_user:users!applied_by(name, email)
        `,
        )
        .eq("employee_id", employeeId)
        .order("effective_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching salary history:", error);
        throw new Error(`Error loading salary history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Service error:", error);
      throw error;
    }
  }

  // Obtener salario vigente para un período específico
  async getSalaryForPeriod(
    employeeId: string,
    period: string,
  ): Promise<SalaryForPeriod> {
    try {
      console.log(
        `🔍 Getting salary for employee ${employeeId}, period ${period}`,
      );

      // TEMPORAL: Deshabilitamos la función RPC para usar la lógica corregida del fallback
      console.log("🚫 Skipping RPC, using corrected fallback method");
      return this.getSalaryForPeriodFallback(employeeId, period);

      // TODO: Reactivar cuando la función SQL sea corregida
      /*
      // Primero intentar usar la función SQL
      const { data, error } = await supabase.rpc("get_salary_for_period", {
        emp_id: employeeId,
        target_period: period,
      });

      if (error) {
        console.warn(
          "RPC function failed, falling back to manual query:",
          error,
        );
        return this.getSalaryForPeriodFallback(employeeId, period);
      }

      if (data && data.length > 0) {
        const result = data[0];
        console.log(`✅ Salary found via RPC:`, result);
        return {
          white_wage: parseFloat(result.white_wage) || 0,
          informal_wage: parseFloat(result.informal_wage) || 0,
          presentismo: parseFloat(result.presentismo) || 0,
          source: result.source || "current",
        };
      }

      // Si no hay datos, usar fallback
      return this.getSalaryForPeriodFallback(employeeId, period);
      */
    } catch (error) {
      console.error("Error getting salary for period:", error);
      return this.getSalaryForPeriodFallback(employeeId, period);
    }
  }

  // Método fallback para obtener salario del período
  private async getSalaryForPeriodFallback(
    employeeId: string,
    period: string,
  ): Promise<SalaryForPeriod> {
    try {
      console.log(
        `🔄 Using fallback method for employee ${employeeId}, period ${period}`,
      );

      // Convertir período a fecha para comparación
      const targetDate = new Date(`${period}-01`);

      console.log(
        `🎯 Target date for period ${period}: ${targetDate.toISOString().split("T")[0]}`,
      );

      // 1. Buscar cambios que sean efectivos en o antes del período objetivo
      const { data: historyData, error: historyError } = await supabase
        .from("salary_history")
        .select(
          "white_wage, informal_wage, presentismo, effective_date, previous_white_wage, previous_informal_wage, previous_presentismo",
        )
        .eq("employee_id", employeeId)
        .lte("effective_date", targetDate.toISOString().split("T")[0])
        .order("effective_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (!historyError && historyData && historyData.length > 0) {
        const record = historyData[0];
        const recordDate = new Date(record.effective_date);

        console.log(
          `✅ Found historical salary (on or before target):`,
          record,
        );
        console.log(
          `📅 Comparing dates - Target: ${targetDate.toISOString().split("T")[0]}, Record: ${record.effective_date}`,
        );

        // Si el registro es exactamente del período objetivo o posterior, usar valores nuevos
        if (recordDate.getTime() <= targetDate.getTime()) {
          console.log(
            `🎯 Using NEW values for period ${period} (change was effective on/before this period)`,
          );
          return {
            white_wage: record.white_wage,
            informal_wage: record.informal_wage,
            presentismo: record.presentismo,
            source: "history_new",
          };
        }
      }

      console.log(
        `🔍 No changes found on or before ${period}, checking for later changes...`,
      );

      // 2. Si no hay cambios en o antes del período, buscar el primer cambio DESPUÉS
      // y usar los valores "previous_*" (que son los valores que estaban vigentes antes del cambio)
      const { data: futureChanges, error: futureError } = await supabase
        .from("salary_history")
        .select(
          "white_wage, informal_wage, presentismo, effective_date, previous_white_wage, previous_informal_wage, previous_presentismo",
        )
        .eq("employee_id", employeeId)
        .gt("effective_date", targetDate.toISOString().split("T")[0])
        .order("effective_date", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1);

      if (!futureError && futureChanges && futureChanges.length > 0) {
        const futureRecord = futureChanges[0];
        console.log(
          `📅 Found future change, using previous values:`,
          futureRecord,
        );

        // Si el cambio futuro tiene valores "previous_*", usarlos
        if (
          futureRecord.previous_presentismo !== null &&
          futureRecord.previous_presentismo !== undefined
        ) {
          return {
            white_wage: futureRecord.previous_white_wage || 0,
            informal_wage: futureRecord.previous_informal_wage || 0,
            presentismo: futureRecord.previous_presentismo || 0,
            source: "history_previous",
          };
        }
      }

      console.log(`🔄 No historical data found, using current employee values`);

      // 3. Si no hay historial, usar valores actuales del empleado
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("white_wage, informal_wage, presentismo")
        .eq("id", employeeId)
        .single();

      if (employeeError) {
        console.error("Error fetching employee data:", employeeError);
        throw new Error(`Employee not found: ${employeeError.message}`);
      }

      console.log(`✅ Using current employee salary:`, employeeData);
      return {
        white_wage: employeeData.white_wage,
        informal_wage: employeeData.informal_wage,
        presentismo: employeeData.presentismo,
        source: "current",
      };
    } catch (error) {
      console.error("Fallback method failed:", error);
      return {
        white_wage: 0,
        informal_wage: 0,
        presentismo: 0,
        source: "not_found",
      };
    }
  }

  // Crear nuevo registro de historial
  async createSalaryHistory(
    request: CreateSalaryHistoryRequest,
  ): Promise<SalaryHistoryRecord> {
    try {
      console.log("📝 Creating salary history record:", request);

      const { data, error } = await supabase
        .from("salary_history")
        .insert({
          employee_id: request.employee_id,
          effective_date: request.effective_date,
          impact_period: request.impact_period,
          white_wage: request.white_wage,
          informal_wage: request.informal_wage,
          presentismo: request.presentismo,
          previous_white_wage: request.previous_white_wage,
          previous_informal_wage: request.previous_informal_wage,
          previous_presentismo: request.previous_presentismo,
          change_type: request.change_type,
          reason: request.reason,
          applied_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating salary history:", error);
        throw new Error(`Failed to create salary history: ${error.message}`);
      }

      console.log("✅ Salary history created:", data);
      return data;
    } catch (error) {
      console.error("Service error creating history:", error);
      throw error;
    }
  }

  // Actualizar empleado con nuevos valores y crear historial
  async updateEmployeeSalaryWithHistory(
    employeeId: string,
    newSalary: {
      white_wage: number;
      informal_wage: number;
      presentismo: number;
    },
    changeInfo: {
      change_type: "aumento" | "correccion";
      effective_date: string;
      impact_period: string;
      reason?: string;
    },
  ): Promise<{ employee: any; history: SalaryHistoryRecord }> {
    try {
      console.log("🔄 Updating employee salary with history tracking");

      // 1. Obtener valores actuales del empleado
      const { data: currentEmployee, error: fetchError } = await supabase
        .from("employees")
        .select("white_wage, informal_wage, presentismo")
        .eq("id", employeeId)
        .single();

      if (fetchError) {
        throw new Error(
          `Failed to fetch current employee data: ${fetchError.message}`,
        );
      }

      // 2. Solo crear historial si es un aumento (las correcciones no van al historial)
      let historyRecord = null;
      if (changeInfo.change_type === "aumento") {
        historyRecord = await this.createSalaryHistory({
          employee_id: employeeId,
          effective_date: changeInfo.effective_date,
          impact_period: changeInfo.impact_period,
          white_wage: newSalary.white_wage,
          informal_wage: newSalary.informal_wage,
          presentismo: newSalary.presentismo,
          previous_white_wage: currentEmployee.white_wage,
          previous_informal_wage: currentEmployee.informal_wage,
          previous_presentismo: currentEmployee.presentismo,
          change_type: changeInfo.change_type,
          reason: changeInfo.reason,
        });
      }

      // 3. Actualizar empleado con nuevos valores
      const { data: updatedEmployee, error: updateError } = await supabase
        .from("employees")
        .update({
          white_wage: newSalary.white_wage,
          informal_wage: newSalary.informal_wage,
          presentismo: newSalary.presentismo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", employeeId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update employee: ${updateError.message}`);
      }

      console.log("✅ Employee salary updated successfully");
      return {
        employee: updatedEmployee,
        history: historyRecord,
      };
    } catch (error) {
      console.error("Error updating employee salary with history:", error);
      throw error;
    }
  }

  // Obtener estadísticas del historial
  async getSalaryHistoryStats(employeeId: string): Promise<{
    totalChanges: number;
    totalIncreases: number;
    totalCorrections: number;
    lastChange?: SalaryHistoryRecord;
  }> {
    try {
      const history = await this.getEmployeeSalaryHistory(employeeId);

      return {
        totalChanges: history.length,
        totalIncreases: history.filter((h) => h.change_type === "aumento")
          .length,
        totalCorrections: history.filter((h) => h.change_type === "correccion")
          .length,
        lastChange: history.length > 0 ? history[0] : undefined,
      };
    } catch (error) {
      console.error("Error getting salary history stats:", error);
      throw error;
    }
  }
}

export const salaryHistoryService = new SalaryHistoryService();
