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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Users,
  Plus,
  Edit,
  Key,
  Trash2,
  Search,
  Shield,
  UserCheck,
  UserX,
  Power,
  PowerOff,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUsers } from "@/hooks/use-users";
import { useEmployees } from "@/hooks/use-employees";
import usePermissions from "@/hooks/use-permissions";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    name: "",
    role: "employee",
    employeeId: "",
    password: "",
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState("");

  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
  } = useUsers();

  const { employees } = useEmployees();
  const { isAdmin: canAccessAdmin } = usePermissions();
  const isAdmin = canAccessAdmin();

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    const username = newUser.username.trim();
    const email = newUser.email.trim();
    const name = newUser.name.trim();
    const password = newUser.password.trim();

    if (!username || !email || !name || !password) {
      alert("Completa usuario, email, nombre y contraseña");
      return;
    }

    try {
      await createUser({
        username,
        email,
        name,
        role: newUser.role as any,
        employeeId: newUser.employeeId || undefined,
        password,
        needsPasswordChange: false,
      });

      setIsAddDialogOpen(false);
      setNewUser({
        username: "",
        email: "",
        name: "",
        role: "employee",
        employeeId: "",
        password: "",
        isActive: true,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      alert(
        error instanceof Error
          ? `Error al crear usuario: ${error.message}`
          : "Error al crear usuario",
      );
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    const originalUser = users.find((u) => u.id === selectedUser.id);

    if (!originalUser) {
      alert("No se encontró el usuario original");
      return;
    }

    const trimmedEmail = selectedUser.email.trim();
    const trimmedName = selectedUser.name.trim();

    if (!trimmedName) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!trimmedEmail) {
      alert("El email es obligatorio");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      alert("El email no es válido");
      return;
    }

    const activeAdmins = users.filter(
      (user) => user.role === "admin" && user.isActive,
    );

    if (
      originalUser.role === "admin" &&
      originalUser.isActive &&
      selectedUser.role !== "admin" &&
      activeAdmins.length <= 1
    ) {
      alert("No se puede quitar el rol del último administrador activo");
      return;
    }

    if (
      originalUser.role === "admin" &&
      originalUser.isActive &&
      !selectedUser.isActive &&
      activeAdmins.length <= 1
    ) {
      alert("No se puede desactivar al último administrador activo");
      return;
    }

    try {
      await updateUser(selectedUser.id, {
        email: trimmedEmail,
        name: trimmedName,
        role: selectedUser.role,
        isActive: selectedUser.isActive,
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert(
        error instanceof Error
          ? `Error al actualizar usuario: ${error.message}`
          : "Error al actualizar usuario",
      );
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const result = await resetPassword(selectedUser.id, newPassword);

      if (!result.success) {
        if (result.suggestion) {
          alert(
            `No se pudo actualizar automáticamente. Intenta manualmente en Supabase:\n${result.suggestion}`,
          );
        } else {
          alert(
            result.error
              ? `Error al blanquear contraseña: ${result.error}`
              : "Error al blanquear contraseña",
          );
        }
        return;
      }

      setIsResetPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      alert(
        `Contraseña actualizada para ${result.email}. Comparte las credenciales de forma segura.`,
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(
        error instanceof Error
          ? `Error al blanquear contraseña: ${error.message}`
          : "Error al blanquear contraseña",
      );
    }
  };

  const handleToggleUserStatus = async (user) => {
    const action = user.isActive ? "desactivar" : "activar";

    // 🛡️ PROTECCIÓN CRÍTICA: Prevenir desactivación del último administrador
    if (user.role === "admin" && user.isActive) {
      const activeAdmins = users.filter(
        (u) => u.role === "admin" && u.isActive,
      );

      if (activeAdmins.length <= 1) {
        alert(
          `🚨 ACCIÓN BLOQUEADA: No se puede desactivar el último administrador del sistema.\n\nEsto causaría pérdida total de acceso administrativo.\n\nPrimero crea otro usuario administrador antes de desactivar este.`,
        );
        return;
      }

      // Confirmación especial para administradores
      const confirmed = confirm(
        `⚠️ CONFIRMACIÓN CRÍTICA ⚠️\n\n` +
          `Estás a punto de DESACTIVAR un usuario ADMINISTRADOR:\n` +
          `• Usuario: ${user.username} (${user.name})\n` +
          `• Email: ${user.email}\n\n` +
          `Quedarán ${activeAdmins.length - 1} administradores activos.\n\n` +
          `¿Confirmas esta acción crítica de seguridad?`,
      );

      if (!confirmed) return;

      // Segunda confirmación
      const doubleConfirmed = confirm(
        `🔐 ÚLTIMA CONFIRMACIÓN 🔐\n\n` +
          `Escribirás "CONFIRMAR" para proceder con la desactivación del administrador.\n\n` +
          `¿Estás completamente seguro?`,
      );

      if (!doubleConfirmed) return;
    } else {
      // Confirmación normal para otros usuarios
      const confirmed = confirm(
        `¿Estás seguro de que quieres ${action} el usuario ${user.username}?`,
      );

      if (!confirmed) return;
    }

    try {
      await updateUser(user.id, { isActive: !user.isActive });

      // Log security event
      console.log(`🔐 Security Event: USER_STATUS_CHANGED`, {
        targetUser: user.username,
        targetRole: user.role,
        action: action,
        performedBy: "current_admin", // In real app, get from auth context
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert(`Error al ${action} usuario: ${error.message}`);
    }
  };

  const openResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword(user.role === "employee" ? user.username : ""); // Default: DNI para empleados
    setIsResetPasswordOpen(true);
  };

  // 🚨 Crear usuario administrador de emergencia
  const createEmergencyAdmin = async () => {
    const confirmed = confirm(
      `🚨 CREAR ADMINISTRADOR DE EMERGENCIA 🚨\n\n` +
        `Esta función permite generar un administrador temporal.\n` +
        `Debes definir usuario, email y contraseña únicos.\n\n` +
        `⚠️ ÚSALO SOLO EN EMERGENCIAS ⚠️\n\n` +
        `¿Deseas continuar?`,
    );

    if (!confirmed) return;

    const usernameInput = prompt(
      "Ingresa el usuario para el administrador de emergencia",
      "",
    );

    const username = usernameInput?.trim();
    if (!username || username.length < 4) {
      alert("El usuario debe tener al menos 4 caracteres");
      return;
    }

    const emailInput = prompt(
      "Ingresa el email del administrador de emergencia",
      "",
    );

    const email = emailInput?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Debes ingresar un email válido");
      return;
    }

    const password = prompt(
      "Ingresa una contraseña temporal (mínimo 12 caracteres)",
      "",
    );

    if (!password || password.trim().length < 12) {
      alert("La contraseña debe tener al menos 12 caracteres");
      return;
    }

    try {
      await createUser({
        username,
        email,
        name: "Administrador de Emergencia",
        role: "admin",
        password: password.trim(),
        needsPasswordChange: true,
      });

      alert(
        `✅ Administrador de emergencia creado.\n` +
          `Usuario: ${username}\n` +
          `Email: ${email}\n\n` +
          `⚠️ Guarda las credenciales en un canal seguro y elimina este usuario cuando deje de ser necesario.`,
      );

      console.log(`🚨 Security Event: EMERGENCY_ADMIN_CREATED`, {
        emergencyUser: username,
        createdBy: "current_admin",
        timestamp: new Date().toISOString(),
        reason: "Administrative emergency access",
      });
    } catch (error) {
      console.error("Error creating emergency admin:", error);
      alert(
        error instanceof Error
          ? `Error creando administrador de emergencia: ${error.message}`
          : "Error creando administrador de emergencia",
      );
    }
  };

  // 🔐 Restablecer contraseña del administrador principal
  const resetAdminPassword = async () => {
    const confirmed = confirm(
      `🔐 RESTABLECER CONTRASEÑA ADMINISTRADOR 🔐\n\n` +
        `Esta función restablecerá la contraseña del usuario "admin":\n\n` +
        `• Usuario: admin\n` +
        `• Nueva contraseña: Jmalpeli3194\n` +
        `• Email: julimalpeli@gmail.com\n\n` +
        `⚠️ Esta acción queda registrada en los logs de seguridad.\n\n` +
        `¿Confirmas restablecer la contraseña del administrador?`,
    );

    if (!confirmed) return;

    try {
      // Buscar el usuario admin
      const adminUser = users.find(
        (u) => u.username === "admin" || u.email === "julimalpeli@gmail.com",
      );

      if (!adminUser) {
        alert("❌ Usuario administrador no encontrado en el sistema.");
        return;
      }

      // Restablecer contraseña usando base64 encoding (mismo formato que empleados)
      const newPasswordEncoded = btoa("Jmalpeli3194"); // Base64 encoding

      await updateUser(adminUser.id, {
        passwordHash: newPasswordEncoded,
        needsPasswordChange: false,
        updatedAt: new Date().toISOString(),
      });

      alert(
        `✅ CONTRASEÑA RESTABLECIDA\n\n` +
          `Usuario: admin\n` +
          `Nueva contraseña: Jmalpeli3194\n` +
          `Email: julimalpeli@gmail.com\n\n` +
          `✅ Ahora puedes iniciar sesión con estas credenciales.`,
      );

      // Log security event
      console.log(`🔐 Security Event: ADMIN_PASSWORD_RESET`, {
        targetUser: adminUser.username,
        targetEmail: adminUser.email,
        resetBy: "system_admin",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error resetting admin password:", error);
      alert(`Error restableciendo contraseña: ${error.message}`);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "hr":
        return "secondary";
      case "employee":
        return "outline";
      case "readonly":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "manager":
        return "Gerente";
      case "hr":
        return "RRHH";
      case "employee":
        return "Empleado";
      case "readonly":
        return "Solo Lectura";
      default:
        return role;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p>Cargando usuarios...</p>
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
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">
                Administra usuarios, roles y permisos del sistema
              </p>
              {/* Security Status */}
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                🛡️ <strong>Estado de Seguridad:</strong>{" "}
                {users.filter((u) => u.role === "admin" && u.isActive).length}{" "}
                administradores activos | Protecciones anti-bloqueo: ✅ Activas
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <ChangePasswordDialog />

            {/* Botón de emergencia */}
            <Button
              variant="destructive"
              size="sm"
              onClick={createEmergencyAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin Emergencia
            </Button>

            {/* Botón restablecer admin */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetAdminPassword}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Key className="h-4 w-4 mr-2" />
              Reset Admin
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Completa la información del nuevo usuario
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input
                      id="username"
                      placeholder="ej: admin, 12345678"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@cadizbar.com"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      placeholder="Juan Pérez"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Empleado</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="hr">RRHH</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeId">
                      Empleado Asociado (opcional)
                    </Label>
                    <Select
                      value={newUser.employeeId || "none"}
                      onValueChange={(value) =>
                        setNewUser({
                          ...newUser,
                          employeeId: value === "none" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asociar</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}
                          >
                            {employee.name} - {employee.dni}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Contraseña temporal"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Para empleados se recomienda usar su DNI
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateUser} className="w-full">
                      Crear Usuario
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
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="manager">Gerentes</SelectItem>
              <SelectItem value="hr">RRHH</SelectItem>
              <SelectItem value="employee">Empleados</SelectItem>
              <SelectItem value="readonly">Solo Lectura</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios del Sistema
                </CardTitle>
                <CardDescription>
                  {filteredUsers.length} usuarios encontrados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Empleado Asociado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <UserX className="h-4 w-4 text-red-600" />
                            )}
                            <span
                              className={
                                user.isActive
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {user.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.employeeId
                            ? employees.find(
                                (emp) => emp.id.toString() === user.employeeId,
                              )?.name || "Empleado no encontrado"
                            : "Sin asociar"}
                        </TableCell>
                        <TableCell>
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleString("es-AR")
                            : "Nunca"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar usuario</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openResetPassword(user)}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Blanquear contraseña</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(user)}
                                >
                                  {user.isActive ? (
                                    <PowerOff className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Power className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {user.isActive
                                    ? "Desactivar usuario"
                                    : "Activar usuario"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No se encontraron usuarios con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica la información del usuario
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={selectedUser.name}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={selectedUser.email}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) =>
                      setSelectedUser({ ...selectedUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Empleado</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="hr">RRHH</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedUser.isActive}
                    onCheckedChange={(checked) =>
                      setSelectedUser({ ...selectedUser, isActive: checked })
                    }
                  />
                  <Label>Usuario activo</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateUser} className="w-full">
                    Actualizar
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

        {/* Reset Password Dialog */}
        <Dialog
          open={isResetPasswordOpen}
          onOpenChange={setIsResetPasswordOpen}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Blanquear Contraseña</DialogTitle>
              <DialogDescription>
                Establece una nueva contraseña para{" "}
                <strong>{selectedUser?.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Ingresa la nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Para empleados se recomienda usar su DNI como contraseña
                  inicial
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleResetPassword}
                  className="w-full"
                  disabled={!newPassword}
                >
                  Blanquear Contrase��a
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default UserManagement;
