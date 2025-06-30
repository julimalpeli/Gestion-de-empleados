import { useState, useEffect } from "react";
import { employeeService } from "@/services/employeeService";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/services/interfaces";
import { useUsers } from "@/hooks/use-users";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateUser, users } = useUsers();

  // Cargar empleados
  const fetchEmployees = async () => {
    try {
      console.log("🔄 Iniciando carga de empleados...");
      setLoading(true);
      setError(null);
      const data = await employeeService.getAllEmployees();
      console.log("✅ Empleados cargados desde Supabase:", data);
      setEmployees(data);
    } catch (err) {
      console.error("❌ Error cargando empleados:", err);
      setError(err instanceof Error ? err.message : "Error loading employees");
    } finally {
      setLoading(false);
    }
  };

  // Crear empleado
  const createEmployee = async (employee: CreateEmployeeRequest) => {
    try {
      setError(null);
      const newEmployee = await employeeService.createEmployee(employee);
      setEmployees((prev) => [newEmployee, ...prev]);
      return newEmployee;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error creating employee";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Actualizar empleado
  const updateEmployee = async (
    id: string,
    employee: UpdateEmployeeRequest,
  ) => {
    try {
      setError(null);
      const updatedEmployee = await employeeService.updateEmployee(
        id,
        employee,
      );
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? updatedEmployee : emp)),
      );
      return updatedEmployee;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error updating employee";
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
      const updatedEmployee = await employeeService.toggleEmployeeStatus(id);
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
      setEmployees(results);
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
      return activeEmployees;
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

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchEmployees();
  }, []);

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
      setEmployee(data);
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
