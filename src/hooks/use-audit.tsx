import { useState, useEffect, useCallback } from "react";
import {
  auditService,
  type AuditLogEntry,
  type CreateAuditLogRequest,
} from "@/services/auditService";
import { useAuth } from "@/hooks/use-auth-simple";
import { getReadableErrorMessage } from "@/utils/errorMessage";

const isBypassModeActive = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    (window as any).auditDisabled ||
      window.localStorage?.getItem("admin-bypass") ||
      window.localStorage?.getItem("emergency-auth"),
  );
};

export const useAudit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  // Obtener logs de auditoría
  const fetchAuditLogs = useCallback(
    async (filters?: {
      table_name?: string;
      record_id?: string;
      action?: string;
      changed_by?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        if (isBypassModeActive()) {
          setAuditLogs([]);
          setError(
            "La auditoría está deshabilitada mientras uses el acceso temporal o de emergencia.",
          );
          return;
        }

        if (!session) {
          console.warn("No Supabase session found. Skipping audit log fetch.");
          return;
        }

        const logs = await auditService.getAuditLogs(filters);
        setAuditLogs(logs);
      } catch (err) {
        const readableMessage = getReadableErrorMessage(
          err,
          "No se pudieron obtener los registros de auditoría",
        );
        console.error("Error fetching audit logs:", readableMessage, err);
        setError(readableMessage);
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  // Cargar logs automáticamente
  useEffect(() => {
    if (isBypassModeActive()) {
      setAuditLogs([]);
      setError(
        "La vista de auditoría está deshabilitada en el modo temporal o de emergencia.",
      );
      return;
    }

    if (!session) {
      return;
    }

    fetchAuditLogs({ limit: 100 }); // Cargar últimos 100 registros por defecto
  }, [fetchAuditLogs, session]);

  // Métodos de conveniencia para auditar diferentes acciones
  const auditEmployee = useCallback(
    async (
      action: "INSERT" | "UPDATE" | "DELETE",
      employeeId: string,
      oldValues?: any,
      newValues?: any,
    ) => {
      try {
        await auditService.auditEmployee(
          action,
          employeeId,
          oldValues,
          newValues,
          user?.id,
        );
      } catch (error) {
        console.error("Error auditing employee:", getReadableErrorMessage(error));
      }
    },
    [user?.id],
  );

  const auditPayroll = useCallback(
    async (
      action: "INSERT" | "UPDATE" | "DELETE",
      payrollId: string,
      oldValues?: any,
      newValues?: any,
    ) => {
      try {
        await auditService.auditPayroll(
          action,
          payrollId,
          oldValues,
          newValues,
          user?.id,
        );
      } catch (error) {
        console.error("Error auditing payroll:", getReadableErrorMessage(error));
      }
    },
    [user?.id],
  );

  const auditSalaryHistory = useCallback(
    async (
      action: "INSERT" | "UPDATE" | "DELETE",
      historyId: string,
      oldValues?: any,
      newValues?: any,
    ) => {
      try {
        await auditService.auditSalaryHistory(
          action,
          historyId,
          oldValues,
          newValues,
          user?.id,
        );
      } catch (error) {
        console.error("Error auditing salary history:", getReadableErrorMessage(error));
      }
    },
    [user?.id],
  );

  const auditUser = useCallback(
    async (
      action: "INSERT" | "UPDATE" | "DELETE",
      targetUserId: string,
      oldValues?: any,
      newValues?: any,
    ) => {
      try {
        await auditService.auditUser(
          action,
          targetUserId,
          oldValues,
          newValues,
          user?.id,
        );
      } catch (error) {
        console.error("Error auditing user:", error);
      }
    },
    [user?.id],
  );

  const auditVacation = useCallback(
    async (
      action: "INSERT" | "UPDATE" | "DELETE",
      vacationId: string,
      oldValues?: any,
      newValues?: any,
    ) => {
      try {
        await auditService.auditVacation(
          action,
          vacationId,
          oldValues,
          newValues,
          user?.id,
        );
      } catch (error) {
        console.error("Error auditing vacation:", error);
      }
    },
    [user?.id],
  );

  const auditLogin = useCallback(
    async (
      action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED",
      targetUserId: string,
      metadata?: {
        ip_address?: string;
        user_agent?: string;
        error_message?: string;
      },
    ) => {
      try {
        await auditService.auditLogin(action, targetUserId, metadata);
      } catch (error) {
        console.error("Error auditing login:", error);
      }
    },
    [],
  );

  return {
    auditLogs,
    loading,
    error,
    fetchAuditLogs,
    // Métodos de auditoría
    auditEmployee,
    auditPayroll,
    auditSalaryHistory,
    auditUser,
    auditVacation,
    auditLogin,
  };
};

// Hook específico para estadísticas de auditoría
export const useAuditStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (filters?: {
      start_date?: string;
      end_date?: string;
      table_name?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const auditStats = await auditService.getAuditStats(filters);
        setStats(auditStats);
      } catch (err) {
        console.error("Error fetching audit stats:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};
