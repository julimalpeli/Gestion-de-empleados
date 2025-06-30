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
  FileText,
  Info,
  UserCheck,
  UserX,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PermissionGate from "@/components/PermissionGate";
import usePermissions from "@/hooks/use-permissions";
import VacationManager from "@/components/VacationManager";
import { useEmployees } from "@/hooks/use-employees";
import { useUsers } from "@/hooks/use-users";

// Ya no usamos mock data - ahora viene de Supabase
const mockEmployees = [
  {
    id: 1,
    name: "Juan Pérez",
    position: "Cocinero",
    whiteWage: 300000,
    informalWage: 150000,
    dailyWage: 15000,
    presentismo: 25000,
    losesPresentismo: false,
    status: "active",
    startDate: "2023-01-15", // ~2 años -> 14 días
    vacationDays: 14,
    vacationsTaken: 5,
  },
  {
    id: 2,
    name: "María González",
    position: "Mesera",
    whiteWage: 240000,
    informalWage: 120000,
    dailyWage: 12000,
    presentismo: 20000,
    losesPresentismo: true,
    status: "active",
    startDate: "2019-03-20", // ~5.7 años -> 21 días
    vacationDays: 21,
    vacationsTaken: 7,
  },
  {
    id: 3,
    name: "Carlos López",
    position: "Cajero",
    whiteWage: 285000,
    informalWage: 120000,
    dailyWage: 13500,
    presentismo: 22000,
    losesPresentismo: false,
    status: "active",
    startDate: "2012-11-10", // ~12 años -> 28 días
    vacationDays: 28,
    vacationsTaken: 8,
  },
  {
    id: 4,
    name: "Ana Martínez",
    position: "Ayudante de Cocina",
    whiteWage: 210000,
    informalWage: 120000,
    dailyWage: 11000,
    presentismo: 18000,
    losesPresentismo: false,
    status: "inactive",
    startDate: "2023-06-01", // ~1.5 años -> 14 días
    vacationDays: 14,
    vacationsTaken: 0,
  },
  {
    id: 5,
    name: "Luis Fernández",
    position: "Encargado",
    whiteWage: 525000,
    informalWage: 225000,
    dailyWage: 25000,
    presentismo: 35000,
    losesPresentismo: false,
    status: "active",
    startDate: "2000-05-22", // ~24 años -> 35 días
    vacationDays: 35,
    vacationsTaken: 10,
  },
];

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // Default to active
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isVacationManagerOpen, setIsVacationManagerOpen] = useState(false);
  const [selectedEmployeeForVacations, setSelectedEmployeeForVacations] =
    useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    dni: "",
    position: "",
    whiteWage: "",
    informalWage: "",
    presentismo: "",
    startDate: "",
  });

  // Usar hook de Supabase para empleados
  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees();

  // Usar hook para gestión de usuarios
  const { createEmployeeUser } = useUsers();

  const { canViewModule, canCreateInModule, canEditModule, canDeleteInModule } =
    usePermissions();

  const handleAddEmployee = async () => {
    try {
      // Validaciones básicas
      if (!newEmployee.name.trim()) {
        alert("El nombre es requerido");
        return;
      }
      if (!newEmployee.dni.trim()) {
        alert("El DNI es requerido");
        return;
      }
      if (!/^\d{1,8}$/.test(newEmployee.dni.trim())) {
        alert("El DNI debe ser un número de máximo 8 dígitos");
        return;
      }
      if (!newEmployee.position.trim()) {
        alert("El puesto es requerido");
        return;
      }
      if (!newEmployee.startDate) {
        alert("La fecha de ingreso es requerida");
        return;
      }

      const employeeData = {
        name: newEmployee.name.trim(),
        dni: newEmployee.dni.trim(),
        position: newEmployee.position.trim(),
        whiteWage: parseFloat(newEmployee.whiteWage) || 0,
        informalWage: parseFloat(newEmployee.informalWage) || 0,
        presentismo: parseFloat(newEmployee.presentismo) || 0,
        startDate: newEmployee.startDate,
      };

      console.log("Creating employee with data:", employeeData);

      const newEmployeeRecord = await createEmployee(employeeData);

      // Crear usuario automáticamente para acceso al portal
      try {
        await createEmployeeUser({
          id: newEmployeeRecord.id,
          name: newEmployeeRecord.name,
          dni: newEmployeeRecord.dni,
        });
        console.log("✅ Usuario creado automáticamente para empleado");
      } catch (userError) {
        console.error("❌ Error creando usuario:", userError);
        // No fallar la creación del empleado por error de usuario
        setSuccessMessage(
          "Empleado creado exitosamente, pero hubo un error al crear el usuario. Contacte al administrador.",
        );
      }

      if (!userError) {
        setSuccessMessage(
          `Empleado ${newEmployeeRecord.name} creado exitosamente con usuario DNI: ${newEmployeeRecord.dni}`,
        );
      }

      setIsAddDialogOpen(false);
      setNewEmployee({
        name: "",
        dni: "",
        position: "",
        whiteWage: "",
        informalWage: "",
        presentismo: "",
        startDate: "",
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      alert(
        `Error al crear empleado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;
    try {
      await updateEmployee(editingEmployee.id, {
        name: editingEmployee.name,
        dni: editingEmployee.dni,
        position: editingEmployee.position,
        whiteWage: editingEmployee.whiteWage,
        informalWage: editingEmployee.informalWage,
        presentismo: editingEmployee.presentismo,
        startDate: editingEmployee.startDate,
      });
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Error al actualizar empleado");
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      const newStatus = employee.status === "active" ? "inactive" : "active";
      await updateEmployee(employee.id, { status: newStatus });
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Error al cambiar estado del empleado");
    }
  };

  const openVacationManager = (employee) => {
    setSelectedEmployeeForVacations(employee);
    setIsVacationManagerOpen(true);
  };

  // Función correcta para calcular vacaciones
  const calculateVacationDays = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();

    // Calcular años de antigüedad
    const yearsDiff = today.getFullYear() - start.getFullYear();
    const monthsDiff = today.getMonth() - start.getMonth();
    const daysDiff = today.getDate() - start.getDate();

    let years = yearsDiff;
    if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
      years--;
    }

    // Determinar días de vacaciones según antigüedad
    let vacationDays = 14; // Por defecto hasta 5 años
    if (years >= 20) {
      vacationDays = 35;
    } else if (years >= 10) {
      vacationDays = 28;
    } else if (years >= 5) {
      vacationDays = 21;
    }

    return {
      years,
      vacationDays,
      startDate: start.toLocaleDateString("es-AR"),
    };
  };

  const showEmployeeInfo = (employee) => {
    const vacationInfo = calculateVacationDays(employee.startDate);
    alert(`Información de ${employee.name}:

DNI: ${employee.dni || "No registrado"}
Fecha de Ingreso: ${vacationInfo.startDate}
Antigüedad: ${vacationInfo.years} años
Días de Vacaciones: ${vacationInfo.vacationDays} días (según antigüedad)
Puesto: ${employee.position}
Estado: ${employee.status === "active" ? "Activo" : "Inactivo"}
Sueldo Mensual Total: ${formatCurrency(employee.whiteWage + employee.informalWage)}
Presentismo: ${formatCurrency(employee.presentismo)} ${employee.losesPresentismo ? "(Perdido)" : "(Vigente)"}
`);
  };

  // Logging temporal para diagnóstico
  console.log("🔍 Diagnóstico Employees:", {
    employees,
    employeesLength: employees.length,
    loading,
    error,
    statusFilter,
    searchTerm,
  });

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  console.log("🔍 Filtered employees:", filteredEmployees);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Manejo de loading y error
  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p>Cargando empleados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

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

        <div className="flex gap-2">
          <PermissionGate module="employees" action="create">
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
                    <Label htmlFor="name">
                      Nombre Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ej: Juan Pérez"
                      value={newEmployee.name}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dni">
                      DNI (sin puntos) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dni"
                      type="text"
                      placeholder="Ej: 12345678"
                      maxLength={8}
                      value={newEmployee.dni}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // Solo números
                        setNewEmployee({ ...newEmployee, dni: value });
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">
                      Puesto <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newEmployee.position}
                      onValueChange={(value) =>
                        setNewEmployee({ ...newEmployee, position: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar puesto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cocinero">Cocinero</SelectItem>
                        <SelectItem value="jefe_cocina">
                          Jefe de Cocina
                        </SelectItem>
                        <SelectItem value="ayudante">
                          Ayudante de Cocina
                        </SelectItem>
                        <SelectItem value="mesero">Mesero/a</SelectItem>
                        <SelectItem value="jefe_salon">
                          Jefe de Salón
                        </SelectItem>
                        <SelectItem value="cajero">Cajero/a</SelectItem>
                        <SelectItem value="limpieza">
                          Tareas de Limpieza
                        </SelectItem>
                        <SelectItem value="manager">Encargado/a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whiteWage">
                        Sueldo en Blanco (mensual)
                      </Label>
                      <Input
                        id="whiteWage"
                        type="number"
                        placeholder="300000"
                        value={newEmployee.whiteWage}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            whiteWage: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="informalWage">
                        Sueldo Informal (mensual)
                      </Label>
                      <Input
                        id="informalWage"
                        type="number"
                        placeholder="150000"
                        value={newEmployee.informalWage}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            informalWage: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presentismo">
                      Presentismo (no remunerativo)
                    </Label>
                    <Input
                      id="presentismo"
                      type="number"
                      placeholder="25000"
                      value={newEmployee.presentismo}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          presentismo: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Este monto no se incluye en el cálculo del sueldo diario
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Fecha de Ingreso <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newEmployee.startDate}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          startDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Calculation Preview */}
                  {newEmployee.whiteWage && newEmployee.informalWage && (
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-sm font-medium">
                        Sueldo Diario Calculado
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Se calcula como: (Sueldo en Blanco + Sueldo Informal) ÷
                        30
                      </p>
                      <div className="text-lg font-semibold mt-2">
                        {formatCurrency(
                          (parseInt(newEmployee.whiteWage) +
                            parseInt(newEmployee.informalWage)) /
                            30,
                        )}{" "}
                        por día
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddEmployee} className="w-full">
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
          </PermissionGate>
        </div>

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
                  <Input
                    id="editName"
                    defaultValue={editingEmployee.name}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDni">DNI (sin puntos)</Label>
                  <Input
                    id="editDni"
                    type="text"
                    maxLength={8}
                    defaultValue={editingEmployee.dni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // Solo números
                      setEditingEmployee({
                        ...editingEmployee,
                        dni: value,
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editPosition">Puesto</Label>
                  <Select
                    defaultValue={editingEmployee.position.toLowerCase()}
                    onValueChange={(value) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        position: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cocinero">Cocinero</SelectItem>
                      <SelectItem value="jefe_cocina">
                        Jefe de Cocina
                      </SelectItem>
                      <SelectItem value="ayudante">
                        Ayudante de Cocina
                      </SelectItem>
                      <SelectItem value="mesero">Mesero/a</SelectItem>
                      <SelectItem value="jefe_salon">Jefe de Salón</SelectItem>
                      <SelectItem value="cajero">Cajero/a</SelectItem>
                      <SelectItem value="limpieza">
                        Tareas de Limpieza
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
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          whiteWage: parseInt(e.target.value),
                        })
                      }
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
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          informalWage: parseInt(e.target.value),
                        })
                      }
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
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        presentismo: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Fecha de Ingreso</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    defaultValue={editingEmployee.startDate}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        startDate: e.target.value,
                      })
                    }
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
                    {formatCurrency(
                      (editingEmployee.whiteWage +
                        editingEmployee.informalWage) /
                        30,
                    )}{" "}
                    por día
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveEdit} className="w-full">
                    Guardar Cambios
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
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
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Estado:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
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
                <TableHead>DNI</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Fecha de Ingreso</TableHead>
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
                  <TableCell className="font-mono text-sm">
                    {employee.dni || "No registrado"}
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    {new Date(employee.startDate).toLocaleDateString("es-AR")}
                  </TableCell>
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
                      <div className="font-medium">
                        {formatCurrency(employee.presentismo)}
                      </div>
                      <Badge
                        variant={
                          employee.losesPresentismo ? "destructive" : "default"
                        }
                        className="text-xs"
                      >
                        {employee.losesPresentismo ? "Perdido" : "Vigente"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        employee.status === "active" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {employee.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const vacInfo = calculateVacationDays(employee.startDate);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">
                              {vacInfo.vacationDays} anuales
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({vacInfo.years} años)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {employee.vacationsTaken} tomados
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {vacInfo.vacationDays - employee.vacationsTaken}{" "}
                              disponibles
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => openVacationManager(employee)}
                          >
                            <Plane className="h-3 w-3 mr-1" />
                            Gestionar
                          </Button>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Info Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showEmployeeInfo(employee)}
                        title="Ver información completa del empleado"
                      >
                        <Info className="h-4 w-4" />
                      </Button>

                      {/* Edit Button */}
                      <PermissionGate module="employees" action="edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                          title="Editar datos del empleado"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGate>

                      {/* Toggle Status Button */}
                      <PermissionGate module="employees" action="edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(employee)}
                          title={
                            employee.status === "active"
                              ? "Desactivar empleado"
                              : "Activar empleado"
                          }
                        >
                          {employee.status === "active" ? (
                            <UserX className="h-4 w-4 text-red-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </PermissionGate>

                      {/* Delete Button */}
                      <PermissionGate module="employees" action="delete">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Eliminar empleado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
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
