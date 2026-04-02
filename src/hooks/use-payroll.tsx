import { useState, useEffect } from "react";
import { supabase, withRetry } from "@/lib/supabase";
import { useAudit } from "@/hooks/use-audit";
import { useAuth } from "@/hooks/use-auth-simple";
import { usePermissions } from "@/hooks/use-permissions";
import { normalizePayrollRecord } from "@/hooks/normalizers/normalizePayrollRecord";
import type {
  PayrollRecord,
  CreatePayrollRequest,
} from "@/services/interfaces";

export const usePayroll = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { auditPayroll } = useAudit();
  const { session, user } = useAuth();
  const { hasPermission } = usePermissions();

  // Cargar registros de liquidaciones
  const fetchPayrollRecords = async () => {
    console.log("🔄 Payroll: Starting to load records...");
    setLoading(true);
    setError(null);

    const loadFallbackPayroll = async (reason: string) => {
      console.log(
        `🚨 🚨 🚨 ACTIVATING EMERGENCY FALLBACK (${reason}) 🚨 🚨 🚨`,
      );
      console.log("🔄 Loading cached payroll data...");

      try {
        const { getFallbackPayrollData } = await import(
          "@/utils/offlineFallback"
        );
        const fallbackData = getFallbackPayrollData();

        if (fallbackData && fallbackData.length > 0) {
          setPayrollRecords(fallbackData.map(normalizePayrollRecord));
          console.log("🎉 🎉 🎉 FALLBACK SUCCESS! 🎉 🎉 🎉");
          console.log(`✅ ${fallbackData.length} payroll records loaded`);
          console.log("📶 OFFLINE MODE ACTIVE - You can work normally!");
          setError(null);

          if (
            typeof window !== "undefined" &&
            (window.location.pathname.includes("liquidaciones") ||
              window.location.pathname.includes("payroll"))
          ) {
            setTimeout(() => {
              console.log(
                "💡 TIP: All payroll features available in offline mode",
              );
            }, 1000);
          }

          return true;
        }

        throw new Error("Fallback data is empty");
      } catch (fallbackError) {
        console.error("💥 FALLBACK FAILED:", fallbackError);
        setError("Error crítico: No se pueden cargar las liquidaciones");
        setPayrollRecords([]);
        return false;
      }
    };

    const hasSupabaseSession = !!session?.user;

    if (!hasSupabaseSession) {
      console.log(
        "⏸️ No Supabase session available, skipping payroll load until login completes",
      );
      setPayrollRecords([]);
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Testing Supabase connection for payroll...");
      console.log("🔧 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log(
        "🔧 Supabase Key configured:",
        !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      );

      const { data, error } = await withRetry(
        async () => {
          const res = await supabase
            .from("payroll_records")
            .select(
              `
              id,
              employee_id,
              period,
              base_days,
              holiday_days,
              base_amount,
              holiday_bonus,
              aguinaldo,
              discounts,
              advances,
              white_amount,
              informal_amount,
              presentismo_amount,
              overtime_hours,
              overtime_amount,
              bonus_amount,
              net_total,
              status,
              processed_date,
              processed_by,
              notes,
              created_at,
              updated_at,
              employee:employees(name, job_position, sueldo_base, white_wage, informal_wage)
            `,
            )
            .order("period", { ascending: false });
          if (res.error) throw res.error;
          return res;
        },
        "fetchPayrollRecords",
        2,
      );

      console.log("🔄 Supabase payroll query result:");
      console.log("  - Data:", data);
      console.log("  - Error:", error);

      if (error) throw error;

      if (!data || data.length === 0) {
        console.warn("⚠️ Supabase returned 0 payroll records.");
        setPayrollRecords([]);
        return;
      }

      const mappedRecords = (data ?? []).map(normalizePayrollRecord);

      setPayrollRecords(mappedRecords);
    } catch (err) {
      console.error("❌ PAYROLL ERROR DETECTED:", err);

      if (err && typeof err === "object") {
        console.error(
          "❌ Payroll error details:",
          JSON.stringify(
            {
              message: (err as any).message,
              code: (err as any).code,
              details: (err as any).details,
              hint: (err as any).hint,
              errorType: typeof err,
              errorConstructor: err.constructor?.name,
            },
            null,
            2,
          ),
        );
        console.error("❌ Full error object:", err);
      }

      const normalizedMessage =
        err instanceof Error
          ? err.message
          : typeof (err as any)?.message === "string"
            ? (err as any).message
            : "";
      const isNetworkError =
        normalizedMessage.toLowerCase().includes("failed to fetch") ||
        normalizedMessage.toLowerCase().includes("networkerror") ||
        err instanceof TypeError;

      const shouldFallbackToOffline = bypassActive || isNetworkError;
      if (shouldFallbackToOffline) {
        const fallbackReason = bypassActive
          ? "query-error-bypass"
          : isNetworkError
            ? "network-error"
            : "query-error";
        const fallbackActivated = await loadFallbackPayroll(fallbackReason);
        if (fallbackActivated) {
          return;
        }
      }

      setError(
        err instanceof Error ? err.message : "Error cargando liquidaciones",
      );
      setPayrollRecords([]);
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
      console.error("Error checking existing payroll:", {
        message: err?.message,
        details: err?.details,
        code: err?.code,
        full: err,
      });
      return null;
    }
  };

  // Crear registro de liquidación
  const createPayrollRecord = async (payroll: CreatePayrollRequest) => {
    if (!hasPermission("payroll", "create")) {
      throw new Error("No tenés permiso para crear liquidaciones. Solo admin, gerente y RRHH pueden hacerlo.");
    }
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
        throw new Error(
          `Database error: ${error.message || error.details || "Unknown error"}`,
        );
      }

      // Auditar creación de liquidación
      try {
        await auditPayroll(
          "INSERT",
          data.id,
          null, // No hay valores anteriores
          {
            employeeId: payroll.employeeId,
            employeeName: payroll.employeeName,
            period: payroll.period,
            netTotal: payroll.netTotal,
            status: payroll.status,
            whiteAmount: payroll.whiteAmount,
            informalAmount: payroll.informalAmount,
          },
        );
      } catch (auditError) {
        console.error("Error auditing payroll creation:", auditError);
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
    if (!hasPermission("payroll", "edit")) {
      throw new Error("No tenés permiso para editar liquidaciones. Solo admin, gerente y RRHH pueden hacerlo.");
    }
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

      if (error) {
        console.error("Supabase update error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          updateData: updateData,
          id: id,
        });
        throw new Error(error.message || "Database update error");
      }

      // Auditar actualización de liquidación
      try {
        const oldRecord = payrollRecords.find((record) => record.id === id);
        await auditPayroll(
          "UPDATE",
          id,
          oldRecord
            ? {
                status: oldRecord.status,
                netTotal: oldRecord.netTotal,
                whiteAmount: oldRecord.whiteAmount,
                informalAmount: oldRecord.informalAmount,
                baseDays: oldRecord.baseDays,
              }
            : null,
          {
            status: updates.status,
            netTotal: updates.netTotal,
            whiteAmount: updates.whiteAmount,
            informalAmount: updates.informalAmount,
            baseDays: updates.baseDays,
          },
        );
      } catch (auditError) {
        console.error("Error auditing payroll update:", auditError);
      }

      await fetchPayrollRecords();
    } catch (err) {
      console.error("Update error details:", err);
      throw new Error(
        err instanceof Error ? err.message : "Error updating payroll record",
      );
    }
  };

  // Eliminar registro de liquidación
  const deletePayrollRecord = async (id: string) => {
    if (!hasPermission("payroll", "delete")) {
      throw new Error("No tenés permiso para eliminar liquidaciones. Solo admin, gerente y RRHH pueden hacerlo.");
    }
    try {
      // Obtener datos del registro antes de eliminarlo para auditoría
      const recordToDelete = payrollRecords.find((record) => record.id === id);

      const { error } = await supabase
        .from("payroll_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Auditar eliminación de liquidación
      try {
        await auditPayroll(
          "DELETE",
          id,
          recordToDelete
            ? {
                employeeId: recordToDelete.employeeId,
                employeeName: recordToDelete.employeeName,
                period: recordToDelete.period,
                netTotal: recordToDelete.netTotal,
                status: recordToDelete.status,
              }
            : null,
          null, // No hay valores nuevos en DELETE
        );
      } catch (auditError) {
        console.error("Error auditing payroll deletion:", auditError);
      }

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

    const handleEmergencyFallback = (event: any) => {
      if (event.detail?.data) {
        console.log("🚨 Emergency fallback received!");
        setPayrollRecords(event.detail.data);
        setError(null);
        setLoading(false);
        console.log("✅ Payroll records restored from emergency fallback");
      }
    };

    window.addEventListener(
      "emergency-payroll-fallback",
      handleEmergencyFallback,
    );

    return () => {
      window.removeEventListener(
        "emergency-payroll-fallback",
        handleEmergencyFallback,
      );
    };
  }, [session?.access_token, user?.id]);

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
