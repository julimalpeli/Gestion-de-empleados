import { supabase } from "@/lib/supabase";

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
  // Crear entrada de auditoría
  async createAuditEntry(
    request: CreateAuditLogRequest,
  ): Promise<AuditLogEntry> {
    try {
      console.log("📝 Creating audit log entry:", request);

      // Verificar si la tabla audit_log existe
      const { data: tableCheck } = await supabase
        .from("audit_log")
        .select("count", { count: "exact", head: true })
        .limit(1);

      // Si la tabla no existe o hay problemas de esquema, log y continuar
      const { data, error } = await supabase
        .from("audit_log")
        .insert({
          table_name: request.table_name,
          record_id: request.record_id,
          action: request.action,
          old_values: request.old_values,
          new_values: request.new_values,
          changed_by: request.changed_by,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating audit log:", error);

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
        if (error.message?.includes("row-level security policy")) {
          console.warn(
            "⚠️ RLS policy violation for audit log - continuing without audit",
          );
          return {} as AuditLogEntry;
        }

        // Handle network errors gracefully
        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("fetch")
        ) {
          console.warn(
            "⚠️ Network error during audit - continuing without audit",
          );
          return {} as AuditLogEntry;
        }

        throw new Error(`Failed to create audit log: ${error.message}`);
      }

      console.log("✅ Audit log created:", data);
      return data;
    } catch (error) {
      console.error("Audit service error:", error);

      // Handle RLS policy violations gracefully
      if (error.message?.includes("row-level security policy")) {
        console.warn(
          "⚠️ RLS policy violation caught in catch block - continuing without audit",
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
    try {
      // Primero intentar consulta simple sin join para evitar errores de esquema
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("changed_at", { ascending: false });

      // Aplicar filtros si existen
      if (filters?.table_name) {
        query = query.eq("table_name", filters.table_name);
      }
      if (filters?.record_id) {
        query = query.eq("record_id", filters.record_id);
      }
      if (filters?.action) {
        query = query.eq("action", filters.action);
      }
      if (filters?.changed_by) {
        query = query.eq("changed_by", filters.changed_by);
      }
      if (filters?.start_date) {
        query = query.gte("changed_at", filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte("changed_at", filters.end_date);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching audit logs:", error);

        // Si es un error de esquema, devolver array vacío en lugar de fallar
        if (
          error.message?.includes("schema cache") ||
          error.message?.includes("column") ||
          error.message?.includes("relationship") ||
          error.message?.includes("relation") ||
          error.message?.includes("audit_log")
        ) {
          console.warn("🔧 Audit log table not properly configured");
          console.warn("💡 Run database/fix_audit_log_schema.sql to fix this");
          return [];
        }

        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error getting audit logs:", error);

      // Manejo graceful de errores de esquema
      if (
        error.message?.includes("schema cache") ||
        error.message?.includes("audit_log") ||
        error.message?.includes("relation")
      ) {
        console.warn("🔧 Database schema issue - returning empty audit logs");
        return [];
      }

      throw error;
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
