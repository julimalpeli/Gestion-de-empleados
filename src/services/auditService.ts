import { supabase } from "@/lib/supabase";
import { getReadableErrorMessage } from "@/utils/errorMessage";

export interface AuditLogEntry {
  id?: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "LOGIN_FAILED";
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  changed_by?: string | null;
  changed_at?: string;
}

export interface CreateAuditLogRequest {
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "LOGIN_FAILED";
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  changed_by?: string | null;
}

class AuditService {
  private disableAudit(reason?: string) {
    if (typeof window !== "undefined") {
      (window as any).auditDisabled = true;
      if (reason) {
        (window as any).auditDisabledReason = reason;
      }
    }
    if (reason) {
      console.warn(reason);
    }
  }

  constructor() {
    // Disable auditing immediately if admin bypass is active
    if (
      typeof window !== "undefined" &&
      window.localStorage?.getItem("admin-bypass")
    ) {
      const reason =
        "🔓 Admin bypass detected in constructor - disabling auditing";
      console.log(reason);
      this.disableAudit(reason);
    }
  }

  // Crear entrada de auditoría
  async createAuditEntry(
    request: CreateAuditLogRequest,
  ): Promise<AuditLogEntry> {
    // Check if auditing is disabled due to RLS issues
    if ((window as any).auditDisabled) {
      console.log("⏭️ Auditing disabled - skipping entry");
      return {} as AuditLogEntry;
    }

    // Check if we're using admin bypass (no Supabase session) - disable audit proactively
    if ((window as any).localStorage?.getItem("admin-bypass")) {
      const reason =
        "🔓 Admin bypass detected - disabling auditing proactively";
      console.log(reason);
      this.disableAudit(reason);
      return {} as AuditLogEntry;
    }

    try {
      console.log("📝 Creating audit log entry:", request);

      const auditPayload = {
        table_name: request.table_name,
        record_id: request.record_id,
        action: request.action,
        old_values: request.old_values,
        new_values: request.new_values,
        changed_by: request.changed_by,
        entity_type: request.table_name,
        entity_id: request.record_id,
      };

      const { error } = await supabase
        .from("audit_log")
        .insert(auditPayload, { returning: "minimal" });

      if (error) {
        const errorMessage = error.message || String(error);
        console.error("Error creating audit log:", errorMessage);
        console.error("Full error details:", error);

        // Si es un error de esquema, logearlo pero no fallar
        if (
          error.message?.includes("schema cache") ||
          error.message?.includes("column") ||
          error.message?.includes("relationship")
        ) {
          console.warn(
            "🔧 Schema issue detected - audit log table needs to be created/updated",
          );
          console.warn("💡 Run database/fix_audit_log_schema.sql to fix this");
          return {} as AuditLogEntry;
        }

        // Handle RLS policy violations gracefully
        if (errorMessage?.includes("row-level security policy")) {
          console.warn(
            "🔒 RLS policy blocking audit log insert - disabling auditing",
          );
          this.disableAudit();
          return {} as AuditLogEntry;
        }

        // Handle network errors gracefully
        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("fetch") ||
          error.message?.includes("network") ||
          error.message?.includes("connection") ||
          error.message?.includes("timeout")
        ) {
          console.warn(
            "⚠️ Network error during audit - continuing without audit",
          );
          return {} as AuditLogEntry;
        }

        // For other Supabase errors, log and return empty instead of throwing
        console.warn("⚠️ Audit entry creation failed:", error.message);
        return {} as AuditLogEntry;
      }

      console.log("✅ Audit log created (returning minimal)");
      return {
        ...auditPayload,
        changed_at: new Date().toISOString(),
      } as AuditLogEntry;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Audit service error:", errorMessage);
      console.error("Full audit error:", error);

      // Handle RLS policy violations gracefully
      if (errorMessage?.includes("row-level security policy")) {
        console.warn(
          "🔒 RLS policy blocking audit log - run database/fix_audit_log_rls.sql",
        );
        return {} as AuditLogEntry;
      }

      // Handle network errors gracefully
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("fetch")
      ) {
        console.warn(
          "⚠️ Network error caught in catch block - continuing without audit",
        );
        return {} as AuditLogEntry;
      }

      // Log schema issues specifically
      if (
        error.message?.includes("schema cache") ||
        error.message?.includes("column") ||
        error.message?.includes("relationship")
      ) {
        console.warn(
          "🔧 Database schema issue - audit logging temporarily disabled",
        );
        console.warn("💡 Please run: database/fix_audit_log_schema.sql");
      }

