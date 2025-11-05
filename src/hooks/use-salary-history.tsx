import { useState, useEffect } from "react";
import {
  salaryHistoryService,
  SalaryHistoryRecord,
  SalaryForPeriod,
  CreateSalaryHistoryRequest,
} from "@/services/salaryHistoryService";

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const toNumber = (value: unknown): number => {
  const parsed = toOptionalNumber(value);
  return parsed ?? 0;
};

const normalizeSalaryHistoryRecord = (
  record: SalaryHistoryRecord,
): SalaryHistoryRecord => {
  const raw = record as Record<string, unknown>;

  const white = toNumber(raw.white_wage);
  const informal = toNumber(raw.informal_wage);
  const base = toOptionalNumber(raw.base_wage) ?? white + informal;
  const previousWhite = toOptionalNumber(raw.previous_white_wage);
  const previousInformal = toOptionalNumber(raw.previous_informal_wage);
  const previousBase =
    toOptionalNumber(raw.previous_base_wage) ??
    (previousWhite !== undefined || previousInformal !== undefined
      ? (previousWhite ?? 0) + (previousInformal ?? 0)
      : undefined);
  const presentismo = toNumber(raw.presentismo);
  const previousPresentismo = toOptionalNumber(raw.previous_presentismo);

  return {
    ...record,
    white_wage: white,
    informal_wage: informal,
    base_wage: base,
    presentismo,
    previous_white_wage: previousWhite,
    previous_informal_wage: previousInformal,
    previous_base_wage: previousBase,
    previous_presentismo: previousPresentismo,
  };
};

const normalizeSalaryForPeriod = (
  salary: SalaryForPeriod | null,
): SalaryForPeriod | null => {
  if (!salary) {
    return null;
  }

  const raw = salary as Record<string, unknown>;
  const white = toNumber(raw.white_wage);
  const informal = toNumber(raw.informal_wage);
  const base = toOptionalNumber(raw.base_wage) ?? white + informal;
  const presentismo = toNumber(raw.presentismo);

  return {
    ...salary,
    white_wage: white,
    informal_wage: informal,
    base_wage: base,
    presentismo,
  };
};

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
      const normalizedHistory = history.map(normalizeSalaryHistoryRecord);
      setSalaryHistory(normalizedHistory);
      console.log(`✅ Loaded ${normalizedHistory.length} salary history records`);
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
      const normalizedSalary = normalizeSalaryForPeriod(salary);
      console.log(`✅ Salary for period found:`, normalizedSalary);
      return normalizedSalary;
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
      return {
        ...result,
        history: result.history
          ? normalizeSalaryHistoryRecord(result.history)
          : result.history,
      };
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
      const normalizedRecord = normalizeSalaryHistoryRecord(newRecord);

      // Recargar historial si estamos viendo el mismo empleado
      if (request.employee_id === employeeId) {
        await loadSalaryHistory(request.employee_id);
      }

      console.log("✅ Salary history record created");
      return normalizedRecord;
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
      const salary = await salaryHistoryService.getSalaryForPeriod(
        employeeId,
        period,
      );
      return normalizeSalaryForPeriod(salary);
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
