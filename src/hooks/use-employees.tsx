import { useState, useEffect, useCallback } from "react";
import { employeeService } from "@/services/employeeService";
import { useAudit } from "@/hooks/use-audit";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/services/interfaces";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth-simple";

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const normalizeEmployeeRecord = (employee: Employee): Employee => {
  const anyEmp = employee as any;
  const directBase = toNumber(anyEmp.sueldo_base);
  const fromSnake =
    toNumber(anyEmp.white_wage) + toNumber(anyEmp.informal_wage);
  const fromCamel = toNumber(anyEmp.whiteWage) + toNumber(anyEmp.informalWage);

  const primaryBase = toNumber(employee.sueldoBase);
  const sueldoBase =
    primaryBase > 0
      ? primaryBase
      : directBase > 0
        ? directBase
        : fromSnake > 0
          ? fromSnake
          : fromCamel > 0
            ? fromCamel
            : 0;

  const dailyWageValue = toNumber(employee.dailyWage);
  const dailyWage =
    dailyWageValue > 0 ? dailyWageValue : Math.round(sueldoBase / 30);

  return {
    ...employee,
    sueldoBase,
    dailyWage,
  };
};

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateUser, users } = useUsers();
  const { auditEmployee } = useAudit();
  const { session, user, isAuthenticated } = useAuth();
  const canLoadEmployees = isAuthenticated || !!session || !!user;

  // Cargar empleados
  const fetchEmployees = useCallback(async () => {
    if (!canLoadEmployees) {
      console.log(
        "⏸️ Omitiendo carga de empleados: no hay sesión ni usuario autenticado",
      );
      return;
    }

    try {
      console.log("🔄 Iniciando carga de empleados...");
      setLoading(true);
      setError(null);

      const data = await employeeService.getAllEmployees();
      console.log("✅ Empleados cargados exitosamente:", data.length);
      setEmployees(data.map(normalizeEmployeeRecord));
    } catch (err) {
      console.error("❌ Error cargando empleados:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // The service already handles fallback, so this should rarely happen
      // But if it does, show a user-friendly error
      setError("Error cargando empleados. Reintentando...");

      // Try one more time after a short delay
      setTimeout(() => {
        fetchEmployees();
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [canLoadEmployees]);

  // Crear empleado
  const createEmployee = async (employee: CreateEmployeeRequest) => {
    try {
      setError(null);
      const createdEmployee = await employeeService.createEmployee(employee);
      const newEmployee = normalizeEmployeeRecord(createdEmployee);
      setEmployees((prev) => [newEmployee, ...prev]);
      return newEmployee;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error creating employee";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Función auxiliar para sincronizar datos del usuario cuando se actualiza un empleado
  const syncUserDataWithEmployee = async (
    employeeId: string,
    employeeData: Partial<Employee>,
  ) => {
    try {
      const associatedUser = users.find(
        (user) => user.employeeId === employeeId,
      );

      if (associatedUser) {
        const updates: any = {};

        // Sincronizar nombre si cambió
        if (employeeData.name && employeeData.name !== associatedUser.name) {
          updates.name = employeeData.name;
        }

        // Sincronizar email si cambió (ya existía esta lógica)
        if (employeeData.email && employeeData.email !== associatedUser.email) {
          updates.email = employeeData.email;
        }

        // Desactivar usuario si empleado se desactiva
        if (employeeData.status === "inactive" && associatedUser.isActive) {
          updates.isActive = false;
        }

        // Aplicar actualizaciones si hay cambios
        if (Object.keys(updates).length > 0) {
          await updateUser(associatedUser.id, updates);
          console.log(
            `Usuario ${associatedUser.username} sincronizado:`,
            updates,
          );
        }
      }
    } catch (error) {
      console.error("Error syncing user data:", error);
      // No throw error here, just log it to avoid breaking the employee update
    }
  };

  // Actualizar empleado
  const updateEmployee = async (
    id: string,
    employee: UpdateEmployeeRequest,
  ) => {
    try {
      setError(null);
      const updatedEmployeeRaw = await employeeService.updateEmployee(
        id,
        employee,
      );
      const updatedEmployee = normalizeEmployeeRecord(updatedEmployeeRaw);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? updatedEmployee : emp)),
      );

      // Sync user data with employee changes
      await syncUserDataWithEmployee(id, employee);

      return updatedEmployee;
    } catch (err) {
      console.error("Employee update error:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : `Error updating employee: ${JSON.stringify(err)}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Eliminar empleado
  const deleteEmployee = async (id: string) => {
    try {
      setError(null);
      await employeeService.deleteEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err) {
      console.error("Delete employee error:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Error eliminando empleado";
      setError(errorMsg);
      throw err; // Re-throw the original error to preserve the message
    }
  };

  // Cambiar estado
  const toggleEmployeeStatus = async (id: string) => {
    try {
      setError(null);
      const toggledEmployeeRaw = await employeeService.toggleEmployeeStatus(id);
      const updatedEmployee = normalizeEmployeeRecord(toggledEmployeeRaw);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? updatedEmployee : emp)),
      );
      return updatedEmployee;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error toggling employee status";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Buscar empleados
  const searchEmployees = async (query: string) => {
    try {
      setError(null);
      if (!query.trim()) {
        await fetchEmployees();
        return;
      }
      const results = await employeeService.searchEmployees(query);
      setEmployees(results.map(normalizeEmployeeRecord));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error searching employees";
      setError(errorMsg);
    }
  };

  // Obtener empleados activos
  const getActiveEmployees = async () => {
    try {
      setError(null);
      const activeEmployees = await employeeService.getActiveEmployees();
      return activeEmployees.map(normalizeEmployeeRecord);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error fetching active employees";
      setError(errorMsg);
      return [];
    }
  };

  // Calcular días de vacaciones
  const calculateVacationDays = (startDate: string) => {
    return employeeService.calculateVacationDays(startDate);
  };

  // Cargar datos cuando haya sesión autenticada
  useEffect(() => {
    if (!canLoadEmployees) {
      console.log("🔒 Sin sesión ni usuario, esperando para cargar empleados");
      setEmployees([]);
      setLoading(false);
      return;
    }

    fetchEmployees();
  }, [canLoadEmployees, fetchEmployees]);

  return {
    // Estado
    employees,
    loading,
    error,

    // Acciones
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    searchEmployees,
    getActiveEmployees,
    calculateVacationDays,

    // Computed
    activeEmployees: employees.filter((emp) => emp.status === "active"),
    inactiveEmployees: employees.filter((emp) => emp.status === "inactive"),
    totalEmployees: employees.length,
  };
};

// Hook específico para un empleado
export const useEmployee = (id: string) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getEmployeeById(id);
      setEmployee(data ? normalizeEmployeeRecord(data) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading employee");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  return {
    employee,
    loading,
    error,
    fetchEmployee,
  };
};
