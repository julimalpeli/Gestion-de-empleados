import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Info, Clock, CheckCircle } from "lucide-react";

interface VacationRecord {
  id: number;
  startDate: string;
  endDate: string;
  days: number;
  type: "earned" | "advance" | "pending";
  status: "approved" | "taken" | "pending";
  comments: string;
  year: number;
}

interface Employee {
  id: number;
  name: string;
  startDate: string;
  position: string;
}

interface VacationManagerProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
}

export const VacationManager = ({
  employee,
  isOpen,
  onClose,
}: VacationManagerProps) => {
  const [isAddVacationOpen, setIsAddVacationOpen] = useState(false);
  const [vacationType, setVacationType] = useState("earned");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comments, setComments] = useState("");

  // Calcular antigüedad y días de vacaciones correspondientes
  const calculateSeniority = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const years = Math.floor(
      (today.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
    return years;
  };

  const calculateVacationDays = (startDate: string) => {
    const seniority = calculateSeniority(startDate);

    if (seniority < 5) return 14;
    if (seniority < 10) return 21;
    if (seniority < 20) return 28;
    return 35;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const calculateDaysBetween = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
    return diffDays;
  };

  const seniority = calculateSeniority(employee.startDate);
  const annualVacationDays = calculateVacationDays(employee.startDate);
  const calculatedDays = calculateDaysBetween(startDate, endDate);

  // Mock vacation records - En una implementación real vendría de la base de datos
  const vacationRecords: VacationRecord[] = [
    {
      id: 1,
      startDate: "2024-01-15",
      endDate: "2024-01-26",
      days: 12,
      type: "earned",
      status: "taken",
      comments: "Vacaciones de verano",
      year: 2024,
    },
    {
      id: 2,
      startDate: "2024-07-01",
      endDate: "2024-07-07",
      days: 7,
      type: "advance",
      status: "taken",
      comments: "Vacaciones a cuenta - viaje familiar",
      year: 2024,
    },
    {
      id: 3,
      startDate: "2024-12-23",
      endDate: "2024-12-30",
      days: 8,
      type: "pending",
      status: "approved",
      comments: "Vacaciones de fin de año",
      year: 2024,
    },
  ];

  const currentYear = new Date().getFullYear();
  const takenThisYear = vacationRecords
    .filter((v) => v.year === currentYear && v.status === "taken")
    .reduce((sum, v) => sum + v.days, 0);

  const pendingThisYear = vacationRecords
    .filter((v) => v.year === currentYear && v.status === "approved")
    .reduce((sum, v) => sum + v.days, 0);

  const remainingDays = annualVacationDays - takenThisYear - pendingThisYear;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Vacaciones - {employee.name}
          </DialogTitle>
          <DialogDescription>
            Administra las vacaciones del empleado según su antigüedad y
            normativa vigente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Vacation Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Información del Empleado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Fecha de ingreso:
                  </span>
                  <span className="font-medium">
                    {formatDate(employee.startDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Antigüedad:
                  </span>
                  <span className="font-medium">{seniority} años</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Vacaciones anuales:
                  </span>
                  <span className="font-bold text-primary">
                    {annualVacationDays} días
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Estado {currentYear}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Días tomados:
                  </span>
                  <span className="font-medium text-red-600">
                    {takenThisYear} días
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Días aprobados:
                  </span>
                  <span className="font-medium text-yellow-600">
                    {pendingThisYear} días
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Días disponibles:
                  </span>
                  <span className="font-bold text-green-600">
                    {remainingDays} días
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vacation Calculation Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    Cálculo de Vacaciones según Ley:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-blue-700 space-y-1">
                    <li>Hasta 5 años: 14 días corridos</li>
                    <li>De 5 a 10 años: 21 días corridos</li>
                    <li>De 10 a 20 años: 28 días corridos</li>
                    <li>Más de 20 años: 35 días corridos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Vacation Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Historial de Vacaciones</h3>
            <Dialog
              open={isAddVacationOpen}
              onOpenChange={setIsAddVacationOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Vacaciones
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Vacaciones</DialogTitle>
                  <DialogDescription>
                    Agrega un período de vacaciones para {employee.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vacationType">Tipo de Vacación</Label>
                    <Select
                      value={vacationType}
                      onValueChange={setVacationType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earned">
                          Vacaciones Correspondientes
                        </SelectItem>
                        <SelectItem value="advance">
                          Vacaciones a Cuenta
                        </SelectItem>
                        <SelectItem value="pending">
                          Vacaciones Aprobadas (Futuras)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha Inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Fecha Fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {calculatedDays > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        Días calculados:{" "}
                        <span className="text-primary">
                          {calculatedDays} días
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="comments">Comentarios</Label>
                    <Textarea
                      id="comments"
                      placeholder="Ej: Vacaciones de verano, viaje familiar, etc."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>

                  {vacationType === "advance" && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Vacaciones a Cuenta:</strong> Se descontarán del
                        período siguiente
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        // Aquí se guardarían las vacaciones
                        setIsAddVacationOpen(false);
                        setStartDate("");
                        setEndDate("");
                        setComments("");
                      }}
                      className="w-full"
                      disabled={!startDate || !endDate}
                    >
                      Guardar Vacaciones
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddVacationOpen(false)}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vacation Records Table */}
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead>Año</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacationRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatDate(record.startDate)} -{" "}
                            {formatDate(record.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{record.days}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.type === "earned"
                              ? "default"
                              : record.type === "advance"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {record.type === "earned" && "Correspondientes"}
                          {record.type === "advance" && "A Cuenta"}
                          {record.type === "pending" && "Pendientes"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {record.status === "taken" && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {record.status === "approved" && (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          <Badge
                            variant={
                              record.status === "taken"
                                ? "default"
                                : record.status === "approved"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {record.status === "taken" && "Tomadas"}
                            {record.status === "approved" && "Aprobadas"}
                            {record.status === "pending" && "Pendientes"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {record.comments || "-"}
                      </TableCell>
                      <TableCell>{record.year}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
