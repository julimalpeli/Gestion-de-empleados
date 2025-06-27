import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Shield,
  Users,
  Settings,
  Eye,
  Edit,
  Plus,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react";
import usePermissions from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";

const UserRoles = () => {
  const { roles, permissions } = usePermissions();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  const getPermissionIcon = (module: string) => {
    switch (module) {
      case "employees":
        return <Users className="h-4 w-4" />;
      case "payroll":
        return <DollarSign className="h-4 w-4" />;
      case "vacations":
        return <Calendar className="h-4 w-4" />;
      case "reports":
        return <FileText className="h-4 w-4" />;
      case "files":
        return <FileText className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "view":
        return "bg-blue-100 text-blue-800";
      case "create":
        return "bg-green-100 text-green-800";
      case "edit":
        return "bg-yellow-100 text-yellow-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "process":
      case "approve":
        return "bg-purple-100 text-purple-800";
      case "export":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleBadgeColor = (roleId: string) => {
    switch (roleId) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-purple-100 text-purple-800";
      case "hr":
        return "bg-orange-100 text-orange-800";
      case "employee":
        return "bg-green-100 text-green-800";
      case "readonly":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupPermissionsByModule = (perms: any[]) => {
    return perms.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Gestión de Roles y Permisos</h1>
            <p className="text-muted-foreground">
              Administra los roles y permisos del sistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getRoleBadgeColor(user?.role || "")}>
            <Shield className="h-3 w-3 mr-1" />
            {user?.role === "admin"
              ? "Administrador"
              : user?.role === "manager"
                ? "Gerente"
                : user?.role === "hr"
                  ? "RRHH"
                  : user?.role === "employee"
                    ? "Empleado"
                    : "Solo Lectura"}
          </Badge>
          <span className="text-sm text-muted-foreground">{user?.name}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Roles del Sistema
            </CardTitle>
            <CardDescription>
              Lista de roles disponibles y su nivel de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole?.id === role.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleBadgeColor(role.id)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {role.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Nivel {role.level}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {role.permissions.length} permisos
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {role.id === "admin" &&
                      "Acceso completo a todas las funciones del sistema"}
                    {role.id === "manager" &&
                      "Gestión completa de empleados y liquidaciones"}
                    {role.id === "hr" &&
                      "Gestión de empleados, liquidaciones y vacaciones"}
                    {role.id === "employee" &&
                      "Acceso limitado a sus propios datos"}
                    {role.id === "readonly" &&
                      "Solo lectura de información del sistema"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Detalles de Permisos
            </CardTitle>
            <CardDescription>
              {selectedRole
                ? `Permisos asignados al rol: ${selectedRole.name}`
                : "Selecciona un rol para ver sus permisos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <div className="space-y-4">
                {selectedRole.id === "admin" ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Acceso Administrativo Completo
                    </h3>
                    <p className="text-muted-foreground">
                      El rol de administrador tiene acceso completo a todas las
                      funciones del sistema sin restricciones.
                    </p>
                  </div>
                ) : (
                  Object.entries(
                    groupPermissionsByModule(selectedRole.permissions),
                  ).map(([module, modulePermissions]) => (
                    <div key={module} className="space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        {getPermissionIcon(module)}
                        <span className="capitalize">
                          {module === "employees"
                            ? "Empleados"
                            : module === "payroll"
                              ? "Liquidaciones"
                              : module === "vacations"
                                ? "Vacaciones"
                                : module === "reports"
                                  ? "Reportes"
                                  : module === "files"
                                    ? "Archivos"
                                    : module === "system"
                                      ? "Sistema"
                                      : module}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {modulePermissions.map((perm, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className={getActionColor(perm.action)}
                          >
                            {perm.action === "view"
                              ? "Ver"
                              : perm.action === "create"
                                ? "Crear"
                                : perm.action === "edit"
                                  ? "Editar"
                                  : perm.action === "delete"
                                    ? "Eliminar"
                                    : perm.action === "process"
                                      ? "Procesar"
                                      : perm.action === "approve"
                                        ? "Aprobar"
                                        : perm.action === "export"
                                          ? "Exportar"
                                          : perm.action === "manage"
                                            ? "Gestionar"
                                            : perm.action === "upload"
                                              ? "Subir"
                                              : perm.action === "users"
                                                ? "Usuarios"
                                                : perm.action === "roles"
                                                  ? "Roles"
                                                  : perm.action === "settings"
                                                    ? "Configuración"
                                                    : perm.action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Selecciona un rol de la lista para ver sus permisos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permisos</CardTitle>
          <CardDescription>
            Vista completa de todos los permisos del sistema organizados por
            módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Acciones Disponibles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(
                  Object.values(permissions).reduce((acc, perm) => {
                    if (!acc[perm.module]) {
                      acc[perm.module] = [];
                    }
                    acc[perm.module].push(perm);
                    return acc;
                  }, {}),
                ).map(([module, modulePermissions]) => (
                  <TableRow key={module}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPermissionIcon(module)}
                        <span className="font-medium capitalize">
                          {module === "employees"
                            ? "Empleados"
                            : module === "payroll"
                              ? "Liquidaciones"
                              : module === "vacations"
                                ? "Vacaciones"
                                : module === "reports"
                                  ? "Reportes"
                                  : module === "files"
                                    ? "Archivos"
                                    : module === "system"
                                      ? "Sistema"
                                      : module}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {module === "employees" && "Gestión de personal"}
                      {module === "payroll" &&
                        "Gestión de sueldos y liquidaciones"}
                      {module === "vacations" && "Gestión de vacaciones"}
                      {module === "reports" && "Generación de reportes"}
                      {module === "files" && "Gestión de archivos"}
                      {module === "system" && "Administración del sistema"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {modulePermissions.map((perm, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className={`text-xs ${getActionColor(perm.action)}`}
                          >
                            {perm.action}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoles;
