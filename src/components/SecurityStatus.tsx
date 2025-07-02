import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth-simple";

const SecurityStatus = () => {
  const { exportSecurityLogs, getSecurityLogsSummary } = useAuth();
  const [showLogs, setShowLogs] = useState(false);

  const summary = getSecurityLogsSummary();
  const blockData = JSON.parse(localStorage.getItem("loginBlock") || "null");

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes("SUCCESS")) return "bg-green-100 text-green-800";
    if (eventType.includes("FAILED") || eventType.includes("ERROR"))
      return "bg-red-100 text-red-800";
    if (eventType.includes("ATTEMPT")) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Estado de Seguridad
        </CardTitle>
        <CardDescription>
          Monitoreo de eventos de seguridad y autenticación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Total Eventos</span>
            </div>
            <div className="text-2xl font-bold">{summary.totalEvents}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Eventos por Tipo</span>
            </div>
            <div className="text-sm space-y-1">
              {Object.entries(summary.eventTypes).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span className="text-xs">{formatEventType(type)}</span>
                  <Badge variant="outline" className={getEventTypeColor(type)}>
                    {count as number}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Block Status */}
        {blockData && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Usuario Bloqueado:</strong> {blockData.attempts}{" "}
              intentos fallidos detectados. Bloqueado hasta:{" "}
              {new Date(blockData.blockedUntil).toLocaleString("es-AR")}
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Events */}
        {showLogs && (
          <div className="space-y-2">
            <h4 className="font-medium">Eventos Recientes</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {summary.lastEvents.map((event: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="flex justify-between items-start">
                    <Badge
                      className={getEventTypeColor(event.eventType)}
                      variant="outline"
                    >
                      {formatEventType(event.eventType)}
                    </Badge>
                    <span className="text-gray-500">
                      {new Date(event.timestamp).toLocaleString("es-AR")}
                    </span>
                  </div>
                  {event.details.username && (
                    <div className="mt-1">
                      <strong>Usuario:</strong> {event.details.username}
                      {event.details.role && (
                        <span> ({event.details.role})</span>
                      )}
                    </div>
                  )}
                  {event.details.error && (
                    <div className="mt-1 text-red-600">
                      <strong>Error:</strong> {event.details.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showLogs ? "Ocultar" : "Ver"} Eventos
          </Button>

          <Button variant="outline" size="sm" onClick={exportSecurityLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Logs
          </Button>
        </div>

        {/* Security Tips */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Consejos de Seguridad:</strong>
            <ul className="mt-2 text-xs space-y-1">
              <li>• Las sesiones expiran automáticamente después de 4 horas</li>
              <li>
                • Después de 6 intentos fallidos, el acceso se bloquea por 15
                minutos
              </li>
              <li>
                • Todos los eventos de seguridad son registrados y auditados
              </li>
              <li>
                • Las credenciales demo solo están disponibles en desarrollo
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SecurityStatus;
