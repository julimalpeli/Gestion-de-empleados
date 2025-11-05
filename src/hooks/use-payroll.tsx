import { useState, useEffect } from "react";
import { supabase, withRetry } from "@/lib/supabase";
import { useAudit } from "@/hooks/use-audit";
import { useAuth } from "@/hooks/use-auth-simple";
import type {
  PayrollRecord,
  CreatePayrollRequest,
} from "@/services/interfaces";

const ADMIN_BYPASS_ENABLED =
  import.meta.env.VITE_ENABLE_ADMIN_BYPASS === "true";

const hasOwn = Object.prototype.hasOwnProperty;

const readField = (source: any, snake: string, camel: string) => {
  if (!source) {
    return undefined;
  }
  if (hasOwn.call(source, snake)) {
    const value = source[snake];
    return value ?? undefined;
  }
  if (hasOwn.call(source, camel)) {
    const value = source[camel];
    return value ?? undefined;
  }
  return undefined;
};

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

const normalizePayrollRecord = (record: any): PayrollRecord => {
  const employeeData = readField(record, "employee", "employee") as any;

  const whiteAmountSource = toOptionalNumber(
    readField(record, "white_amount", "whiteAmount"),
  );

  const informalAmountSource = toOptionalNumber(
    readField(record, "informal_amount", "informalAmount"),
  );

  const resolvedWhiteAmount = whiteAmountSource ?? 0;
  const resolvedInformalAmount = informalAmountSource ?? 0;

  const employeeBaseSource = toOptionalNumber(
    readField(employeeData, "sueldo_base", "sueldoBase"),
  );
  const resolvedEmployeeBase =
    employeeBaseSource !== undefined
      ? employeeBaseSource
      : whiteAmountSource !== undefined || informalAmountSource !== undefined
        ? (whiteAmountSource ?? 0) + (informalAmountSource ?? 0)
        : undefined;

  const baseAmountSource =
    toOptionalNumber(readField(record, "base_amount", "baseAmount")) ??
    resolvedEmployeeBase;

  const resolvedBaseAmount =
    baseAmountSource !== undefined
      ? baseAmountSource
      : (whiteAmountSource ?? 0) + (informalAmountSource ?? 0);

  const baseDays = toNumber(readField(record, "base_days", "baseDays"));
  const holidayDays = toNumber(
    readField(record, "holiday_days", "holidayDays"),
  );
  const holidayBonus = toNumber(
    readField(record, "holiday_bonus", "holidayBonus"),
  );
  const aguinaldo = toNumber(readField(record, "aguinaldo", "aguinaldo"));
  const discounts = toNumber(readField(record, "discounts", "discounts"));
  const advances = toNumber(readField(record, "advances", "advances"));
  const presentismoAmount = toNumber(
    readField(record, "presentismo_amount", "presentismoAmount"),
  );
  const overtimeHours = toOptionalNumber(
    readField(record, "overtime_hours", "overtimeHours"),
  );
  const overtimeAmount = toNumber(
    readField(record, "overtime_amount", "overtimeAmount"),
  );
  const bonusAmount = toNumber(
    readField(record, "bonus_amount", "bonusAmount"),
  );
  const netTotal =
    toOptionalNumber(readField(record, "net_total", "netTotal")) ??
    resolvedWhiteAmount +
      resolvedInformalAmount +
      presentismoAmount +
      holidayBonus +
      aguinaldo +
      overtimeAmount +
      bonusAmount -
      advances -
      discounts;

  const processedDate = readField(record, "processed_date", "processedDate");
  const processedBy = readField(record, "processed_by", "processedBy");
  const notes = readField(record, "notes", "notes");
  const now = new Date().toISOString();

  return {
    id: (readField(record, "id", "id") as string) ?? "",
    employeeId:
      (readField(record, "employee_id", "employeeId") as string) ?? "",
    employeeName:
      (readField(employeeData, "name", "name") as string) ??
      (readField(record, "employeeName", "employeeName") as string) ??
      "Empleado no encontrado",
    period: (readField(record, "period", "period") as string) ?? "",
    baseDays,
    holidayDays,
    baseAmount: resolvedBaseAmount,
    holidayBonus,
    aguinaldo,
    discounts,
    advances,
    whiteAmount: resolvedWhiteAmount,
    informalAmount: resolvedInformalAmount,
    presentismoAmount,
    overtimeHours: overtimeHours ?? 0,
    overtimeAmount,
    bonusAmount,
    netTotal,
    status:
      (readField(record, "status", "status") as PayrollRecord["status"]) ??
      "draft",
    processedDate: processedDate as string | undefined,
    processedBy: processedBy as string | undefined,
    notes: notes as string | undefined,
    createdAt: (readField(record, "created_at", "createdAt") as string) ?? now,
    updatedAt: (readField(record, "updated_at", "updatedAt") as string) ?? now,
  };
};

export const usePayroll = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { auditPayroll } = useAudit();
  const { session, user } = useAuth();

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
    const bypassActive =
      ADMIN_BYPASS_ENABLED &&
      !hasSupabaseSession &&
      !!user &&
      typeof window !== "undefined" &&
      (localStorage.getItem("admin-bypass") ||
        localStorage.getItem("emergency-auth"));

    if (!hasSupabaseSession) {
      if (bypassActive) {
        console.log(
          "🚪 No Supabase session but bypass active - using fallback payroll data",
        );
        await loadFallbackPayroll("no-session-bypass");
      } else {
        console.log(
          "⏸️ No Supabase session available, skipping payroll load until login completes",
        );
        setPayrollRecords([]);
      }
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
              *,
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

      if (bypassActive) {
        await loadFallbackPayroll("query-error-bypass");
      } else {
        setError(
          err instanceof Error ? err.message : "Error cargando liquidaciones",
        );
        setPayrollRecords([]);
      }
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
