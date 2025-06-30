import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type {
  PayrollRecord,
  CreatePayrollRequest,
} from "@/services/interfaces";

export const usePayroll = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar registros de liquidaciones
  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("payroll_records")
        .select(
          `
          *,
          employee:employees(name, job_position)
        `,
        )
        .order("period", { ascending: false });

      if (error) throw error;

      const mappedRecords =
        data?.map((record) => ({
          id: record.id,
          employeeId: record.employee_id,
          employeeName: record.employee?.name || "Empleado no encontrado",
          period: record.period,
          baseDays: record.base_days,
          holidayDays: record.holiday_days || 0,
          baseAmount: record.base_amount,
          holidayBonus: record.holiday_bonus || 0,
          aguinaldo: record.aguinaldo || 0,
          discounts: record.discounts || 0,
          advances: record.advances || 0,
          whiteAmount: record.white_amount,
          informalAmount: record.informal_amount,
          presentismoAmount: record.presentismo_amount || 0,
          overtimeHours: record.overtime_hours || 0,
          overtimeAmount: record.overtime_amount || 0,
          bonusAmount: record.bonus_amount || 0,
          netTotal: record.net_total,
          status: record.status,
          processedDate: record.processed_date,
          processedBy: record.processed_by,
          notes: record.notes,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        })) || [];

      setPayrollRecords(mappedRecords);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading payroll records",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if payroll record exists for employee and period
  const getExistingPayrollRecord = async (
    employeeId: string,
    period: string,
  ) => {
    try {
      const { data, error } = await supabase
        .from("payroll_records")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("period", period)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error checking existing payroll:", err);
      return null;
    }
  };

  // Crear registro de liquidación
  const createPayrollRecord = async (payroll: CreatePayrollRequest) => {
    try {
      const { data, error } = await supabase
        .from("payroll_records")
        .insert({
          employee_id: payroll.employeeId,
          period: payroll.period,
          base_days: payroll.baseDays,
          holiday_days: payroll.holidayDays || 0,
          base_amount: payroll.baseAmount,
          holiday_bonus: payroll.holidayBonus || 0,
          aguinaldo: payroll.aguinaldo || 0,
          discounts: payroll.discounts || 0,
          advances: payroll.advances || 0,
          white_amount: payroll.whiteAmount,
          informal_amount: payroll.informalAmount,
          presentismo_amount: payroll.presentismoAmount || 0,
          overtime_hours: payroll.overtimeHours || 0,
          overtime_amount: payroll.overtimeAmount || 0,
          bonus_amount: payroll.bonusAmount || 0,
          net_total: payroll.netTotal,
          status: payroll.status,
          processed_date: payroll.processedDate,
          processed_by: payroll.processedBy,
          notes: payroll.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: error,
        });
        throw new Error(error.message || "Database error");
      }

      await fetchPayrollRecords();
      return data;
    } catch (err) {
      console.error("Full error details:", {
        message: err.message,
        stack: err.stack,
        full: err,
      });
      throw new Error(
        err instanceof Error ? err.message : "Error creating payroll record",
      );
    }
  };

  // Actualizar registro de liquidación
  const updatePayrollRecord = async (
    id: string,
    updates: Partial<PayrollRecord>,
  ) => {
    try {
      const updateData: any = {};

      if (updates.baseDays !== undefined)
        updateData.base_days = updates.baseDays;
      if (updates.holidayDays !== undefined)
        updateData.holiday_days = updates.holidayDays;
      if (updates.baseAmount !== undefined)
        updateData.base_amount = updates.baseAmount;
      if (updates.holidayBonus !== undefined)
        updateData.holiday_bonus = updates.holidayBonus;
      if (updates.aguinaldo !== undefined)
        updateData.aguinaldo = updates.aguinaldo;
      if (updates.discounts !== undefined)
        updateData.discounts = updates.discounts;
      if (updates.advances !== undefined)
        updateData.advances = updates.advances;
      if (updates.whiteAmount !== undefined)
        updateData.white_amount = updates.whiteAmount;
      if (updates.informalAmount !== undefined)
        updateData.informal_amount = updates.informalAmount;
      if (updates.presentismoAmount !== undefined)
        updateData.presentismo_amount = updates.presentismoAmount;
      if (updates.overtimeHours !== undefined)
        updateData.overtime_hours = updates.overtimeHours;
      if (updates.overtimeAmount !== undefined)
        updateData.overtime_amount = updates.overtimeAmount;
      if (updates.bonusAmount !== undefined)
        updateData.bonus_amount = updates.bonusAmount;
      if (updates.netTotal !== undefined)
        updateData.net_total = updates.netTotal;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.processedDate !== undefined)
        updateData.processed_date = updates.processedDate;
      if (updates.processedBy !== undefined)
        updateData.processed_by = updates.processedBy;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from("payroll_records")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchPayrollRecords();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error updating payroll record",
      );
    }
  };

  // Eliminar registro de liquidación
  const deletePayrollRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payroll_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchPayrollRecords();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error deleting payroll record",
      );
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPayrollRecords();
  }, []);

  return {
    payrollRecords,
    loading,
    error,
    fetchPayrollRecords,
    getExistingPayrollRecord,
    createPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
  };
};
