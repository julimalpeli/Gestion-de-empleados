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
import { Label } from "@/components/ui/label";
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
  Eye,
  Calendar,
  DollarSign,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

const EmployeePortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mock employee data
  const employeeData = {
    name: "Juan Pérez",
    position: "Cocinero",
    employeeId: "EMP001",
    startDate: "2023-01-15",
    vacationDays: 14,
  };

  // Mock payroll history
  const payrollHistory = [
    {
      period: "Febrero 2024",
      workDays: 22,
      holidayDays: 2,
      whiteAmount: 220000,
      informalAmount: 120000,
      netTotal: 340000,
      advances: 50000,
      status: "paid",
    },
    {
      period: "Enero 2024",
      workDays: 20,
      holidayDays: 1,
      whiteAmount: 200000,
      informalAmount: 100000,
      netTotal: 300000,
      advances: 0,
      status: "paid",
    },
    {
      period: "Diciembre 2023",
      workDays: 21,
      holidayDays: 0,
      whiteAmount: 210000,
      informalAmount: 105000,
      netTotal: 315000,
      advances: 25000,
      status: "paid",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleLogin = () => {
    if (employeeCode.trim()) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                RH
              </div>
            </div>
            <CardTitle className="text-2xl">Portal del Empleado</CardTitle>
            <CardDescription>
              Ingresa tu código de empleado para acceder a tu información
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Empleado</Label>
              <Input
                id="code"
                placeholder="Ej: EMP001"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Ingresar
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              ¿No tienes tu código? Consulta con Recursos Humanos
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                RH
              </div>
              <div>
                <h1 className="text-xl font-semibold">Portal del Empleado</h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenido, {employeeData.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mi Información
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nombre</Label>
                <p className="font-medium">{employeeData.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Puesto</Label>
                <p className="font-medium">{employeeData.position}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Código</Label>
                <p className="font-medium">{employeeData.employeeId}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Fecha de Ingreso
                </Label>
                <p className="font-medium">
                  {new Date(employeeData.startDate).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Pago</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(payrollHistory[0].netTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {payrollHistory[0].period}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Días de Vacaciones
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employeeData.vacationDays}
              </div>
              <p className="text-xs text-muted-foreground">Días disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Liquidaciones
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollHistory.length}</div>
              <p className="text-xs text-muted-foreground">
                Disponibles para consulta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll History */}
        <Tabs defaultValue="liquidaciones" className="space-y-4">
          <TabsList>
            <TabsTrigger value="liquidaciones">Mis Liquidaciones</TabsTrigger>
            <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="liquidaciones">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Liquidaciones</CardTitle>
                <CardDescription>
                  Consulta el detalle de tus pagos anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Días Trabajados</TableHead>
                      <TableHead>Feriados</TableHead>
                      <TableHead>Sueldo en Blanco</TableHead>
                      <TableHead>Sueldo Informal</TableHead>
                      <TableHead>Adelantos</TableHead>
                      <TableHead>Total Neto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollHistory.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {record.period}
                        </TableCell>
                        <TableCell>{record.workDays} días</TableCell>
                        <TableCell>{record.holidayDays} días</TableCell>
                        <TableCell>
                          {formatCurrency(record.whiteAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(record.informalAmount)}
                        </TableCell>
                        <TableCell>
                          {record.advances > 0
                            ? formatCurrency(record.advances)
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(record.netTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Pagado</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vacaciones">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Vacaciones</CardTitle>
                <CardDescription>
                  Información sobre tus días de vacaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Días Disponibles</h3>
                      <div className="text-3xl font-bold text-primary">
                        {employeeData.vacationDays}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Días acumulados
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Días Utilizados</h3>
                      <div className="text-3xl font-bold text-muted-foreground">
                        7
                      </div>
                      <p className="text-sm text-muted-foreground">
                        En este año
                      </p>
                    </div>
                  </div>
                  <div className="text-center text-muted-foreground py-4">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      Para solicitar vacaciones, contacta con Recursos Humanos
                    </p>
                  </div>
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
