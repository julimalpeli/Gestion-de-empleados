import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
      setError(err instanceof Error ? err.message : "Error loading vacations");
    } finally {
      setLoading(false);
    }
  };

  // Crear solicitud de vacaciones
  const createVacation = async (vacation: CreateVacationRequest) => {
    try {
      const { data, error } = await supabase
        .from("vacation_requests")
        .insert({
          employee_id: vacation.employeeId,
          start_date: vacation.startDate,
          end_date: vacation.endDate,
          days: vacation.days,
          reason: vacation.reason,
          status: "pending",
          request_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;

      await fetchVacations();
      return data;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error creating vacation request",
      );
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
      throw new Error(
        err instanceof Error ? err.message : "Error updating vacation request",
      );
    }
  };

  // Eliminar solicitud de vacaciones
  const deleteVacation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vacation_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchVacations();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error deleting vacation request",
      );
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
      throw new Error(
        err instanceof Error
          ? err.message
          : "Error processing vacation request",
      );
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
    loading,
    error,
    fetchVacations,
    createVacation,
    updateVacation,
    deleteVacation,
    processVacation,
  };
};
