import { CheckSquare, Square, AlertTriangle, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProcessedReceipt } from "@/types/recibos";

interface PreviewStepProps {
  receipts: ProcessedReceipt[];
  onToggle: (index: number) => void;
  onSelectAll: (selected: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

const RECEIPT_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  normal: { label: "Normal", className: "bg-blue-50 text-blue-700 border-blue-200" },
  aguinaldo: { label: "Aguinaldo", className: "bg-amber-50 text-amber-700 border-amber-200" },
  retenciones: { label: "Retenciones", className: "bg-purple-50 text-purple-700 border-purple-200" },
};

export function PreviewStep({ receipts, onToggle, onSelectAll, onNext, onBack }: PreviewStepProps) {
  const allSelected = receipts.every((r) => r.selected);
  const selectedCount = receipts.filter((r) => r.selected).length;
  const noMatchCount = receipts.filter((r) => r.status === "no-match").length;
  const withEmail = receipts.filter((r) => r.selected && r.employee?.email).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Revisión de recibos detectados</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verificá que los datos sean correctos antes de confirmar. Los recibos sin empleado
          asociado no se podrán enviar.
        </p>
      </div>

      {noMatchCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {noMatchCount} recibo(s) no pudieron asociarse a un empleado (CUIL/DNI no encontrado).
            Podés igualmente incluirlos pero no recibirán el email.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => onSelectAll(!!v)}
                />
              </TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>CUIL / DNI</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((r, i) => {
              const typeInfo = RECEIPT_TYPE_LABELS[r.receipt_type] ?? RECEIPT_TYPE_LABELS.normal;
              return (
                <TableRow key={i} className={!r.selected ? "opacity-50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={r.selected}
                      onCheckedChange={() => onToggle(i)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[160px]">{r.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeInfo.className}>
                      {typeInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{r.period ?? "—"}</TableCell>
                  <TableCell>
                    {r.employee ? (
                      <div>
                        <p className="text-sm font-medium">{r.employee.name}</p>
                        <p className="text-xs text-muted-foreground">{r.employee.email ?? "Sin email"}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <User className="h-3 w-3" />
                        <span>No encontrado</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {r.cuil ? (
                      <span title="CUIL">{r.cuil}</span>
                    ) : r.dni ? (
                      <span title="DNI" className="text-muted-foreground">{r.dni}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {r.total_amount != null
                      ? `$${r.total_amount.toLocaleString("es-AR")}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {r.status === "ready" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Listo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        Sin match
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedCount} seleccionado(s) · {withEmail} con email para enviar
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Volver</Button>
          <Button onClick={onNext} disabled={withEmail === 0}>
            Confirmar selección →
          </Button>
        </div>
      </div>
    </div>
  );
}
