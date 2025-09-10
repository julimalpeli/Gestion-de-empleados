import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Edit3,
  Plane,
  Calendar,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEmployees } from "@/hooks/use-employees";
import { usePayroll } from "@/hooks/use-payroll";
import { useVacations } from "@/hooks/use-vacations";
import AuditStatus from "@/components/AuditStatus";
import usePermissions from "@/hooks/use-permissions";

const Dashboard = () => {
  const currentMonth = new Date().toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  // Get real data from hooks
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useEmployees();
  const {
    payrollRecords,
    loading: payrollLoading,
    error: payrollError,
  } = usePayroll();
  const {
    vacations,
    loading: vacationsLoading,
    error: vacationsError,
  } = useVacations();
  const { isAdmin } = usePermissions();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format period
  const formatPeriod = (period) => {
    const [year, month] = period.split("-");
    const months = [
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
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // Calculate real statistics
  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const inactiveEmployees = employees.filter(
    (emp) => emp.status === "inactive",
  );

  // Current month period
  const currentDate = new Date();
  const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  // Payroll statistics - Current month
  const currentMonthPayrolls = payrollRecords.filter(
    (record) => record.period === currentPeriod,
  );

  // Payroll statistics - By status
  const paidPayrolls = payrollRecords.filter((r) => r.status === "paid");
  const processedPayrolls = payrollRecords.filter(
    (r) => r.status === "processed",
  );
  const approvedPayrolls = payrollRecords.filter(
    (r) => r.status === "approved",
  );
  const pendingPayrolls = payrollRecords.filter((r) => r.status === "pending");
  const draftPayrolls = payrollRecords.filter((r) => r.status === "draft");

  // Financial calculations
  const totalCurrentMonth = currentMonthPayrolls.reduce(
    (sum, record) => sum + (record.netTotal || 0),
    0,
  );

  const totalPaid = paidPayrolls.reduce(
    (sum, record) => sum + (record.netTotal || 0),
    0,
  );

  const totalPending = [
    ...pendingPayrolls,
    ...approvedPayrolls,
    ...processedPayrolls,
  ].reduce((sum, record) => sum + (record.netTotal || 0), 0);

  // Completion percentage for current month
  const completionPercentage =
    activeEmployees.length > 0
      ? Math.round((currentMonthPayrolls.length / activeEmployees.length) * 100)
      : 0;

  // Vacation calculations
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Current vacations (employees on vacation today)
  const currentVacations = vacations.filter((vacation) => {
    if (vacation.status !== "approved") return false;
    const startDate = new Date(vacation.startDate);
    const endDate = new Date(vacation.endDate);
    return today >= startDate && today <= endDate;
  });

  // Upcoming vacations (rest of the year)
  const endOfYear = new Date();
  endOfYear.setFullYear(today.getFullYear(), 11, 31); // December 31st of current year
  const endOfYearStr = endOfYear.toISOString().split("T")[0];

  // Debug vacation data
  console.log("🏖️ Vacation debug info:");
  console.log("  - Total vacations loaded:", vacations.length);
  console.log("  - Today:", today.toISOString().split("T")[0]);
  console.log("  - End of year:", endOfYear.toISOString().split("T")[0]);

  const approvedVacations = vacations.filter(v => v.status === "approved");
  console.log("  - Approved vacations:", approvedVacations.length);

  if (vacations.length > 0) {
    console.log("  - Sample vacation:", vacations[0]);
  }

  const upcomingVacations = vacations.filter((vacation) => {
    if (vacation.status !== "approved") return false;
    const startDate = new Date(vacation.startDate);
    const isUpcoming = startDate > today && startDate <= next60Days;

    // Debug each vacation
    if (vacation.status === "approved") {
      console.log(`    - Vacation ${vacation.id}: ${vacation.startDate} - upcoming: ${isUpcoming}`);
    }

    return isUpcoming;
  });

  console.log("  - Upcoming vacations found:", upcomingVacations.length);

  // Get employee names for vacations
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee?.name || "Empleado no encontrado";
  };

  // Average salary calculation
  const averageSalary =
    currentMonthPayrolls.length > 0
      ? totalCurrentMonth / currentMonthPayrolls.length
      : 0;

  // Show loading state
  if (employeesLoading || payrollLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <p>Cargando estadísticas del sistema...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (employeesError || payrollError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Error de conexión</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error al cargar datos del sistema</p>
            <p className="text-sm text-gray-500 mt-1">
              {employeesError || payrollError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de {currentMonth} • {activeEmployees.length} empleados
            activos
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Período actual</p>
          <p className="text-lg font-semibold">{formatPeriod(currentPeriod)}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empleados Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground">
              {inactiveEmployees.length > 0
                ? `${inactiveEmployees.length} inactivos`
                : "Todos activos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Liquidaciones Mes
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthPayrolls.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {completionPercentage}% completado ({activeEmployees.length}{" "}
              empleados)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mes Actual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrentMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {averageSalary > 0
                ? `Promedio: ${formatCurrency(averageSalary)}`
                : "Sin liquidaciones este mes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Histórico
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidPayrolls.length} liquidaciones pagadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Status Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <Edit3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {draftPayrolls.length}
            </div>
            <p className="text-xs text-muted-foreground">Por completar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingPayrolls.length}
            </div>
            <p className="text-xs text-muted-foreground">Para revisar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {approvedPayrolls.length}
            </div>
            <p className="text-xs text-muted-foreground">Listas para pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesadas</CardTitle>
            <Settings className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {processedPayrolls.length}
            </div>
            <p className="text-xs text-muted-foreground">En proceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidPayrolls.length}
            </div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Vacation Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Vacaciones</CardTitle>
            <Plane className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentVacations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentVacations.length === 0
                ? "Ningún empleado de vacaciones"
                : `${currentVacations.length} empleado${currentVacations.length > 1 ? "s" : ""} ausente${currentVacations.length > 1 ? "s" : ""}`}
            </p>
            {currentVacations.length > 0 && (
              <div className="mt-2 space-y-1">
                {currentVacations.slice(0, 2).map((vacation) => (
                  <div
                    key={vacation.id}
                    className="text-xs bg-blue-50 p-2 rounded"
                  >
                    <span className="font-medium">
                      {getEmployeeName(vacation.employeeId)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      hasta{" "}
                      {new Date(vacation.endDate).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                ))}
                {currentVacations.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    y {currentVacations.length - 2} más...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximas Vacaciones
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {upcomingVacations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {upcomingVacations.length === 0
                ? "Sin vacaciones próximas"
                : `Próximos 60 días`}
            </p>
            {upcomingVacations.length > 0 && (
              <div className="mt-2 space-y-1">
                {upcomingVacations.slice(0, 2).map((vacation) => (
                  <div
                    key={vacation.id}
                    className="text-xs bg-orange-50 p-2 rounded"
                  >
                    <span className="font-medium">
                      {getEmployeeName(vacation.employeeId)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      desde{" "}
                      {new Date(vacation.startDate).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                ))}
                {upcomingVacations.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    y {upcomingVacations.length - 2} más...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Estado Actual
            </CardTitle>
            <CardDescription>Resumen del mes en curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentMonthPayrolls.length === 0 ? (
              <div className="text-center py-6">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium">
                  No hay liquidaciones para {formatPeriod(currentPeriod)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crear liquidaciones para {activeEmployees.length} empleados
                  activos
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progreso del mes:</span>
                  <Badge variant="outline">{completionPercentage}%</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total calculado:</span>
                  <span className="font-bold">
                    {formatCurrency(totalCurrentMonth)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Promedio por empleado:
                  </span>
                  <span className="font-bold">
                    {formatCurrency(averageSalary)}
                  </span>
                </div>

                {totalPending > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Pendiente de pago:
                    </span>
                    <span className="font-bold text-yellow-600">
                      {formatCurrency(totalPending)}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas liquidaciones de empleados activos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter payroll records to show only active employees
              const activeEmployeeIds = activeEmployees.map((emp) => emp.id);
              const filteredPayrollRecords = payrollRecords.filter((record) =>
                activeEmployeeIds.includes(record.employeeId),
              );

              if (filteredPayrollRecords.length === 0) {
                return (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium">
                      No hay liquidaciones de empleados activos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Las liquidaciones aparecerán aquí cuando se creen
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredPayrollRecords
                    .sort(
                      (a, b) =>
                        new Date(b.period).getTime() -
                        new Date(a.period).getTime(),
                    )
                    .slice(0, 5)
                    .map((record) => {
                      // Find the employee to get accurate name
                      const employee = activeEmployees.find(
                        (emp) => emp.id === record.employeeId,
                      );
                      const employeeName =
                        employee?.name ||
                        record.employeeName ||
                        "Empleado no encontrado";

                      return (
                        <div
                          key={record.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {employeeName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatPeriod(record.period)} •{" "}
                              {formatCurrency(record.netTotal)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              record.status === "paid"
                                ? "border-green-200 text-green-700"
                                : record.status === "processed"
                                  ? "border-purple-200 text-purple-700"
                                  : record.status === "approved"
                                    ? "border-blue-200 text-blue-700"
                                    : record.status === "pending"
                                      ? "border-yellow-200 text-yellow-700"
                                      : "border-gray-200 text-gray-700"
                            }
                          >
                            {record.status === "paid"
                              ? "Pagada"
                              : record.status === "processed"
                                ? "Procesada"
                                : record.status === "approved"
                                  ? "Aprobada"
                                  : record.status === "pending"
                                    ? "Pendiente"
                                    : "Borrador"}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-1">
          <div className="flex justify-center">
            <AuditStatus />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
