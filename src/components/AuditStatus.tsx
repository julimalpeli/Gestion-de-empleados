import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Database, Settings } from "lucide-react";
import { auditService } from "@/services/auditService";

export const AuditStatus = () => {
  const [auditStatus, setAuditStatus] = useState<
    "unknown" | "working" | "schema_error"
  >("unknown");
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  // Verificar estado de auditoría
  const checkAuditStatus = async () => {
    setIsChecking(true);
    try {
      // Intentar crear una entrada de prueba
      const testResult = await auditService.createAuditEntry({
        table_name: "test",
        record_id: "00000000-0000-0000-0000-000000000000",
        action: "INSERT",
        old_values: null,
        new_values: { test: true },
        changed_by: null,
      });

      // Intentar obtener logs
      const logs = await auditService.getAuditLogs({ limit: 1 });

      setAuditStatus("working");
      setLastCheck(new Date().toLocaleString());
    } catch (error) {
      console.error("Audit check failed:", error);
      setAuditStatus("schema_error");
      setLastCheck(new Date().toLocaleString());
    } finally {
      setIsChecking(false);
    }
  };

  // Verificar al cargar el componente
  useEffect(() => {
    checkAuditStatus();
  }, []);

  const getStatusInfo = () => {
    switch (auditStatus) {
      case "working":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          badge: (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Funcionando
            </Badge>
          ),
          message: "El sistema de auditoría está funcionando correctamente.",
          color: "green",
        };
      case "schema_error":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          badge: <Badge variant="destructive">Error de Esquema</Badge>,
          message: "La tabla audit_log necesita ser creada o actualizada.",
          color: "red",
        };
      case "unknown":
      default:
        return {
          icon: <Database className="h-5 w-5 text-gray-600" />,
          badge: <Badge variant="outline">Verificando...</Badge>,
          message: "Verificando estado del sistema de auditoría.",
          color: "gray",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {statusInfo.icon}
          Sistema de Auditoría
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Estado:</span>
          {statusInfo.badge}
        </div>

        <p className="text-sm text-gray-700">{statusInfo.message}</p>

        {auditStatus === "schema_error" && (
          <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-800">
              ⚠️ Acción requerida:
            </p>
            <p className="text-xs text-red-700">
              Ejecute el siguiente script SQL en Supabase:
            </p>
            <code className="block text-xs bg-red-100 p-2 rounded border font-mono">
              database/fix_audit_log_schema.sql
            </code>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={checkAuditStatus}
            disabled={isChecking}
            className="flex-1"
          >
            <Settings className="h-3 w-3 mr-1" />
            {isChecking ? "Verificando..." : "Verificar Estado"}
          </Button>
        </div>

        {lastCheck && (
          <p className="text-xs text-gray-500">
            Última verificación: {lastCheck}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditStatus;
