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
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Info,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { useVacations } from "@/hooks/use-vacations";
import { employeeService } from "@/services/employeeService";
import { usePermissions } from "@/hooks/use-permissions";

// Mock vacation data - COMENTADO porque ahora usamos Supabase
const mockVacations = [
  {
    id: 1,
    startDate: "2024-07-15",
    endDate: "2024-07-19",
    days: 5,
    status: "approved",
    reason: "Vacaciones familiares",
    requestDate: "2024-06-15",
  },
  {
    id: 2,
    startDate: "2024-03-11",
    endDate: "2024-03-11",
    days: 1,
    status: "approved",
    reason: "Día personal",
    requestDate: "2024-03-01",
  },
  {
    id: 3,
    startDate: "2024-12-23",
    endDate: "2024-12-27",
    days: 5,
    status: "pending",
    reason: "Navidad con familia",
    requestDate: "2024-11-15",
  },
];

interface VacationManagerProps {
  employee: any;
  isOpen: boolean;
  onClose: () => void;
}

const VacationManager = ({
  employee,
  isOpen,
  onClose,
}: VacationManagerProps) => {
  const [isAddingVacation, setIsAddingVacation] = useState(false);
  const [editingVacation, setEditingVacation] = useState(null);
  const [newVacation, setNewVacation] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Usar hook de Supabase para vacaciones
  const {
    vacations,
    loading,
    error,
    createVacation,
    updateVacation,
    deleteVacation,
    processVacation,
  } = useVacations(employee?.id);

  const { hasPermission } = usePermissions();
  const canApproveVacations = hasPermission("vacations", "approve");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleAddVacation = async () => {
    if (newVacation.startDate && newVacation.endDate && newVacation.reason) {
      try {
        const days = calculateDays(newVacation.startDate, newVacation.endDate);

        if (editingVacation) {
          // Actualizar vacación existente
          await updateVacation(editingVacation.id, {
            startDate: newVacation.startDate,
            endDate: newVacation.endDate,
            reason: newVacation.reason,
            days,
          });
        } else {
          // Crear nueva vacación
          await createVacation({
            employeeId: employee.id,
            startDate: newVacation.startDate,
            endDate: newVacation.endDate,
            reason: newVacation.reason,
            days,
          });
        }

        setNewVacation({
          startDate: "",
          endDate: "",
          reason: "",
        });
        setIsAddingVacation(false);
        setEditingVacation(null);
      } catch (error) {
        console.error("Error saving vacation:", error);
        alert("Error al guardar vacación");
      }
    }
  };

  const handleEditVacation = (vacation) => {
    setEditingVacation(vacation);
    setNewVacation({
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      reason: vacation.reason,
    });
    setIsAddingVacation(true);
  };

  const handleDeleteVacation = async (vacationId) => {
    if (
      confirm(
        "¿Estás seguro de que quieres eliminar esta solicitud de vacaciones?",
      )
    ) {
      try {
        await deleteVacation(vacationId);
      } catch (error) {
        console.error("Error deleting vacation:", error);
        alert("Error al eliminar vacación");
      }
    }
  };

  const handleApproveVacation = async (vacationId) => {
    if (confirm("¿Aprobar esta solicitud de vacaciones?")) {
      try {
        await processVacation(vacationId, "approved");
      } catch (error) {
        console.error("Error approving vacation:", error);
        alert("Error al aprobar vacación");
      }
    }
  };

  const handleRejectVacation = async (vacationId) => {
    const reason = prompt("Motivo de rechazo (opcional):");
    try {
      await processVacation(vacationId, "rejected", reason || undefined);
    } catch (error) {
      console.error("Error rejecting vacation:", error);
      alert("Error al rechazar vacación");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobado";
      case "pending":
        return "Pendiente";
      case "rejected":
        return "Rechazado";
      default:
        return status;
    }
  };

  const totalDaysUsed = vacations
    .filter((v) => v.status === "approved")
    .reduce((sum, v) => sum + v.days, 0);

  // Calcular elegibilidad para vacaciones (6 meses de antigüedad)
  const vacationInfo = employee
    ? employeeService.calculateVacationDays(employee.startDate)
    : null;
  const isEligibleForVacations = vacationInfo?.eligibleForVacations || false;
  const monthsOfService = vacationInfo?.totalMonths || 0;

  const availableDays = employee
    ? (isEligibleForVacations ? employee.vacationDays : 0) - totalDaysUsed
    : 0;

  // Mostrar loading si está cargando
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cargando vacaciones...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <p>Cargando datos de vacaciones...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Vacaciones - {employee?.name} (DNI:{" "}
            {employee?.dni || "N/A"})
          </DialogTitle>
          <DialogDescription>
            Administra las solicitudes de vacaciones del empleado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vacation Balance */}
          {!isEligibleForVacations && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Vacaciones no disponibles</p>
                  <p className="text-sm">
                    El empleado necesita 6 meses de antigüedad para acceder a
                    vacaciones. Tiempo actual: {monthsOfService} meses.
                  </p>
                </div>
              </div>
            </div>
          )}
          {!isEligibleForVacations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-5 w-5" />
                <div>
                  <p className="font-medium">Vacaciones por adelantado</p>
                  <p className="text-sm">
                    Las vacaciones aprobadas serán deuda hasta cumplir 6 meses.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {isEligibleForVacations ? employee?.vacationDays || 0 : 0}
                </div>
                <div className="text-sm text-blue-700">Días anuales</div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-900">
                  {totalDaysUsed}
                </div>
                <div className="text-sm text-orange-700">Días tomados</div>
              </div>
            </div>
            <div
              className={`border rounded-lg p-4 ${
                availableDays >= 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    availableDays >= 0 ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {availableDays}
                </div>
                <div
                  className={`text-sm ${
                    availableDays >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {availableDays >= 0 ? "Días disponibles" : "Días adeudados"}
                </div>
              </div>
            </div>
          </div>

          {/* Add Vacation Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Solicitudes de Vacaciones</h3>
            <Button onClick={() => setIsAddingVacation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </div>

          {/* Add/Edit Vacation Form */}
          {isAddingVacation && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="text-md font-medium mb-4">
                {editingVacation
                  ? "Editar Solicitud"
                  : "Nueva Solicitud de Vacaciones"}
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newVacation.startDate}
                    onChange={(e) =>
                      setNewVacation({
                        ...newVacation,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newVacation.endDate}
                    onChange={(e) =>
                      setNewVacation({
                        ...newVacation,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Input
                    id="reason"
                    placeholder="Ej: Vacaciones familiares"
                    value={newVacation.reason}
                    onChange={(e) =>
                      setNewVacation({ ...newVacation, reason: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={newVacation.status}
                    onValueChange={(value) =>
                      setNewVacation({ ...newVacation, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newVacation.startDate && newVacation.endDate && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Días solicitados:{" "}
                      {calculateDays(
                        newVacation.startDate,
                        newVacation.endDate,
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddVacation}>
                  {editingVacation ? "Guardar Cambios" : "Agregar Solicitud"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingVacation(false);
                    setEditingVacation(null);
                    setNewVacation({
                      startDate: "",
                      endDate: "",
                      reason: "",
                      status: "pending",
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Vacations Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Solicitado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vacations.map((vacation) => (
                  <TableRow key={vacation.id}>
                    <TableCell>{formatDate(vacation.startDate)}</TableCell>
                    <TableCell>{formatDate(vacation.endDate)}</TableCell>
                    <TableCell className="font-medium">
                      {vacation.days} días
                    </TableCell>
                    <TableCell>{vacation.reason}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(vacation.status)}>
                        {getStatusText(vacation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(vacation.requestDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {vacation.status === "pending" &&
                          canApproveVacations && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleApproveVacation(vacation.id)
                                }
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRejectVacation(vacation.id)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        {vacation.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVacation(vacation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVacation(vacation.id)}
                          disabled={vacation.status === "approved"}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VacationManager;
