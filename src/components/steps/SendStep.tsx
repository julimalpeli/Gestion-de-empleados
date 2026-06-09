import { useEffect } from "react";
import { CheckCircle2, XCircle, RefreshCw, Plus, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SendResult, BatchHistory } from "@/types/recibos";

interface SendStepProps {
  sendResult?: SendResult;
  batchHistory: BatchHistory[];
  isLoading: boolean;
  onLoadHistorial: () => void;
  onReintentar: (batchId: string) => void;
  onNuevoLote: () => void;
}

export function SendStep({
  sendResult,
  batchHistory,
  isLoading,
  onLoadHistorial,
  onReintentar,
  onNuevoLote,
}: SendStepProps) {
  useEffect(() => {
    onLoadHistorial();
  }, [onLoadHistorial]);

  return (
    <div className="space-y-6">
      {/* Result banner */}
      {sendResult && (
        <div className={`rounded-xl border p-6 ${
          sendResult.total_failed === 0
            ? "bg-green-50 border-green-200"
            : "bg-orange-50 border-orange-200"
        }`}>
          <div className="flex items-start gap-4">
            {sendResult.total_failed === 0 ? (
              <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
            ) : (
              <Clock className="h-8 w-8 text-orange-500 shrink-0" />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {sendResult.total_failed === 0 ? "¡Lote enviado con éxito!" : "Envío parcial"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-green-700">{sendResult.total_sent}</span> enviado(s)
                {sendResult.total_failed > 0 && (
                  <> · <span className="font-medium text-red-600">{sendResult.total_failed}</span> fallido(s)</>
                )}
              </p>

              {/* Messages */}
              {sendResult.messages.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {sendResult.messages.slice(0, 8).map((msg, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      {msg.includes("Sent") || msg.includes("enviado") ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                      )}
                      {msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onNuevoLote} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo lote
        </Button>
        <Button variant="outline" onClick={onLoadHistorial} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar historial
        </Button>
      </div>

      <Separator />

      {/* Batch history */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Historial de lotes enviados</h3>

        {batchHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No hay lotes en el historial aún.
          </p>
        ) : (
          <div className="space-y-3">
            {batchHistory.map((batch) => (
              <Card key={batch.batch_id} className="shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-sm font-medium font-mono">
                      {batch.batch_id.slice(0, 8)}…
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(batch.created_at).toLocaleString("es-AR")}
                      </span>
                      <BatchStatusBadge sent={batch.sent_count} failed={batch.failed_count} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      <span>
                        <span className="font-medium text-green-600">{batch.sent_count}</span>{" "}
                        <span className="text-muted-foreground">enviados</span>
                      </span>
                      {batch.failed_count > 0 && (
                        <span>
                          <span className="font-medium text-red-600">{batch.failed_count}</span>{" "}
                          <span className="text-muted-foreground">fallidos</span>
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {batch.total_receipts} en total
                      </span>
                    </div>
                    {batch.failed_count > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReintentar(batch.batch_id)}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reintentar fallidos
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BatchStatusBadge({ sent, failed }: { sent: number; failed: number }) {
  if (failed === 0) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
        Completado
      </Badge>
    );
  }
  if (sent === 0) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
        Fallido
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
      Parcial
    </Badge>
  );
}
