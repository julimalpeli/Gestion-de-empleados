import { useState, useEffect } from "react";
import {
  salaryHistoryService,
  SalaryHistoryRecord,
  SalaryForPeriod,
  CreateSalaryHistoryRequest,
} from "@/services/salaryHistoryService";

export const useSalaryHistory = (employeeId?: string) => {
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar historial de un empleado
  const loadSalaryHistory = async (empId?: string) => {
    const targetEmployeeId = empId || employeeId;
    if (!targetEmployeeId) return;

    try {
      setLoading(true);
      setError(null);
      console.log(
        `🔄 Loading salary history for employee: ${targetEmployeeId}`,
      );

      const history =
        await salaryHistoryService.getEmployeeSalaryHistory(targetEmployeeId);
      setSalaryHistory(history);
      console.log(`✅ Loaded ${history.length} salary history records`);
    } catch (err) {
      console.error("❌ Error loading salary history:", err);
      setError(err instanceof Error ? err.message : "Error loading history");
      setSalaryHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener salario para un período específico
  const getSalaryForPeriod = async (
    empId: string,
    period: string,
  ): Promise<SalaryForPeriod | null> => {
    try {
      console.log(`🔍 Getting salary for period: ${empId} - ${period}`);
      const salary = await salaryHistoryService.getSalaryForPeriod(
        empId,
        period,
      );
      console.log(`✅ Salary for period found:`, salary);
      return salary;
    } catch (err) {
      console.error("❌ Error getting salary for period:", err);
      return null;
    }
  };

  // Actualizar salario con historial
  const updateEmployeeSalaryWithHistory = async (
    empId: string,
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
  ) => {
    try {
      setLoading(true);
      setError(null);
      console.log("💰 Updating employee salary with history tracking");

      const result = await salaryHistoryService.updateEmployeeSalaryWithHistory(
        empId,
        newSalary,
        changeInfo,
      );

      // Recargar historial si estamos viendo el mismo empleado
      if (empId === employeeId) {
        await loadSalaryHistory(empId);
      }

      console.log("✅ Employee salary updated successfully");
      return result;
    } catch (err) {
      console.error("❌ Error updating salary with history:", err);
      setError(err instanceof Error ? err.message : "Error updating salary");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Crear registro de historial manualmente
  const createSalaryHistory = async (request: CreateSalaryHistoryRequest) => {
    try {
      setLoading(true);
      setError(null);
      console.log("📝 Creating salary history record");

      const newRecord = await salaryHistoryService.createSalaryHistory(request);

      // Recargar historial si estamos viendo el mismo empleado
      if (request.employee_id === employeeId) {
        await loadSalaryHistory(request.employee_id);
      }

      console.log("✅ Salary history record created");
      return newRecord;
    } catch (err) {
      console.error("❌ Error creating salary history:", err);
      setError(
        err instanceof Error ? err.message : "Error creating history record",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas
  const getSalaryHistoryStats = async (empId?: string) => {
    const targetEmployeeId = empId || employeeId;
    if (!targetEmployeeId) return null;

    try {
      return await salaryHistoryService.getSalaryHistoryStats(targetEmployeeId);
    } catch (err) {
      console.error("❌ Error getting salary history stats:", err);
      return null;
    }
  };

  // Auto-cargar historial cuando cambia el employeeId
  useEffect(() => {
    if (employeeId) {
      loadSalaryHistory();
    }
  }, [employeeId]);

  return {
    salaryHistory,
    loading,
    error,
    loadSalaryHistory,
    getSalaryForPeriod,
    updateEmployeeSalaryWithHistory,
    createSalaryHistory,
    getSalaryHistoryStats,
    // Helpers
    refresh: () => loadSalaryHistory(),
    clearError: () => setError(null),
  };
};

// Hook más específico para obtener salario por período (sin state interno)
export const useSalaryForPeriod = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSalaryForPeriod = async (
    employeeId: string,
    period: string,
  ): Promise<SalaryForPeriod | null> => {
    try {
      setLoading(true);
      setError(null);
      return await salaryHistoryService.getSalaryForPeriod(employeeId, period);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading salary");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getSalaryForPeriod,
    loading,
    error,
    clearError: () => setError(null),
  };
};

export default useSalaryHistory;
