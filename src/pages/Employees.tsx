import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Plane,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VacationManager } from "@/components/VacationManager";

// Mock data with calculated vacation days
const employees = [
  {
    id: 1,
    name: "Juan Pérez",
    position: "Cocinero",
    whiteWage: 300000, // mensual
    informalWage: 150000, // mensual
    dailyWage: 15000, // calculado: (300000 + 150000) / 30
    presentismo: 25000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "active",
    startDate: "2023-01-15",
    vacationDays: 14, // Calculado automáticamente según antigüedad
    vacationsTaken: 12, // Días tomados este año
  },
  {
    id: 2,
    name: "María González",
    position: "Mesera",
    whiteWage: 240000,
    informalWage: 120000,
    dailyWage: 12000, // calculado: (240000 + 120000) / 30
    presentismo: 20000,
    losesPresentismo: true,
    presentismoComment: "Ausencias sin justificar",
    status: "active",
    startDate: "2023-03-20",
    vacationDays: 14,
    vacationsTaken: 7,
  },
  {
    id: 3,
    name: "Carlos López",
    position: "Cajero",
    whiteWage: 285000,
    informalWage: 120000,
    dailyWage: 13500, // calculado: (285000 + 120000) / 30
    presentismo: 22000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "active",
    startDate: "2018-11-10", // Más antigüedad para mostrar más vacaciones
    vacationDays: 21, // 5+ años de antigüedad
    vacationsTaken: 0,
  },
  {
    id: 4,
    name: "Ana Martínez",
    position: "Ayudante de Cocina",
    whiteWage: 210000,
    informalWage: 120000,
    dailyWage: 11000, // calculado: (210000 + 120000) / 30
    presentismo: 18000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "inactive",
    startDate: "2023-06-01",
    vacationDays: 14,
    vacationsTaken: 0,
  },
  {
    id: 5,
    name: "Luis Fernández",
    position: "Encargado",
    whiteWage: 525000, // 70% de 750,000
    informalWage: 225000, // 30% de 750,000
    dailyWage: 25000, // calculado: (525000 + 225000) / 30
    presentismo: 35000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "active",
    startDate: "2025-05-22",
    vacationDays: 14, // Nuevo empleado
    vacationsTaken: 0,
  },
];

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [losesPresentismo, setLosesPresentismo] = useState(false);
  const [isVacationManagerOpen, setIsVacationManagerOpen] = useState(false);
  const [selectedEmployeeForVacations, setSelectedEmployeeForVacations] =
    useState(null);

  // Calculate vacation days based on seniority
  const calculateVacationDays = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const years = Math.floor(
      (today.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );

    if (years < 5) return 14;
    if (years < 10) return 21;
    if (years < 20) return 28;
    return 35;
  };

  const openVacationManager = (employee: any) => {
    setSelectedEmployeeForVacations(employee);
    setIsVacationManagerOpen(true);
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Gestión de Empleados</h1>
            <p className="text-muted-foreground">
              Administra el personal del bar de tapas
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Completa la información del nuevo empleado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" placeholder="Ej: Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Puesto</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar puesto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cocinero">Cocinero</SelectItem>
                    <SelectItem value="mesero">Mesero/a</SelectItem>
                    <SelectItem value="cajero">Cajero/a</SelectItem>
                    <SelectItem value="ayudante">Ayudante de Cocina</SelectItem>
                    <SelectItem value="manager">Encargado/a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whiteWage">Sueldo en Blanco (mensual)</Label>
                  <Input id="whiteWage" type="number" placeholder="300000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="informalWage">
                    Sueldo Informal (mensual)
                  </Label>
                  <Input id="informalWage" type="number" placeholder="150000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="presentismo">
                  Presentismo (no remunerativo)
                </Label>
                <Input id="presentismo" type="number" placeholder="25000" />
                <p className="text-xs text-muted-foreground">
                  Este monto no se incluye en el cálculo del sueldo diario
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Ingreso</Label>
                <Input id="startDate" type="date" />
              </div>

              {/* Calculation Preview */}
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">
                  Sueldo Diario Calculado
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Se calcula como: (Sueldo en Blanco + Sueldo Informal) ÷ 30
                </p>
                <div className="text-lg font-semibold mt-2">
                  {/* This would be calculated dynamically in a real implementation */}
                  $15,000 por día
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsAddDialogOpen(false)}
                  className="w-full"
                >
                  Guardar Empleado
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Empleado</DialogTitle>
              <DialogDescription>
                Modifica la información de {editingEmployee?.name}
              </DialogDescription>
            </DialogHeader>
            {editingEmployee && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Nombre Completo</Label>
                  <Input id="editName" defaultValue={editingEmployee.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPosition">Puesto</Label>
                  <Select defaultValue={editingEmployee.position.toLowerCase()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cocinero">Cocinero</SelectItem>
                      <SelectItem value="mesero">Mesero/a</SelectItem>
                      <SelectItem value="cajero">Cajero/a</SelectItem>
                      <SelectItem value="ayudante">
                        Ayudante de Cocina
                      </SelectItem>
                      <SelectItem value="manager">Encargado/a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editWhiteWage">
                      Sueldo en Blanco (mensual)
                    </Label>
                    <Input
                      id="editWhiteWage"
                      type="number"
                      defaultValue={editingEmployee.whiteWage}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editInformalWage">
                      Sueldo Informal (mensual)
                    </Label>
                    <Input
                      id="editInformalWage"
                      type="number"
                      defaultValue={editingEmployee.informalWage}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPresentismo">
                    Presentismo (no remunerativo)
                  </Label>
                  <Input
                    id="editPresentismo"
                    type="number"
                    defaultValue={editingEmployee.presentismo}
                  />
                </div>

                {/* Presentismo Loss Section - Only in Edit */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">
                    Estado del Presentismo
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="editLosesPresentismo">
                      ¿Pierde el presentismo?
                    </Label>
                    <Select
                      value={losesPresentismo ? "si" : "no"}
                      onValueChange={(value) =>
                        setLosesPresentismo(value === "si")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">
                          No - Mantiene presentismo
                        </SelectItem>
                        <SelectItem value="si">
                          Sí - Pierde presentismo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {losesPresentismo && (
                    <div className="space-y-2">
                      <Label htmlFor="editPresentismoComment">
                        Motivo de pérdida de presentismo
                      </Label>
                      <Input
                        id="editPresentismoComment"
                        placeholder="Ej: Ausencias sin justificar"
                        defaultValue={editingEmployee.presentismoComment}
                      />
                      <p className="text-xs text-muted-foreground">
                        Se registrará la fecha y motivo de la pérdida
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Fecha de Ingreso</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    defaultValue={editingEmployee.startDate}
                  />
                </div>

                {/* Calculation Preview */}
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">
                    Sueldo Diario Calculado
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se calcula como: (Sueldo en Blanco + Sueldo Informal) ÷ 30
                  </p>
                  <div className="text-lg font-semibold mt-2">
                    {formatCurrency(editingEmployee.dailyWage)} por día
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingEmployee(null);
                    }}
                    className="w-full"
                  >
                    Guardar Cambios
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingEmployee(null);
                    }}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              {employees.filter((e) => e.status === "active").length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gasto Mensual Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                employees
                  .filter((e) => e.status === "active")
                  .reduce(
                    (sum, e) =>
                      sum +
                      e.whiteWage +
                      e.informalWage +
                      (e.losesPresentismo ? 0 : e.presentismo),
                    0,
                  ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Incluye presentismo vigente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Días de Vacaciones
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees
                .filter((e) => e.status === "active")
                .reduce(
                  (sum, e) => sum + (e.vacationDays - e.vacationsTaken),
                  0,
                )}
            </div>
            <p className="text-xs text-muted-foreground">
              Días disponibles totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sueldo Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                Math.round(
                  employees
                    .filter((e) => e.status === "active")
                    .reduce((sum, e) => sum + e.dailyWage, 0) /
                    employees.filter((e) => e.status === "active").length,
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Por día por empleado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            Gestiona la información de todos los empleados y sus vacaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Sueldo Diario</TableHead>
                <TableHead>Mensual Blanco</TableHead>
                <TableHead>Mensual Informal</TableHead>
                <TableHead>Presentismo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vacaciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell className="font-medium text-primary">
                    {formatCurrency(employee.dailyWage)}
                    <div className="text-xs text-muted-foreground">
                      Calculado
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(employee.whiteWage)}</TableCell>
                  <TableCell>{formatCurrency(employee.informalWage)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{formatCurrency(employee.presentismo)}</div>
                      {employee.losesPresentismo ? (
                        <Badge variant="destructive" className="text-xs">
                          Perdido
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          Vigente
                        </Badge>
                      )}
                      {employee.losesPresentismo &&
                        employee.presentismoComment && (
                          <div className="text-xs text-muted-foreground max-w-32 truncate">
                            {employee.presentismoComment}
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        employee.status === "active" ? "default" : "secondary"
                      }
                    >
                      {employee.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          {employee.vacationDays} anuales
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {employee.vacationsTaken} tomados
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {employee.vacationDays - employee.vacationsTaken}{" "}
                          disponibles
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openVacationManager(employee)}
                        className="h-6 text-xs"
                      >
                        <Plane className="h-3 w-3 mr-1" />
                        Gestionar
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEmployee(employee);
                          setLosesPresentismo(employee.losesPresentismo);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vacation Manager */}
      {selectedEmployeeForVacations && (
        <VacationManager
          employee={selectedEmployeeForVacations}
          isOpen={isVacationManagerOpen}
          onClose={() => {
            setIsVacationManagerOpen(false);
            setSelectedEmployeeForVacations(null);
          }}
        />
      )}
    </div>
  );
};

export default Employees;
