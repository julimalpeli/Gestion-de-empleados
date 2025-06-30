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
  const { isAdmin } = usePermissions();

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
    try {
      await createUser({
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role as any,
        employeeId: newUser.employeeId || undefined,
        password: newUser.password,
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
      alert("Error al crear usuario");
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, {
        username: selectedUser.username,
        email: selectedUser.email,
        name: selectedUser.name,
        role: selectedUser.role,
        isActive: selectedUser.isActive,
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error al actualizar usuario");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    try {
      await resetPassword(selectedUser.id, newPassword);
      setIsResetPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      alert("Contraseña blanqueada exitosamente");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Error al blanquear contraseña");
    }
  };

  const handleToggleUserStatus = async (user) => {
    const action = user.isActive ? "desactivar" : "activar";
    if (
      confirm(
        `¿Estás seguro de que quieres ${action} el usuario ${user.username}?`,
      )
    ) {
      try {
        await updateUser(user.id, { isActive: !user.isActive });
      } catch (error) {
        console.error("Error toggling user status:", error);
        alert(`Error al ${action} usuario`);
      }
    }
  };

  const openResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword(user.role === "employee" ? user.username : ""); // Default: DNI para empleados
    setIsResetPasswordOpen(true);
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
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
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
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="hr">RRHH</SelectItem>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="readonly">Solo Lectura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newUser.role === "employee" && (
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Empleado Asociado</Label>
                  <Select
                    value={newUser.employeeId}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, employeeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.dni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña inicial"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === "employee").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuarios
          </CardTitle>
          <CardDescription>
            Gestiona todos los usuarios del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="hr">RRHH</SelectItem>
                <SelectItem value="employee">Empleado</SelectItem>
                <SelectItem value="readonly">Solo Lectura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString("es-AR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
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
                              variant="outline"
                              size="sm"
                              onClick={() => openResetPassword(user)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Resetear contraseña</p>
                          </TooltipContent>
                        </Tooltip>

                        {user.role !== "admin" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información de {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editUsername">Nombre de Usuario</Label>
                <Input
                  id="editUsername"
                  value={selectedUser.username}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      username: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editName">Nombre Completo</Label>
                <Input
                  id="editName"
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRole">Rol</Label>
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
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="hr">RRHH</SelectItem>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="readonly">Solo Lectura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="editActive"
                  checked={selectedUser.isActive}
                  onCheckedChange={(checked) =>
                    setSelectedUser({ ...selectedUser, isActive: checked })
                  }
                />
                <Label htmlFor="editActive">Usuario activo</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateUser} className="w-full">
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Blanquear Contraseña
            </DialogTitle>
            <DialogDescription>
              Restablecer contraseña para {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                El usuario deberá cambiar esta contraseña en su próximo login.
              </p>
            </div>

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
                Para empleados se recomienda usar su DNI como contraseña inicial
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleResetPassword}
                className="w-full"
                disabled={!newPassword}
              >
                Blanquear Contraseña
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
  );
};

export default UserManagement;
