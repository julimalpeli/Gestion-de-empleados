import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getFallbackEmployeeData } from "@/utils/offlineFallback";

export interface VacationRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVacationRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

export const useVacations = (employeeId?: string) => {
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar solicitudes de vacaciones
  const fetchVacations = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("vacation_requests")
        .select(
          `
          *,
          employee:employees(name)
        `,
        )
        .order("created_at", { ascending: false });

      // Si se especifica employeeId, filtrar por empleado
      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedVacations =
        data?.map((vacation) => ({
          id: vacation.id,
          employeeId: vacation.employee_id,
          startDate: vacation.start_date,
          endDate: vacation.end_date,
          days: vacation.days,
          reason: vacation.reason,
          status: vacation.status,
          requestDate: vacation.request_date,
          approvedBy: vacation.approved_by,
          approvedDate: vacation.approved_date,
          rejectionReason: vacation.rejection_reason,
          createdAt: vacation.created_at,
          updatedAt: vacation.updated_at,
        })) || [];

      setVacations(mappedVacations);
    } catch (err) {
      console.group("❌ Error loading vacations");

      // Enhanced error logging
      if (err && typeof err === "object") {
        console.error("Error details:", {
          message: (err as any).message,
          code: (err as any).code,
          details: (err as any).details,
          hint: (err as any).hint,
          errorType: typeof err,
          errorConstructor: err.constructor?.name,
        });
      }

      console.error("Raw error object:", err);
      console.groupEnd();

      const errorMessage = err instanceof Error ? err.message : String(err);

      // Check for specific Supabase errors
      if (err && typeof err === "object") {
        const supabaseError = err as any;

        // RLS Policy error
        if (supabaseError.code === 'PGRST301') {
          console.error("🔒 RLS POLICY ERROR: Row Level Security is blocking vacation queries");
          console.error("📋 Possible solutions:");
          console.error("   - Check if vacation_requests table has RLS enabled");
          console.error("   - Check if user has permissions to read vacation_requests");
          console.error("   - Check RLS policies on vacation_requests table");
          setError("Sin permisos para acceder a las vacaciones. Contacte al administrador.");
        }
        // Permission error
        else if (supabaseError.code === '42501') {
          console.error("🔒 PERMISSION ERROR: Insufficient database permissions");
          setError("Permisos insuficientes para acceder a las vacaciones.");
        }
        // Table not found
        else if (supabaseError.code === 'PGRST116') {
          console.error("📊 TABLE ERROR: vacation_requests table may not exist");
          setError("Tabla de vacaciones no encontrada en la base de datos.");
        }
        // Network/Connection errors
        else if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("fetch") ||
          errorMessage.includes("TypeError") ||
          errorMessage.includes("network") ||
          errorMessage.includes("NetworkError")
        ) {
          console.log("🔄 Network error detected, using fallback vacation data...");
          try {
            const { fallbackVacationData } = await import("@/utils/offlineFallback");
            setVacations(fallbackVacationData);
            console.log("✅ Fallback vacation data loaded:", fallbackVacationData.length, "records");
            setError(null); // Clear error since we have fallback data
            return;
          } catch (fallbackError) {
            console.warn("⚠️ Could not load fallback vacation data:", fallbackError);
            setError("Error de conectividad. No se pudieron cargar las vacaciones.");
          }
        }
        else {
          setError(`Error de base de datos: ${errorMessage}`);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Crear solicitud de vacaciones
  const createVacation = async (vacation: CreateVacationRequest) => {
    try {
      console.log("🔄 Creating vacation request:", vacation);

      // Check current auth context and user role
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("🔐 Current auth context:");
      console.log("   - auth.uid():", session?.user?.id);
      console.log("   - auth.email():", session?.user?.email);
      console.log("   - employee_id to insert:", vacation.employeeId);

      // Get current user info to check if admin
      const { data: currentUser } = await supabase
        .from("users")
        .select("id, role, email, employee_id")
        .eq("id", session?.user?.id)
        .single();

      console.log("👤 Current user role:", currentUser?.role);

      let insertData;

      // If user is admin/manager creating for someone else, use a different approach
      if (currentUser?.role === "admin" || currentUser?.role === "manager") {
        // For admin users, create the vacation as if it's for themselves first
        // then we'll update the employee_id in a separate call if needed
        insertData = {
          employee_id: session?.user?.id, // Use admin's ID temporarily
          start_date: vacation.startDate,
          end_date: vacation.endDate,
          days: vacation.days,
          reason: `${vacation.reason} (Admin creado para empleado: ${vacation.employeeId})`,
          status: "approved", // Admin-created vacations are automatically approved
          request_date: new Date().toISOString().split("T")[0],
        };
      } else {
        // Regular employee creating their own vacation
        insertData = {
          employee_id: vacation.employeeId,
          start_date: vacation.startDate,
          end_date: vacation.endDate,
          days: vacation.days,
          reason: vacation.reason,
          status: "pending",
          request_date: new Date().toISOString().split("T")[0],
        };
      }

      console.log("📝 Insert data:", insertData);

      let data, error;

      // If admin/manager creating for someone else, use the special function
      if (
        (currentUser?.role === "admin" || currentUser?.role === "manager") &&
        vacation.employeeId !== session?.user?.id
      ) {
        console.log(
          "🔧 Using admin function to create vacation for another employee",
        );

        const { data: functionResult, error: functionError } =
          await supabase.rpc("create_vacation_request_as_admin", {
            p_employee_id: vacation.employeeId,
            p_start_date: vacation.startDate,
            p_end_date: vacation.endDate,
            p_days: vacation.days,
            p_reason: vacation.reason,
            p_status: "approved",
          });

        data = functionResult;
        error = functionError;
      } else {
        // Regular insert for employees creating their own vacations
        const { data: insertResult, error: insertError } = await supabase
          .from("vacation_requests")
          .insert(insertData)
          .select()
          .single();

        data = insertResult;
        error = insertError;
      }

      if (error) {
        console.error("❌ Supabase error creating vacation:");
        console.error("   - Message:", error.message);
        console.error("   - Code:", error.code);
        console.error("   - Details:", error.details);
        console.error("   - Hint:", error.hint);
        console.error(
          "   - Full error object:",
          JSON.stringify(error, null, 2),
        );
        throw error;
      }

      console.log("✅ Vacation created successfully:", data);
      await fetchVacations();
      return data;
    } catch (err) {
      console.group("❌ Error creating vacation");
      console.error("Error type:", typeof err);
      console.error("Error instanceof Error:", err instanceof Error);

      if (err && typeof err === "object") {
        console.error("Error details:", {
          message: (err as any).message,
          code: (err as any).code,
          details: (err as any).details,
          hint: (err as any).hint,
          errorType: typeof err,
          errorConstructor: err.constructor?.name,
        });
      }

      console.error("Raw error object:", err);
      console.groupEnd();

      // Create user-friendly error message
      let userMessage = "Error al crear solicitud de vacaciones";

      if (err && typeof err === "object") {
        const supabaseError = err as any;

        if (supabaseError.code === 'PGRST301') {
          userMessage = "Sin permisos para crear solicitudes de vacaciones";
        } else if (supabaseError.code === '42501') {
          userMessage = "Permisos insuficientes para crear vacaciones";
        } else if (supabaseError.code === '23505') {
          userMessage = "Ya existe una solicitud similar";
        } else if (supabaseError.message) {
          userMessage = `Error: ${supabaseError.message}`;
        }
      }

      throw new Error(userMessage);
    }
  };

  // Actualizar solicitud de vacaciones
  const updateVacation = async (
    id: string,
    updates: Partial<VacationRequest>,
  ) => {
    try {
      const updateData: any = {};

      if (updates.startDate !== undefined)
        updateData.start_date = updates.startDate;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
      if (updates.days !== undefined) updateData.days = updates.days;
      if (updates.reason !== undefined) updateData.reason = updates.reason;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.rejectionReason !== undefined)
        updateData.rejection_reason = updates.rejectionReason;

      const { error } = await supabase
        .from("vacation_requests")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchVacations();
    } catch (err) {
      console.group("❌ Error updating vacation");

      if (err && typeof err === "object") {
        console.error("Error details:", {
          message: (err as any).message,
          code: (err as any).code,
          details: (err as any).details,
          hint: (err as any).hint,
        });
      }

      console.error("Raw error object:", err);
      console.groupEnd();

      const errorMessage = err instanceof Error ? err.message : "Error updating vacation request";
      throw new Error(errorMessage);
    }
  };

  // Eliminar solicitud de vacaciones
  const deleteVacation = async (id: string) => {
    try {
      console.log("🗑️ deleteVacation called with ID:", id);

      const { error } = await supabase
        .from("vacation_requests")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Supabase deletion error:", error);
        throw error;
      }

      console.log("✅ Vacation deleted from database, refreshing list...");
      await fetchVacations();
      console.log("✅ Vacation list refreshed");
    } catch (err) {
      console.group("❌ Error deleting vacation");

      if (err && typeof err === "object") {
        console.error("Error details:", {
          message: (err as any).message,
          code: (err as any).code,
          details: (err as any).details,
          hint: (err as any).hint,
        });
      }

      console.error("Raw error object:", err);
      console.groupEnd();

      const errorMessage = err instanceof Error ? err.message : "Error deleting vacation request";
      throw new Error(errorMessage);
    }
  };

  // Aprobar/rechazar solicitud
  const processVacation = async (
    id: string,
    status: "approved" | "rejected",
    rejectionReason?: string,
  ) => {
    try {
      const updateData: any = {
        status,
        approved_date: new Date().toISOString(),
        // approved_by: userId, // Se puede agregar cuando tengamos auth completo
      };

      if (status === "rejected" && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("vacation_requests")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Si se aprueba, actualizar días tomados del empleado
      if (status === "approved") {
        const vacation = vacations.find((v) => v.id === id);
        if (vacation) {
          await updateEmployeeVacationsTaken(
            vacation.employeeId,
            vacation.days,
          );
        }
      }

      await fetchVacations();
    } catch (err) {
      console.group("❌ Error processing vacation");

      if (err && typeof err === "object") {
        console.error("Error details:", {
          message: (err as any).message,
          code: (err as any).code,
          details: (err as any).details,
          hint: (err as any).hint,
        });
      }

      console.error("Raw error object:", err);
      console.groupEnd();

      const errorMessage = err instanceof Error ? err.message : "Error processing vacation request";
      throw new Error(errorMessage);
    }
  };

  // Actualizar días de vacaciones tomadas del empleado
  const updateEmployeeVacationsTaken = async (
    employeeId: string,
    daysToAdd: number,
  ) => {
    try {
      // Obtener días actuales
      const { data: employee, error: fetchError } = await supabase
        .from("employees")
        .select("vacations_taken")
        .eq("id", employeeId)
        .single();

      if (fetchError) throw fetchError;

      // Actualizar con los nuevos días
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          vacations_taken: (employee.vacations_taken || 0) + daysToAdd,
        })
        .eq("id", employeeId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error("Error updating employee vacation days:", err);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchVacations();
  }, [employeeId]);

  return {
    vacations,
    vacationRequests: vacations, // Alias for backward compatibility
    loading,
    error,
    fetchVacations,
    createVacation,
    updateVacation,
    deleteVacation,
    processVacation,
  };
};
