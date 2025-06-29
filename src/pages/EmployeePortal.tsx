import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Calendar,
  DollarSign,
  FileText,
  LogOut,
  Download,
  Plane,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import useFiles from "@/hooks/use-files";

const EmployeePortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Mock employee data based on logged user
  const employeeData = {
    name: user?.name || "Juan Pérez",
    dni: user?.username || "12345678", // DNI es el username para empleados
    position: "Cocinero",
    employeeId: user?.employeeId || 1,
    startDate: "2023-01-15",
    vacationDays: 14,
    vacationsTaken: 7,
    phone: "+54 11 1234-5678",
    email: "juan.perez@cadizbartapas.com",
    address: "Av. Corrientes 1234, CABA",
  };

  // Mock payroll history
  const payrollHistory = [
    {
      id: 1,
      period: "Diciembre 2024",
      workDays: 22,
      holidayDays: 1,
      grossSalary: 480000, // Unified white + informal
      presentismo: 25000,
      aguinaldo: 240000, // Half of gross salary for December
      adelanto: 50000,
      netTotal: 695000,
      status: "paid",
      paidDate: "31/12/2024",
      hasDocument: true,
    },
    {
      id: 2,
      period: "Noviembre 2024",
      workDays: 22,
      holidayDays: 1,
      grossSalary: 480000,
      presentismo: 25000,
      aguinaldo: 0,
      adelanto: 50000,
      netTotal: 455000,
      status: "paid",
      paidDate: "30/11/2024",
      hasDocument: true,
    },
    {
      id: 3,
      period: "Octubre 2024",
      workDays: 21,
      holidayDays: 0,
      grossSalary: 450000,
      presentismo: 25000,
      aguinaldo: 0,
      adelanto: 0,
      netTotal: 475000,
      status: "paid",
      paidDate: "31/10/2024",
      hasDocument: true,
    },
    {
      id: 4,
      period: "Septiembre 2024",
      workDays: 20,
      holidayDays: 2,
      grossSalary: 460000,
      presentismo: 0, // Perdió presentismo
      aguinaldo: 0,
      adelanto: 30000,
      netTotal: 430000,
      status: "paid",
      paidDate: "30/09/2024",
      hasDocument: true,
    },
    {
      id: 5,
      period: "Junio 2024",
      workDays: 20,
      holidayDays: 1,
      grossSalary: 450000,
      presentismo: 25000,
      aguinaldo: 225000, // Half of gross salary for June
      adelanto: 0,
      netTotal: 700000,
      status: "paid",
      paidDate: "30/06/2024",
      hasDocument: true,
    },
  ];

  // Mock vacation history
  const vacationHistory = [
    {
      id: 1,
      startDate: "2024-07-15",
      endDate: "2024-07-19",
      days: 5,
      status: "approved",
      reason: "Vacaciones familiares",
    },
    {
      id: 2,
      startDate: "2024-03-11",
      endDate: "2024-03-11",
      days: 1,
      status: "approved",
      reason: "Día personal",
    },
    {
      id: 3,
      startDate: "2024-12-23",
      endDate: "2024-12-27",
      days: 5,
      status: "pending",
      reason: "Navidad con familia",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 border border-gray-200">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fba484c5e9b3d409b8f430aad946b1b02%2F12f46da7c0a34ce3b09600a8825776cc?format=webp&width=800"
                  alt="Cádiz Bar de Tapas"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Portal del Empleado</h1>
                <p className="text-sm text-muted-foreground">
                  Cádiz Bar de Tapas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{employeeData.name}</p>
                <p className="text-sm text-muted-foreground">
                  {employeeData.position}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            ¡Bienvenido, {employeeData.name}!
          </h2>
          <p className="text-muted-foreground">
            Aquí puedes consultar tu información personal, liquidaciones y
            vacaciones.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Días de Vacaciones
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employeeData.vacationDays - employeeData.vacationsTaken}
              </div>
              <p className="text-xs text-muted-foreground">
                Disponibles de {employeeData.vacationDays}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Última Liquidación
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(payrollHistory[0]?.netTotal || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {payrollHistory[0]?.period}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Antigüedad</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.9</div>
              <p className="text-xs text-muted-foreground">Años trabajados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Activo</div>
              <p className="text-xs text-muted-foreground">Empleado activo</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="payroll">Liquidaciones</TabsTrigger>
            <TabsTrigger value="vacations">Vacaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Tu información de empleado en Cádiz Bar de Tapas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Nombre Completo
                    </label>
                    <p className="text-lg">{employeeData.name}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">DNI</label>
                    <p className="text-lg font-mono">{employeeData.dni}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Puesto</label>
                    <p className="text-lg">{employeeData.position}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      ID de Empleado
                    </label>
                    <p className="text-lg">#{employeeData.employeeId}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Fecha de Ingreso
                    </label>
                    <p className="text-lg">
                      {formatDate(employeeData.startDate)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    <p className="text-lg">{employeeData.phone}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-lg">{employeeData.email}</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Dirección</label>
                    <p className="text-lg">{employeeData.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Historial de Liquidaciones
                </CardTitle>
                <CardDescription>
                  Consulta tus liquidaciones y descarga los recibos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Días Trabajados</TableHead>
                        <TableHead>Sueldo Bruto</TableHead>
                        <TableHead>Presentismo</TableHead>
                        <TableHead>Aguinaldo</TableHead>
                        <TableHead>Adelanto</TableHead>
                        <TableHead>Total Neto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Recibo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.period}
                          </TableCell>
                          <TableCell>
                            {record.workDays + record.holidayDays} días
                            {record.holidayDays > 0 && (
                              <div className="text-xs text-muted-foreground">
                                ({record.holidayDays} feriados)
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(record.grossSalary)}
                          </TableCell>
                          <TableCell>
                            {record.presentismo > 0 ? (
                              <span className="text-green-600">
                                {formatCurrency(record.presentismo)}
                              </span>
                            ) : (
                              <span className="text-red-600">Perdido</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.aguinaldo > 0 ? (
                              <span className="text-blue-600 font-medium">
                                {formatCurrency(record.aguinaldo)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.adelanto > 0 ? (
                              <span className="text-orange-600">
                                -{formatCurrency(record.adelanto)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {formatCurrency(record.netTotal)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Pagado</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {record.paidDate}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!record.hasDocument}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vacations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Gestión de Vacaciones
                </CardTitle>
                <CardDescription>
                  Consulta tu saldo de vacaciones y solicita días libres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vacation Balance */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">
                        Saldo de Vacaciones
                      </h3>
                      <p className="text-sm text-blue-700">
                        Período actual: Enero - Diciembre 2024
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-900">
                        {employeeData.vacationDays -
                          employeeData.vacationsTaken}
                      </div>
                      <div className="text-sm text-blue-700">
                        días disponibles
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-medium text-blue-900">
                        {employeeData.vacationDays}
                      </div>
                      <div className="text-xs text-blue-700">Días anuales</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">
                        {employeeData.vacationsTaken}
                      </div>
                      <div className="text-xs text-blue-700">Días tomados</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-700">
                        {employeeData.vacationDays -
                          employeeData.vacationsTaken}
                      </div>
                      <div className="text-xs text-green-600">Disponibles</div>
                    </div>
                  </div>
                </div>

                {/* Vacation History */}
                <div>
                  <h3 className="font-medium mb-4">Historial de Solicitudes</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha Inicio</TableHead>
                          <TableHead>Fecha Fin</TableHead>
                          <TableHead>Días</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vacationHistory.map((vacation) => (
                          <TableRow key={vacation.id}>
                            <TableCell>
                              {formatDate(vacation.startDate)}
                            </TableCell>
                            <TableCell>
                              {formatDate(vacation.endDate)}
                            </TableCell>
                            <TableCell>{vacation.days} días</TableCell>
                            <TableCell>{vacation.reason}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  vacation.status === "approved"
                                    ? "default"
                                    : vacation.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {vacation.status === "approved"
                                  ? "Aprobado"
                                  : vacation.status === "pending"
                                    ? "Pendiente"
                                    : "Rechazado"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Request New Vacation */}
                <div className="border-t pt-6">
                  <Button className="w-full sm:w-auto">
                    <Plane className="h-4 w-4 mr-2" />
                    Solicitar Días de Vacaciones
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contacta con tu supervisor para solicitar nuevos días de
                    vacaciones
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeePortal;
