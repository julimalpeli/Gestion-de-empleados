import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInputSimple as CurrencyInput } from "@/components/ui/currency-input-simple";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  FolderOpen,
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
import DocumentManager from "@/components/DocumentManager";
import SalaryHistoryTable from "@/components/SalaryHistoryTable";
import SalaryChangeDialog from "@/components/SalaryChangeDialog";
import { useEmployees } from "@/hooks/use-employees";
import { useUsers } from "@/hooks/use-users";
import { useSalaryHistory } from "@/hooks/use-salary-history";
import { employeeService } from "@/services/employeeService";

const Employees = () => {
  console.log("🏢 Employees component starting to render...");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isVacationManagerOpen, setIsVacationManagerOpen] = useState(false);
  const [selectedEmployeeForVacations, setSelectedEmployeeForVacations] =
    useState(null);
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [selectedEmployeeForDocuments, setSelectedEmployeeForDocuments] =
    useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [salaryChangeDialogOpen, setSalaryChangeDialogOpen] = useState(false);
  const [pendingSalaryChanges, setPendingSalaryChanges] = useState(null);
  const [originalEmployee, setOriginalEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    dni: "",
    documentType: "dni",
    position: "",
    whiteWage: "",
    informalWage: "",
    presentismo: "",
    startDate: "",
    address: "",
    email: "",
  });

  console.log("🔍 Employees component: Loading hooks...");

  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees();

  // Debug logging
  console.log("🔍 Employees page debug:");
  console.log("- Loading:", loading);
  console.log("- Error:", error);
  console.log("- Employees count:", employees.length);
  console.log("- Employees data:", employees);

  const { createEmployeeUser, updateUserEmail } = useUsers();

  const { updateEmployeeSalaryWithHistory } = useSalaryHistory();

  const { canViewModule, canCreateInModule, canEditModule, canDeleteInModule } =
    usePermissions();

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
  };

  // Detectar cambios salariales
  const detectSalaryChanges = (original, edited) => {
    const changes = [];

    if (
      parseFloat(original.whiteWage || 0) !== parseFloat(edited.whiteWage || 0)
    ) {
      changes.push({
        field: "whiteWage",
        oldValue: parseFloat(original.whiteWage || 0),
        newValue: parseFloat(edited.whiteWage || 0),
        label: "Sueldo Blanco",
      });
    }

    if (
      parseFloat(original.informalWage || 0) !==
      parseFloat(edited.informalWage || 0)
    ) {
      changes.push({
        field: "informalWage",
        oldValue: parseFloat(original.informalWage || 0),
        newValue: parseFloat(edited.informalWage || 0),
        label: "Sueldo Informal",
      });
    }

    if (
      parseFloat(original.presentismo || 0) !==
      parseFloat(edited.presentismo || 0)
    ) {
      changes.push({
        field: "presentismo",
        oldValue: parseFloat(original.presentismo || 0),
        newValue: parseFloat(edited.presentismo || 0),
        label: "Presentismo",
      });
    }

    return changes;
  };

  const syncEmployeeUserEmail = async (employeeId, email) => {
    try {
      await updateUserEmail(employeeId, email);
    } catch (error) {
      console.error("Failed to sync user email:", error);
    }
  };

  const handleViewEmployee = (employee) => {
    setViewingEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleAddEmployee = async () => {
    try {
      if (!newEmployee.name.trim()) {
        alert("El nombre es requerido");
        return;
      }
      if (!newEmployee.dni.trim()) {
        alert("El DNI es requerido");
        return;
      }
      if (
        newEmployee.documentType === "dni" &&
        !/^\d{1,8}$/.test(newEmployee.dni.trim())
      ) {
        alert("El DNI debe ser un número de máximo 8 dígitos");
        return;
      }
      if (
        newEmployee.documentType !== "dni" &&
        newEmployee.dni.trim().length < 3
      ) {
        alert("El número de documento debe tener al menos 3 caracteres");
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
      if (
        newEmployee.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email.trim())
      ) {
        alert("Por favor ingresa un email válido");
        return;
      }

      const employeeData = {
        name: newEmployee.name.trim(),
        dni: newEmployee.dni.trim(),
        documentType: newEmployee.documentType,
        position: newEmployee.position.trim(),
        whiteWage: parseFloat(newEmployee.whiteWage) || 0,
        informalWage: parseFloat(newEmployee.informalWage) || 0,
        presentismo: parseFloat(newEmployee.presentismo) || 0,
        startDate: newEmployee.startDate,
        address: newEmployee.address.trim(),
        email: newEmployee.email.trim(),
      };

      const newEmployeeRecord = await createEmployee(employeeData);

      let userCreated = false;
      try {
        await createEmployeeUser({
          id: newEmployeeRecord.id,
          name: newEmployeeRecord.name,
          dni: newEmployeeRecord.dni,
          email: newEmployeeRecord.email,
        });
        userCreated = true;
      } catch (userError) {
        console.error("Error creando usuario:", userError);
      }

      if (userCreated) {
        showSuccessMessage(
          `Empleado ${newEmployeeRecord.name} creado exitosamente con usuario DNI: ${newEmployeeRecord.dni}`,
        );
      } else {
        showSuccessMessage(
          "Empleado creado exitosamente, pero hubo un error al crear el usuario. Contacte al administrador.",
        );
      }

      setIsAddDialogOpen(false);
      setNewEmployee({
        name: "",
        dni: "",
        documentType: "dni",
        position: "",
        whiteWage: "",
        informalWage: "",
        presentismo: "",
        startDate: "",
        address: "",
        email: "",
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      alert(
        `Error al crear empleado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  };

  const handleEditEmployee = (employee) => {
    // Guardar valores originales para detectar cambios salariales
    setOriginalEmployee({
      whiteWage: employee.whiteWage?.toString() || "",
      informalWage: employee.informalWage?.toString() || "",
      presentismo: employee.presentismo?.toString() || "",
    });

    setEditingEmployee({
      ...employee,
      documentType: employee.documentType || "dni",
      whiteWage: employee.whiteWage?.toString() || "",
      informalWage: employee.informalWage?.toString() || "",
      presentismo: employee.presentismo?.toString() || "",
      address: employee.address || "",
      email: employee.email || "",
      originalEmail: employee.email || "", // Store original email for comparison
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    try {
      if (!editingEmployee.name.trim()) {
        alert("El nombre es requerido");
        return;
      }
      if (!editingEmployee.dni.trim()) {
        alert("El DNI es requerido");
        return;
      }
      if (
        editingEmployee.documentType === "dni" &&
        !/^\d{1,8}$/.test(editingEmployee.dni.trim())
      ) {
        alert("El DNI debe ser un número de máximo 8 dígitos");
        return;
      }
      if (
        editingEmployee.documentType !== "dni" &&
        editingEmployee.dni.trim().length < 3
      ) {
        alert("El número de documento debe tener al menos 3 caracteres");
        return;
      }
      if (!editingEmployee.position.trim()) {
        alert("El puesto es requerido");
        return;
      }
      if (!editingEmployee.startDate) {
        alert("La fecha de ingreso es requerida");
        return;
      }
      if (
        editingEmployee.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingEmployee.email.trim())
      ) {
        alert("Por favor ingresa un email válido");
        return;
      }

      // Detectar cambios salariales
      const salaryChanges = detectSalaryChanges(
        originalEmployee,
        editingEmployee,
      );

      if (salaryChanges.length > 0) {
        // Hay cambios salariales, mostrar modal de confirmación
        setPendingSalaryChanges({
          employeeData: {
            name: editingEmployee.name.trim(),
            dni: editingEmployee.dni.trim(),
            documentType: editingEmployee.documentType,
            position: editingEmployee.position.trim(),
            whiteWage: parseFloat(editingEmployee.whiteWage) || 0,
            informalWage: parseFloat(editingEmployee.informalWage) || 0,
            presentismo: parseFloat(editingEmployee.presentismo) || 0,
            startDate: editingEmployee.startDate,
            address: editingEmployee.address.trim(),
            email: editingEmployee.email.trim(),
          },
          changes: salaryChanges,
        });
        setSalaryChangeDialogOpen(true);
      } else {
        // No hay cambios salariales, actualizar normalmente
        const employeeData = {
          name: editingEmployee.name.trim(),
          dni: editingEmployee.dni.trim(),
          documentType: editingEmployee.documentType,
          position: editingEmployee.position.trim(),
          whiteWage: parseFloat(editingEmployee.whiteWage) || 0,
          informalWage: parseFloat(editingEmployee.informalWage) || 0,
          presentismo: parseFloat(editingEmployee.presentismo) || 0,
          startDate: editingEmployee.startDate,
          address: editingEmployee.address.trim(),
          email: editingEmployee.email.trim(),
        };

        await updateEmployee(editingEmployee.id, employeeData);

        showSuccessMessage(
          `Empleado ${employeeData.name} actualizado exitosamente`,
        );
        setIsEditDialogOpen(false);
        setEditingEmployee(null);
        setOriginalEmployee(null);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      alert(
        `Error al actualizar empleado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      await deleteEmployee(employeeToDelete.id);
      showSuccessMessage(
        `Empleado ${employeeToDelete.name} eliminado exitosamente`,
      );
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);

      // Get the actual error message
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }

      alert(`Error al eliminar empleado: ${errorMessage}`);
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleStatusChange = async (employee, newStatus) => {
    try {
      await updateEmployee(employee.id, { status: newStatus });
      showSuccessMessage(
        `Estado de ${employee.name} cambiado a ${newStatus === "active" ? "activo" : "inactivo"}`,
      );
    } catch (error) {
      console.error("Error updating employee status:", error);
      alert(
        `Error al cambiar estado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDailySalary = (whiteWage, informalWage) => {
    const totalSalary = (whiteWage || 0) + (informalWage || 0);
    return totalSalary / 30;
  };

  const formatPosition = (position) => {
    const positions = {
      Cocinero: "Cocinero",
      "Jefe de Cocina": "Jefe de Cocina",
      "Ayudante de Cocina": "Ayudante de Cocina",
      "Mesero/a": "Mesero/a",
      "Jefe de Salón": "Jefe de Salón",
      "Cajero/a": "Cajero/a",
      "Tareas de Limpieza": "Tareas de Limpieza",
      "Encargado/a": "Encargado/a",
      Barra: "Barra",
      "Jefe de Barra": "Jefe de Barra",
      // Backward compatibility for old format
      cocinero: "Cocinero",
      jefe_cocina: "Jefe de Cocina",
      ayudante: "Ayudante de Cocina",
      mesero: "Mesero/a",
      jefe_salon: "Jefe de Salón",
      cajero: "Cajero/a",
      limpieza: "Tareas de Limpieza",
      barra: "Barra",
      jefe_barra: "Jefe de Barra",
      manager: "Encargado/a",
    };
    return positions[position] || position;
  };

  if (!canViewModule("employees")) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p>No tienes permisos para acceder a este módulo.</p>
        </div>
      </div>
    );
  }

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

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.dni &&
        employee.dni.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Gestión de Empleados</h1>
            <p className="text-muted-foreground">Administra el personal</p>
          </div>
        </div>

        <PermissionGate module="employees" action="create">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
                <DialogDescription>
                  Completa la información del nuevo empleado
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="documentType">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newEmployee.documentType}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, documentType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dni">DNI</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                      <SelectItem value="ce">Cédula de Extranjería</SelectItem>
                      <SelectItem value="ci">Cédula de Identidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">
                    Número de Documento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dni"
                    type="text"
                    placeholder={
                      newEmployee.documentType === "dni"
                        ? "Ej: 12345678"
                        : newEmployee.documentType === "passport"
                          ? "Ej: ABC123456"
                          : "Número de documento"
                    }
                    maxLength={newEmployee.documentType === "dni" ? 8 : 20}
                    value={newEmployee.dni}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (newEmployee.documentType === "dni") {
                        value = value.replace(/\D/g, "");
                      }
                      setNewEmployee({ ...newEmployee, dni: value });
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {newEmployee.documentType === "dni"
                      ? "Solo números, sin puntos ni espacios"
                      : newEmployee.documentType === "passport"
                        ? "Letras y números según formato del pasaporte"
                        : "Según formato del documento"}
                  </p>
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
                      <SelectItem value="Cocinero">Cocinero</SelectItem>
                      <SelectItem value="Jefe de Cocina">
                        Jefe de Cocina
                      </SelectItem>
                      <SelectItem value="Ayudante de Cocina">
                        Ayudante de Cocina
                      </SelectItem>
                      <SelectItem value="Mesero/a">Mesero/a</SelectItem>
                      <SelectItem value="Jefe de Salón">
                        Jefe de Salón
                      </SelectItem>
                      <SelectItem value="Cajero/a">Cajero/a</SelectItem>
                      <SelectItem value="Tareas de Limpieza">
                        Tareas de Limpieza
                      </SelectItem>
                      <SelectItem value="Encargado/a">Encargado/a</SelectItem>
                      <SelectItem value="Barra">Barra</SelectItem>
                      <SelectItem value="Jefe de Barra">
                        Jefe de Barra
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

                <div className="space-y-2">
                  <Label htmlFor="whiteWage">Sueldo en Blanco</Label>
                  <CurrencyInput
                    id="whiteWage"
                    placeholder="$ 0,00"
                    value={newEmployee.whiteWage}
                    onChange={(value) =>
                      setNewEmployee({
                        ...newEmployee,
                        whiteWage: value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="informalWage">Sueldo Informal</Label>
                  <CurrencyInput
                    id="informalWage"
                    placeholder="$ 0,00"
                    value={newEmployee.informalWage}
                    onChange={(value) =>
                      setNewEmployee({
                        ...newEmployee,
                        informalWage: value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentismo">Presentismo</Label>
                  <CurrencyInput
                    id="presentismo"
                    placeholder="$ 0,00"
                    value={newEmployee.presentismo}
                    onChange={(value) =>
                      setNewEmployee({
                        ...newEmployee,
                        presentismo: value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan.perez@ejemplo.com"
                    value={newEmployee.email}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Domicilio</Label>
                  <Input
                    id="address"
                    placeholder="Av. Corrientes 1234, CABA"
                    value={newEmployee.address}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Sueldo Diario Calculado</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="text-lg font-semibold">
                      {formatCurrency(
                        calculateDailySalary(
                          parseFloat(newEmployee.whiteWage) || 0,
                          parseFloat(newEmployee.informalWage) || 0,
                        ),
                      )}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      (Sueldo Blanco + Sueldo Informal) ÷ 30
                    </p>
                  </div>
                </div>
              </div>

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
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            Administra todos los empleados del bar de tapas (
            {filteredEmployees.length} empleados)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Solo activos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inactive">Solo inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead>Sueldo Diario</TableHead>
                  <TableHead>Mensual Blanco</TableHead>
                  <TableHead>Mensual Informal</TableHead>
                  <TableHead>Presentismo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {employee.dni || "No registrado"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {employee.documentType
                            ? employee.documentType.toUpperCase()
                            : "DNI"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatPosition(employee.position)}</TableCell>
                    <TableCell>
                      {employee.startDate
                        ? new Date(
                            employee.startDate + "T00:00:00",
                          ).toLocaleDateString("es-AR")
                        : "No registrada"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(
                        calculateDailySalary(
                          employee.whiteWage || 0,
                          employee.informalWage || 0,
                        ),
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(employee.whiteWage || 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(employee.informalWage || 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(employee.presentismo || 0)}
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEmployee(employee)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver información del empleado</p>
                          </TooltipContent>
                        </Tooltip>

                        <PermissionGate module="vacations" action="view">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployeeForVacations(employee);
                                  setIsVacationManagerOpen(true);
                                }}
                              >
                                <Plane className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Gestionar vacaciones</p>
                            </TooltipContent>
                          </Tooltip>
                        </PermissionGate>

                        <PermissionGate module="employees" action="view">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployeeForDocuments(employee);
                                  setIsDocumentManagerOpen(true);
                                }}
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Gestionar documentos</p>
                            </TooltipContent>
                          </Tooltip>
                        </PermissionGate>

                        <PermissionGate module="employees" action="edit">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar empleado</p>
                            </TooltipContent>
                          </Tooltip>
                        </PermissionGate>

                        <PermissionGate module="employees" action="edit">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(
                                    employee,
                                    employee.status === "active"
                                      ? "inactive"
                                      : "active",
                                  )
                                }
                              >
                                {employee.status === "active" ? (
                                  <UserX className="h-4 w-4 text-red-600" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {employee.status === "active"
                                  ? "Desactivar empleado"
                                  : "Activar empleado"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </PermissionGate>

                        {/* Delete button temporarily hidden */}
                        {false && (
                          <PermissionGate module="employees" action="delete">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEmployeeToDelete(employee);
                                setDeleteConfirmOpen(true);
                              }}
                              title="Eliminar empleado"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </PermissionGate>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>
              Modifica la información del empleado
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Nombre Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Ej: Juan Pérez"
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-documentType">
                  Tipo de Documento <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editingEmployee.documentType}
                  onValueChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      documentType: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dni">DNI</SelectItem>
                    <SelectItem value="passport">Pasaporte</SelectItem>
                    <SelectItem value="ce">Cédula de Extranjería</SelectItem>
                    <SelectItem value="ci">Cédula de Identidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dni">
                  Número de Documento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-dni"
                  type="text"
                  value={editingEmployee.dni}
                  disabled
                  className="bg-muted text-muted-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  El número de documento no se puede modificar por seguridad
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-position">
                  Puesto <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editingEmployee.position}
                  onValueChange={(value) =>
                    setEditingEmployee({ ...editingEmployee, position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar puesto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cocinero">Cocinero</SelectItem>
                    <SelectItem value="Jefe de Cocina">
                      Jefe de Cocina
                    </SelectItem>
                    <SelectItem value="Ayudante de Cocina">
                      Ayudante de Cocina
                    </SelectItem>
                    <SelectItem value="Mesero/a">Mesero/a</SelectItem>
                    <SelectItem value="Jefe de Salón">Jefe de Salón</SelectItem>
                    <SelectItem value="Cajero/a">Cajero/a</SelectItem>
                    <SelectItem value="Tareas de Limpieza">
                      Tareas de Limpieza
                    </SelectItem>
                    <SelectItem value="Encargado/a">Encargado/a</SelectItem>
                    <SelectItem value="Barra">Barra</SelectItem>
                    <SelectItem value="Jefe de Barra">Jefe de Barra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-startDate">
                  Fecha de Ingreso <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editingEmployee.startDate}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      startDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-whiteWage">Sueldo en Blanco</Label>
                <CurrencyInput
                  id="edit-whiteWage"
                  placeholder="$ 0,00"
                  value={editingEmployee.whiteWage}
                  onChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      whiteWage: value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-informalWage">Sueldo Informal</Label>
                <CurrencyInput
                  id="edit-informalWage"
                  placeholder="$ 0,00"
                  value={editingEmployee.informalWage}
                  onChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      informalWage: value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-presentismo">Presentismo</Label>
                <CurrencyInput
                  id="edit-presentismo"
                  placeholder="$ 0,00"
                  value={editingEmployee.presentismo}
                  onChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      presentismo: value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="juan.perez@ejemplo.com"
                  value={editingEmployee.email}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-address">Domicilio</Label>
                <Input
                  id="edit-address"
                  placeholder="Av. Corrientes 1234, CABA"
                  value={editingEmployee.address}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Sueldo Diario Calculado</Label>
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-lg font-semibold">
                    {formatCurrency(
                      calculateDailySalary(
                        parseFloat(editingEmployee.whiteWage) || 0,
                        parseFloat(editingEmployee.informalWage) || 0,
                      ),
                    )}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    (Sueldo Blanco + Sueldo Informal) ÷ 30
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdateEmployee} className="w-full">
              Actualizar Empleado
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al empleado <strong>{employeeToDelete?.name}</strong> y todos sus
              datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingEmployee?.name || "Empleado"}</DialogTitle>
            <DialogDescription>
              Información completa y historial salarial
            </DialogDescription>
          </DialogHeader>

          {viewingEmployee && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">📋 Información</TabsTrigger>
                <TabsTrigger value="salary-history">
                  💰 Historial Sueldo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <p className="text-lg font-medium">
                      {viewingEmployee.name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {viewingEmployee.documentType?.toUpperCase() || "DNI"}
                    </Label>
                    <p className="text-lg font-mono">{viewingEmployee.dni}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Puesto</Label>
                    <p className="text-lg">
                      {formatPosition(viewingEmployee.position)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Ingreso</Label>
                    <p className="text-lg">
                      {viewingEmployee.startDate
                        ? new Date(
                            viewingEmployee.startDate + "T00:00:00",
                          ).toLocaleDateString("es-AR")
                        : "No registrada"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Antigüedad</Label>
                    <p className="text-lg">
                      {viewingEmployee.startDate
                        ? (() => {
                            const vacationInfo =
                              employeeService.calculateVacationDays(
                                viewingEmployee.startDate,
                              );
                            const years = vacationInfo.years;
                            const months = vacationInfo.totalMonths % 12;
                            if (years > 0) {
                              return `${years} año${years > 1 ? "s" : ""}${months > 0 ? ` y ${months} mes${months > 1 ? "es" : ""}` : ""}`;
                            } else {
                              return `${months} mes${months > 1 ? "es" : ""}`;
                            }
                          })()
                        : "No calculada"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sueldo Diario</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(viewingEmployee.dailyWage || 0)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sueldo Mensual Blanco</Label>
                    <p className="text-lg">
                      {formatCurrency(viewingEmployee.whiteWage || 0)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sueldo Mensual Informal</Label>
                    <p className="text-lg">
                      {formatCurrency(viewingEmployee.informalWage || 0)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Presentismo</Label>
                    <p className="text-lg">
                      {formatCurrency(viewingEmployee.presentismo || 0)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-lg">
                      {viewingEmployee.email || "No registrado"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <p className="text-lg">
                      {viewingEmployee.address || "No registrada"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Badge
                      variant={
                        viewingEmployee.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {viewingEmployee.status === "active"
                        ? "Activo"
                        : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Días de Vacaciones</Label>
                    <p className="text-lg">
                      {viewingEmployee.startDate
                        ? (() => {
                            const vacationInfo =
                              employeeService.calculateVacationDays(
                                viewingEmployee.startDate,
                              );
                            if (vacationInfo.eligibleForVacations) {
                              return `${vacationInfo.vacationDays} días anuales`;
                            } else {
                              return `0 días (requiere 6 meses de antigüedad)`;
                            }
                          })()
                        : "No calculado"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="salary-history" className="mt-6">
                <SalaryHistoryTable
                  employeeId={viewingEmployee.id}
                  employeeName={viewingEmployee.name}
                />
              </TabsContent>

            </Tabs>
          )}

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vacation Manager */}
      <VacationManager
        isOpen={isVacationManagerOpen}
        onClose={() => {
          setIsVacationManagerOpen(false);
          setSelectedEmployeeForVacations(null);
        }}
        employee={selectedEmployeeForVacations}
      />

      {/* Salary Change Confirmation Dialog */}
      <SalaryChangeDialog
        isOpen={salaryChangeDialogOpen}
        onClose={() => {
          setSalaryChangeDialogOpen(false);
          setPendingSalaryChanges(null);
        }}
        employee={editingEmployee}
        changes={pendingSalaryChanges?.changes || []}
        onConfirm={async (changeType, effectiveDate, reason) => {
          try {
            if (!pendingSalaryChanges) return;

            const { employeeData } = pendingSalaryChanges;

            // Si es aumento, crear historial; si es corrección, solo actualizar
            if (changeType === "aumento") {
              const today = new Date();
              const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

              await updateEmployeeSalaryWithHistory(
                editingEmployee.id,
                {
                  white_wage: employeeData.whiteWage,
                  informal_wage: employeeData.informalWage,
                  presentismo: employeeData.presentismo,
                },
                {
                  change_type: changeType,
                  effective_date: effectiveDate,
                  impact_period: currentPeriod,
                  reason: reason,
                },
              );
            } else {
              // Corrección: solo actualizar empleado sin historial
              await updateEmployee(editingEmployee.id, employeeData);
            }

            showSuccessMessage(
              `Empleado ${employeeData.name} actualizado exitosamente`,
            );
            setIsEditDialogOpen(false);
            setEditingEmployee(null);
            setOriginalEmployee(null);
            setSalaryChangeDialogOpen(false);
            setPendingSalaryChanges(null);
          } catch (error) {
            console.error(
              "Error updating employee with salary history:",
              error,
            );
            alert(`Error al actualizar empleado: ${error.message}`);
          }
        }}
      />

      {/* Document Manager */}
      <DocumentManager
        isOpen={isDocumentManagerOpen}
        onClose={() => {
          setIsDocumentManagerOpen(false);
          setSelectedEmployeeForDocuments(null);
        }}
        employee={selectedEmployeeForDocuments}
      />

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage("")}
              className="ml-2 text-white hover:text-green-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