      // No lanzar error para evitar que falle la operación principal
      console.warn("⚠️ Audit log failed, but continuing with main operation");
      return {} as AuditLogEntry;
    }
  }

  // Obtener logs de auditoría con filtros
  async getAuditLogs(filters?: {
    table_name?: string;
    record_id?: string;
    action?: string;
    changed_by?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    // Check if auditing is disabled due to RLS issues
    if ((window as any).auditDisabled) {
      console.log("⏭️ Auditing disabled - returning empty audit logs");
      return [];
    }

    const bypassActive =
      typeof window !== "undefined" &&
      (window.localStorage?.getItem("admin-bypass") ||
        window.localStorage?.getItem("emergency-auth"));

    if (bypassActive) {
      this.disableAudit(
        "🔒 Audit logs viewer disabled while admin bypass/emergency auth is active",
      );
      return [];
    }

    try {
      // Validar que los filtros sean valores válidos antes de aplicarlos
      if (filters && typeof filters !== 'object') {
        console.error("Invalid filters parameter:", filters);
        return [];
      }

      // Primero intentar consulta simple sin join para evitar errores de esquema
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("changed_at", { ascending: false });

      // Aplicar filtros si existen - con validación de tipo
      if (filters?.table_name && typeof filters.table_name === 'string') {
        query = query.eq("table_name", filters.table_name);
      }
      if (filters?.record_id && typeof filters.record_id === 'string') {
        query = query.eq("record_id", filters.record_id);
      }
      if (filters?.action && typeof filters.action === 'string') {
        query = query.eq("action", filters.action);
      }
      if (filters?.changed_by && typeof filters.changed_by === 'string') {
        query = query.eq("changed_by", filters.changed_by);
      }
      if (filters?.start_date && typeof filters.start_date === 'string') {
        query = query.gte("changed_at", filters.start_date);
      }
      if (filters?.end_date && typeof filters.end_date === 'string') {
        query = query.lte("changed_at", filters.end_date);
      }
      if (filters?.limit && typeof filters.limit === 'number') {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        const readableMessage = getReadableErrorMessage(error);
        const lowerMessage = readableMessage.toLowerCase();

        // Check for network/connection errors first (most common)
        if (
          lowerMessage.includes("failed to fetch") ||
          lowerMessage.includes("network error") ||
          lowerMessage.includes("network") ||
          lowerMessage.includes("fetch") ||
          lowerMessage.includes("connection") ||
          lowerMessage.includes("timeout") ||
          lowerMessage.includes("aborted")
        ) {
          console.warn("🌐 Network issue fetching audit logs - returning []");
          return [];
        }

        // Check for RLS (Row-Level Security) errors
        const isRlsError =
          lowerMessage.includes("row-level security") ||
          lowerMessage.includes("permission denied") ||
          lowerMessage.includes("row level security") ||
          (error as any)?.code === "42501";

        if (isRlsError) {
          console.warn("🔒 RLS is blocking audit log queries - disabling client audit viewer");
          this.disableAudit(
            "🔒 RLS is blocking audit log queries - disabling client audit viewer",
          );
          return [];
        }

        // Check for schema/database configuration errors
        if (
          readableMessage.includes("schema cache") ||
          readableMessage.includes("column") ||
          readableMessage.includes("relationship") ||
          readableMessage.includes("relation") ||
          readableMessage.includes("audit_log") ||
          readableMessage.includes("does not exist") ||
          readableMessage.includes("undefined")
        ) {
          console.warn("🔧 Audit log table not properly configured");
          console.warn("💡 Run database/fix_audit_log_schema.sql to fix this");
          return [];
        }

        // If we get here and still have an error, log it but don't crash - return empty array
        console.error("Error fetching audit logs (unexpected error type):", readableMessage);
        return [];
      }

      return data || [];
    } catch (error) {
      const readableMessage = getReadableErrorMessage(error);
      const lowerMessage = readableMessage.toLowerCase();

      // Handle network errors gracefully
      if (
        lowerMessage.includes("failed to fetch") ||
        lowerMessage.includes("network") ||
        lowerMessage.includes("connection") ||
        lowerMessage.includes("timeout") ||
        lowerMessage.includes("aborted")
      ) {
        console.warn("🌐 Network error on audit logs - returning []");
        return [];
      }

      // Handle schema/database configuration errors gracefully
      if (
        lowerMessage.includes("schema cache") ||
        lowerMessage.includes("audit_log") ||
        lowerMessage.includes("relation") ||
        lowerMessage.includes("does not exist") ||
        lowerMessage.includes("undefined")
      ) {
        console.warn("🔧 Database schema issue - returning empty audit logs");
        return [];
      }

      // Handle RLS errors gracefully
      if (
        lowerMessage.includes("row-level security") ||
        lowerMessage.includes("row level security") ||
        lowerMessage.includes("permission denied")
      ) {
        console.warn("🔒 RLS policy blocking audit logs - returning []");
        return [];
      }

      // For any other error, log a warning but return empty array instead of crashing
      console.warn("⚠️ Unexpected error fetching audit logs - returning empty array:", readableMessage);
      return [];
    }
  }

  // Métodos de conveniencia para diferentes tipos de auditoría

  // Auditoría de empleados
  async auditEmployee(
    action: "INSERT" | "UPDATE" | "DELETE",
    employeeId: string,
    oldValues?: any,
    newValues?: any,
    userId?: string,
  ) {
    return this.createAuditEntry({
      table_name: "employees",
      record_id: employeeId,
      action,
      old_values: oldValues,
      new_values: newValues,
      changed_by: userId,
    });
  }

  // Auditoría de liquidaciones
  async auditPayroll(
    action: "INSERT" | "UPDATE" | "DELETE",
    payrollId: string,
    oldValues?: any,
    newValues?: any,
    userId?: string,
  ) {
    return this.createAuditEntry({
      table_name: "payroll_records",
      record_id: payrollId,
      action,
      old_values: oldValues,
      new_values: newValues,
      changed_by: userId,
    });
  }

  // Auditoría de historial salarial
  async auditSalaryHistory(
    action: "INSERT" | "UPDATE" | "DELETE",
    historyId: string,
    oldValues?: any,
    newValues?: any,
    userId?: string,
  ) {
    return this.createAuditEntry({
      table_name: "salary_history",
      record_id: historyId,
      action,
      old_values: oldValues,
      new_values: newValues,
      changed_by: userId,
    });
  }

  // Auditoría de usuarios
  async auditUser(
    action: "INSERT" | "UPDATE" | "DELETE",
    targetUserId: string,
    oldValues?: any,
    newValues?: any,
    changedByUserId?: string,
  ) {
    return this.createAuditEntry({
      table_name: "users",
      record_id: targetUserId,
      action,
      old_values: oldValues,
      new_values: newValues,
      changed_by: changedByUserId,
    });
  }

  // Auditoría de vacaciones
  async auditVacation(
    action: "INSERT" | "UPDATE" | "DELETE",
    vacationId: string,
    oldValues?: any,
    newValues?: any,
    userId?: string,
  ) {
    return this.createAuditEntry({
      table_name: "vacation_requests",
      record_id: vacationId,
      action,
      old_values: oldValues,
      new_values: newValues,
      changed_by: userId,
    });
  }

  // Auditoría de login/logout
  async auditLogin(
    action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED",
    userId: string,
    metadata?: {
      ip_address?: string;
      user_agent?: string;
      error_message?: string;
    },
  ) {
    return this.createAuditEntry({
      table_name: "users",
      record_id: userId,
      action,
      old_values: null,
      new_values: metadata || null,
      changed_by: userId,
    });
  }

  // Obtener estadísticas de auditoría
  async getAuditStats(filters?: {
    start_date?: string;
    end_date?: string;
    table_name?: string;
  }) {
    try {
      let query = supabase
        .from("audit_log")
        .select("action, table_name, changed_at");

      if (filters?.start_date) {
        query = query.gte("changed_at", filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte("changed_at", filters.end_date);
      }
      if (filters?.table_name) {
        query = query.eq("table_name", filters.table_name);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get audit stats: ${error.message}`);
      }

      // Procesar estadísticas
      const stats = {
        total: data?.length || 0,
        by_action: {} as Record<string, number>,
        by_table: {} as Record<string, number>,
        today: 0,
        this_week: 0,
      };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      data?.forEach((entry) => {
        // Contar por acción
        stats.by_action[entry.action] =
          (stats.by_action[entry.action] || 0) + 1;

        // Contar por tabla
        stats.by_table[entry.table_name] =
          (stats.by_table[entry.table_name] || 0) + 1;

        // Contar por fechas
        const entryDate = new Date(entry.changed_at);
        if (entryDate >= today) {
          stats.today++;
        }
        if (entryDate >= weekAgo) {
          stats.this_week++;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error getting audit stats:", error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
