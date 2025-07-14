import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Edit,
  Calendar,
  FileText,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SalaryChange {
  field: string;
  oldValue: number;
  newValue: number;
  label: string;
}

interface SalaryChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  changes: SalaryChange[];
  onConfirm: (
    changeType: "aumento" | "correccion",
    effectiveDate: string,
    reason: string,
  ) => void;
}

const SalaryChangeDialog = ({
  isOpen,
  onClose,
  employee,
  changes,
  onConfirm,
}: SalaryChangeDialogProps) => {
  const [changeType, setChangeType] = useState<"aumento" | "correccion">(
    "aumento",
  );
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!effectiveDate) {
      alert("La fecha efectiva es requerida");
      return;
    }

    if (changeType === "aumento" && !reason.trim()) {
      alert("El motivo es requerido para aumentos salariales");
      return;
    }

    onConfirm(changeType, effectiveDate, reason.trim());

    // Reset form
    setChangeType("aumento");
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setReason("");
  };

  const calculateTotalChange = () => {
    return changes.reduce(
      (sum, change) => sum + (change.newValue - change.oldValue),
      0,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cambio Salarial Detectado
          </DialogTitle>
          <DialogDescription>
            Se detectaron cambios en los conceptos salariales de{" "}
            <strong>{employee?.name}</strong>. Por favor, especifica el tipo de
            cambio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen de cambios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Cambios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {changes.map((change, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{change.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {formatCurrency(change.oldValue)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCurrency(change.newValue)}
                    </span>
                    <Badge
                      variant={
                        change.newValue > change.oldValue
                          ? "default"
                          : "secondary"
                      }
                      className={
                        change.newValue > change.oldValue
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {change.newValue > change.oldValue ? "+" : ""}
                      {formatCurrency(change.newValue - change.oldValue)}
                    </Badge>
                  </div>
                </div>
              ))}

              {changes.length > 1 && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-medium">
                    <span>Cambio Total:</span>
                    <Badge
                      variant={
                        calculateTotalChange() > 0 ? "default" : "secondary"
                      }
                      className={
                        calculateTotalChange() > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {calculateTotalChange() > 0 ? "+" : ""}
                      {formatCurrency(calculateTotalChange())}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tipo de cambio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tipo de Cambio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={changeType} onValueChange={setChangeType}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="aumento" id="aumento" />
                  <div className="flex items-center gap-2 flex-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <Label
                        htmlFor="aumento"
                        className="font-medium cursor-pointer"
                      >
                        Aumento Salarial
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Incremento real del sueldo (se guarda en historial)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="correccion" id="correccion" />
                  <div className="flex items-center gap-2 flex-1">
                    <Edit className="h-4 w-4 text-blue-600" />
                    <div>
                      <Label
                        htmlFor="correccion"
                        className="font-medium cursor-pointer"
                      >
                        Corrección de Error
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Corrección de un error administrativo (no se guarda en
                        historial)
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Fecha efectiva */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="effective-date"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Fecha Efectiva
              </Label>
              <Input
                id="effective-date"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Fecha desde la cual aplica el cambio
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Período de Impacto
              </Label>
              <div className="p-2 bg-gray-50 rounded border text-sm">
                {(() => {
                  const date = new Date();
                  const months = [
                    "Enero",
                    "Febrero",
                    "Marzo",
                    "Abril",
                    "Mayo",
                    "Junio",
                    "Julio",
                    "Agosto",
                    "Septiembre",
                    "Octubre",
                    "Noviembre",
                    "Diciembre",
                  ];
                  return `${months[date.getMonth()]} ${date.getFullYear()}`;
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Período en el que impacta el cambio
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo{" "}
              {changeType === "aumento" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                changeType === "aumento"
                  ? "Ej: Aumento por inflación anual, promoción, etc."
                  : "Ej: Error en la carga inicial de datos (opcional)"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirmar Cambio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalaryChangeDialog;
