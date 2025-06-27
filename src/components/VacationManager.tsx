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
import { Plus, Edit, Trash2, Calendar, Info } from "lucide-react";
import { useVacations } from "@/hooks/use-vacations";

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

  const handleAddVacation = () => {
    if (newVacation.startDate && newVacation.endDate && newVacation.reason) {
      const days = calculateDays(newVacation.startDate, newVacation.endDate);
      const newId = Math.max(...vacations.map((v) => v.id)) + 1;

      const vacation = {
        id: newId,
        ...newVacation,
        days,
        requestDate: new Date().toISOString().split("T")[0],
      };

      setVacations([...vacations, vacation]);
      setNewVacation({
        startDate: "",
        endDate: "",
        reason: "",
        status: "pending",
      });
      setIsAddingVacation(false);
    }
  };

  const handleEditVacation = (vacation) => {
    setEditingVacation(vacation);
    setNewVacation({
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      reason: vacation.reason,
      status: vacation.status,
    });
    setIsAddingVacation(true);
  };

  const handleSaveEdit = () => {
    if (
      editingVacation &&
      newVacation.startDate &&
      newVacation.endDate &&
      newVacation.reason
    ) {
      const days = calculateDays(newVacation.startDate, newVacation.endDate);

      const updatedVacations = vacations.map((v) =>
        v.id === editingVacation.id ? { ...v, ...newVacation, days } : v,
      );

      setVacations(updatedVacations);
      setNewVacation({
        startDate: "",
        endDate: "",
        reason: "",
        status: "pending",
      });
      setEditingVacation(null);
      setIsAddingVacation(false);
    }
  };

  const handleDeleteVacation = (vacationId) => {
    if (
      confirm(
        "¿Estás seguro de que quieres eliminar esta solicitud de vacaciones?",
      )
    ) {
      setVacations(vacations.filter((v) => v.id !== vacationId));
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

  const availableDays = employee ? employee.vacationDays - totalDaysUsed : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Vacaciones - {employee?.name}
          </DialogTitle>
          <DialogDescription>
            Administra las solicitudes de vacaciones del empleado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vacation Balance */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {employee?.vacationDays || 0}
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {availableDays}
                </div>
                <div className="text-sm text-green-700">Días disponibles</div>
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
                <Button
                  onClick={editingVacation ? handleSaveEdit : handleAddVacation}
                >
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVacation(vacation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVacation(vacation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
