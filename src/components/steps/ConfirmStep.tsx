import { useState } from "react";
import { Loader2, Mail, PenLine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import type { ProcessedReceipt } from "@/types/recibos";

interface ConfirmStepProps {
  receipts: ProcessedReceipt[];
  onEnviar: (signatureFile?: File) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function ConfirmStep({ receipts, onEnviar, onBack, isLoading }: ConfirmStepProps) {
  const [signatureFile, setSignatureFile] = useState<File | undefined>();
  const toSend = receipts.filter((r) => r.selected && r.employee?.email);
  const skipped = receipts.filter((r) => r.selected && !r.employee?.email);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Confirmar envío</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Revisá el resumen antes de enviar. Esta acción enviará un email a cada empleado
          con su recibo adjunto.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{toSend.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Recibos a enviar</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{skipped.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Sin email (se omiten)</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{receipts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total en lote</p>
        </div>
      </div>

      {/* Recipient list */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Destinatarios</p>
        <ul className="divide-y rounded-lg border overflow-hidden">
          {toSend.map((r, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-2 bg-background">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{r.employee!.name}</p>
                  <p className="text-xs text-muted-foreground">{r.employee!.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.period && (
                  <Badge variant="outline" className="text-xs">{r.period}</Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">{r.receipt_type}</Badge>
              </div>
            </li>
          ))}
          {toSend.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No hay destinatarios válidos seleccionados.
            </li>
          )}
        </ul>
      </div>

      {/* Optional signature */}
      <div className="space-y-2">
        <Label htmlFor="signature" className="flex items-center gap-2 text-sm font-medium">
          <PenLine className="h-4 w-4" />
          Firma del empleador (opcional)
        </Label>
        <p className="text-xs text-muted-foreground">
          Si cargás una imagen de firma (PNG/JPG), se incrustará automáticamente en el recibo
          debajo del texto "FIRMA DEL EMPLEADOR".
        </p>
        <input
          id="signature"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={(e) => setSignatureFile(e.target.files?.[0])}
          disabled={isLoading}
          className="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
            file:text-sm file:font-medium file:bg-muted file:text-foreground
            hover:file:bg-muted/80 cursor-pointer"
        />
        {signatureFile && (
          <p className="text-xs text-green-600 font-medium">
            ✓ Firma cargada: {signatureFile.name}
          </p>
        )}
      </div>

      {toSend.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay destinatarios con email válido. Volvé al paso anterior y verificá que los
            empleados tengan email cargado en el sistema.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Volver
        </Button>
        <Button
          onClick={() => onEnviar(signatureFile)}
          disabled={toSend.length === 0 || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Enviar {toSend.length} recibo(s)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
