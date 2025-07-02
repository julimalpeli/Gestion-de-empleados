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
import { useAuth } from "@/hooks/use-auth-simple";
import { useNavigate } from "react-router-dom";
import useFiles from "@/hooks/use-files";
import { useEmployees } from "@/hooks/use-employees";
import { usePayroll } from "@/hooks/use-payroll";
import { useVacations } from "@/hooks/use-vacations";
import { useDocuments } from "@/hooks/use-documents";
import { employeeService } from "@/services/employeeService";
import {
  generatePayrollReceiptPDF,
  generatePayrollReceiptExcel,
} from "@/utils/receiptGenerator";

const EmployeePortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { employees, loading: employeesLoading } = useEmployees();
  const { payrollRecords, loading: payrollLoading } = usePayroll();
  const { vacationRequests, loading: vacationsLoading } = useVacations();
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    downloadDocument,
    getCategoryDisplayName,
  } = useDocuments(user?.employeeId);

  // Get current employee data safely
  const currentEmployee =
    employees?.find((emp) => emp.email === user?.email) || null;

  // Debug logging for documents
  console.log("EmployeePortal documents state:", {
    employeeId: user?.employeeId,
    documentsCount: documents?.length,
    documentsLoading,
    documentsError,
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Always navigate to login, even if logout fails
      navigate("/login");
    }
  };

  const handleDownloadReceipt = async (record) => {
    try {
      const employee = currentEmployee;
      if (!employee) {
        alert("No se encontró la información del empleado");
        return;
      }

      // Find the actual payroll record with all data
      const fullPayrollRecord = (payrollRecords || []).find(
        (pr) => pr.id === record.id,
      );

      if (!fullPayrollRecord) {
        alert("No se encontró el registro de liquidación completo");
        return;
      }

      const receiptData = {
        employee: {
          name: employee.name,
          dni: employee.dni,
          position: employee.position,
          startDate: employee.startDate,
        },
        payroll: fullPayrollRecord,
        period: fullPayrollRecord.period,
        company: {
          name: "Cádiz Bar de Tapas",
          address: "Calle 57 Nro1099 esq. 17",
          phone: "", // Removed phone number
        },
      };

      // Show options to user
      const format = confirm(
        "¿Generar como PDF? \n\nOK = PDF\nCancelar = Excel/CSV",
      );

      if (format) {
        await generatePayrollReceiptPDF(receiptData);
      } else {
        await generatePayrollReceiptExcel(receiptData);
      }
    } catch (error) {
      console.error("Error generating payslip:", error);
      alert(`Error al generar el recibo: ${error.message}`);
    }
  };

  // Simple debug logging to avoid crashes
  console.log(
    "🔍 Employee Portal - User:",
    user?.name,
    "Employee:",
    currentEmployee?.name,
  );

  // Calculate vacation eligibility for later use
  const vacationInfo = currentEmployee?.startDate
    ? employeeService.calculateVacationDays(currentEmployee.startDate)
    : { vacationDays: 0, eligibleForVacations: false, totalMonths: 0 };

  // Get real payroll history for current employee
  const employeeId = currentEmployee?.id || user?.employeeId;
  const payrollHistory = (payrollRecords || [])
    .filter((record) => record.employeeId === employeeId)
    .map((record) => ({
      id: record.id,
      period: record.period,
      workDays: record.baseDays,
      holidayDays: record.holidayDays,
      grossSalary: record.whiteAmount + record.informalAmount,
      presentismo: record.presentismoAmount,
      aguinaldo: record.aguinaldo,
      adelanto: record.advances,
      netTotal: record.netTotal, // Fixed: Don't add aguinaldo twice, it's already included in netTotal
      discounts: record.discounts,
      overtimeHours: record.overtimeHours,
      overtimeAmount: record.overtimeAmount,
      bonusAmount: record.bonusAmount,
      holidayBonus: record.holidayBonus,
      status: record.status,
      paidDate: record.processedDate
        ? new Date(record.processedDate).toLocaleDateString("es-AR")
        : "-",
      hasDocument: true, // TODO: Check if document exists
    }))
    .sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime(),
    );

  // Get real vacation history for current employee
  const vacationHistory = (vacationRequests || [])
    .filter((request) => request.employeeId === employeeId)
    .map((request) => ({
      id: request.id,
      startDate: request.startDate,
      endDate: request.endDate,
      days: request.days,
      status: request.status,
      reason: request.reason,
    }))
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

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

  const formatPeriod = (period: string) => {
    const [year, month] = period.split("-");
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Safety check - if user is not authenticated, redirect to login
  if (!user) {
    navigate("/login");
    return null;
  }

  // Additional safety check - prevent crashes
  try {
    if (!user.email) {
      console.error("User has no email, redirecting to login");
      navigate("/login");
      return null;
    }
  } catch (error) {
    console.error("Error in user safety check:", error);
    navigate("/login");
    return null;
  }

  if (employeesLoading || payrollLoading || vacationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando información del empleado...</p>
        </div>
      </div>
    );
  }

  // Create fallback employee data if not found to prevent crashes
  const employeeData = currentEmployee
    ? {
        name: currentEmployee.name,
        dni: currentEmployee.dni,
        documentType: currentEmployee.documentType || "DNI",
        position: currentEmployee.position,
        employeeId: currentEmployee.id,
        startDate: currentEmployee.startDate,
        vacationDays: vacationInfo.eligibleForVacations
          ? vacationInfo.vacationDays
          : 0,
        vacationsTaken: currentEmployee.vacationsTaken || 0,
        phone: "",
        email: currentEmployee.email || "",
        address: currentEmployee.address || "",
        isEligibleForVacations: vacationInfo.eligibleForVacations,
        monthsOfService: vacationInfo.totalMonths || 0,
      }
    : {
        name: user?.name || "Empleado",
        dni: user?.username || "--------",
        documentType: "DNI",
        position: "Empleado",
        employeeId: user?.employeeId || "",
        startDate: new Date().toISOString().split("T")[0],
        vacationDays: 0,
        vacationsTaken: 0,
        phone: "",
        email: user?.email || "",
        address: "",
        isEligibleForVacations: false,
        monthsOfService: 0,
      };

  // Show warning if no employee found but continue with fallback data
  if (!currentEmployee) {
    console.warn("No employee data found, using fallback");
  }

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
              {currentEmployee?.startDate ? (
                (() => {
                  const vacationInfo = employeeService.calculateVacationDays(
                    currentEmployee.startDate,
                  );
                  const years = vacationInfo.years;
                  const months = vacationInfo.totalMonths % 12;

                  if (years > 0) {
                    return (
                      <>
                        <div className="text-2xl font-bold">
                          {years}.{Math.floor((months / 12) * 10)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {years} año{years > 1 ? "s" : ""}
                          {months > 0
                            ? ` ${months} mes${months > 1 ? "es" : ""}`
                            : ""}
                        </p>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <div className="text-2xl font-bold">{months}</div>
                        <p className="text-xs text-muted-foreground">
                          {months} mes{months > 1 ? "es" : ""} trabajados
                        </p>
                      </>
                    );
                  }
                })()
              ) : (
                <>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Sin fecha de ingreso
                  </p>
                </>
              )}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="payroll">Liquidaciones</TabsTrigger>
            <TabsTrigger value="vacations">Vacaciones</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
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
                    <label className="text-sm font-medium">
                      {employeeData.documentType?.toUpperCase() || "DNI"}
                    </label>
                    <p className="text-lg font-mono">{employeeData.dni}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Puesto</label>
                    <p className="text-lg">{employeeData.position}</p>
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
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-lg">
                      {employeeData.email || (
                        <span className="text-muted-foreground italic">
                          No registrado
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Dirección</label>
                    <p className="text-lg">
                      {employeeData.address || (
                        <span className="text-muted-foreground italic">
                          No registrada
                        </span>
                      )}
                    </p>
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
                        <TableHead>Días</TableHead>
                        <TableHead>Adelantos</TableHead>
                        <TableHead>Descuentos</TableHead>
                        <TableHead>Horas Extra</TableHead>
                        <TableHead>Feriados</TableHead>
                        <TableHead>Bono</TableHead>
                        <TableHead>Aguinaldo</TableHead>
                        <TableHead>Presentismo</TableHead>
                        <TableHead>Total Neto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Recibo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollHistory.length > 0 ? (
                        payrollHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {formatPeriod(record.period)}
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="font-medium">
                                  {record.workDays}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-red-600">
                              {formatCurrency(record.adelanto)}
                            </TableCell>
                            <TableCell className="text-red-600">
                              {formatCurrency(record.discounts || 0)}
                            </TableCell>
                            <TableCell>
                              {record.overtimeHours > 0 ? (
                                <div className="text-center">
                                  <div className="font-medium text-purple-600">
                                    {formatCurrency(record.overtimeAmount || 0)}
                                  </div>
                                  <div className="text-xs text-purple-600">
                                    {record.overtimeHours}h
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.holidayDays > 0 ? (
                                <div className="text-center">
                                  <div className="font-medium text-blue-600">
                                    {formatCurrency(record.holidayBonus || 0)}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    {record.holidayDays} días
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {formatCurrency(record.bonusAmount || 0)}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {record.aguinaldo > 0
                                ? formatCurrency(record.aguinaldo)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-blue-600">
                              {record.presentismo > 0 ? (
                                formatCurrency(record.presentismo)
                              ) : (
                                <span className="text-red-600">Perdido</span>
                              )}
                            </TableCell>
                            <TableCell className="font-bold">
                              {formatCurrency(record.netTotal)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  record.status === "paid"
                                    ? "default"
                                    : record.status === "pending" ||
                                        record.status === "approved" ||
                                        record.status === "processed"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {record.status === "paid"
                                  ? "Pagado"
                                  : record.status === "approved"
                                    ? "Aprobado"
                                    : record.status === "processed"
                                      ? "Procesado"
                                      : record.status === "pending"
                                        ? "Pendiente"
                                        : "Borrador"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!record.hasDocument}
                                title="Generar recibo"
                                onClick={() => handleDownloadReceipt(record)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center text-muted-foreground py-8"
                          >
                            No hay liquidaciones disponibles
                          </TableCell>
                        </TableRow>
                      )}
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
                {!employeeData.isEligibleForVacations && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Clock className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Vacaciones no disponibles</p>
                        <p className="text-sm">
                          Necesitas 6 meses de antigüedad para acceder a
                          vacaciones. Tiempo actual:{" "}
                          {employeeData.monthsOfService} meses.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                        {vacationHistory.length > 0 ? (
                          vacationHistory.map((vacation) => (
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
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                            >
                              No hay solicitudes de vacaciones registradas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Request New Vacation */}
                <div className="border-t pt-6">
                  <Button className="w-full sm:w-auto">
                    <Plane className="h-4 w-4 mr-2" />
                    Solicitar D��as de Vacaciones
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contacta con tu supervisor para solicitar nuevos días de
                    vacaciones
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mis Documentos
                </CardTitle>
                <CardDescription>
                  Consulta y descarga tus documentos laborales
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsError ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <FileText className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Error cargando documentos</p>
                        <p className="text-sm mt-1">
                          {documentsError.includes("does not exist")
                            ? "El sistema de documentos no está configurado aún."
                            : "No se pudieron cargar los documentos en este momento."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : documentsLoading ? (
                  <div className="text-center py-8">
                    <p>Cargando documentos...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No tienes documentos disponibles</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Documento</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">
                            Descargar
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                              {doc.originalFileName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getCategoryDisplayName(doc.category)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(doc.uploadedAt).toLocaleDateString(
                                "es-AR",
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  downloadDocument(doc.id, doc.originalFileName)
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeePortal;
