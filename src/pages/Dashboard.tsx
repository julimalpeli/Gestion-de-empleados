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
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEmployees } from "@/hooks/use-employees";
import { usePayroll } from "@/hooks/use-payroll";
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
  const { isAdmin } = usePermissions();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
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
  const totalToPay = currentMonthPayrolls.reduce(
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

  // Average salary calculation
  const averageSalary =
    currentMonthPayrolls.length > 0
      ? currentMonthPayrolls.reduce(
          (sum, record) => sum + (record.netTotal || 0),
          0,
        ) / currentMonthPayrolls.length
      : 0;

  // Hours statistics
  const totalHoursWorked = currentMonthPayrolls.reduce((sum, record) => {
    return sum + (record.baseDays || 0) * 8 + (record.overtimeHours || 0);
  }, 0);

  const totalOvertimeHours = currentMonthPayrolls.reduce((sum, record) => {
    return sum + (record.overtimeHours || 0);
  }, 0);

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
          <p className="text-lg font-semibold">{currentPeriod}</p>
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
              {inactiveEmployees.length} inactivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Liquidaciones Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayrolls.length}</div>
            <p className="text-xs text-muted-foreground">
              Por procesar y pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalToPay)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthPayrolls.length} liquidaciones este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Trabajadas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHoursWorked.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
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
            <div className="text-2xl font-bold text-gray-600">{draftCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {approvedCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesadas</CardTitle>
            <Settings className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {processedCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Estado Actual
            </CardTitle>
            <CardDescription>
              Resumen de liquidaciones y empleados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingPayrolls.length > 0 && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {pendingPayrolls.length} liquidaciones por procesar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Revisar y aprobar para pago
                  </p>
                </div>
                <Badge variant="secondary">Acción Requerida</Badge>
              </div>
            )}

            {currentMonthPayrolls.length > 0 && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {currentMonthPayrolls.length} liquidaciones del mes actual
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatCurrency(totalToPay)}
                  </p>
                </div>
                <Badge variant="outline">En Progreso</Badge>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {activeEmployees.length} empleados activos
                </p>
                <p className="text-xs text-muted-foreground">
                  {employees.length} empleados en total
                </p>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>

            {paidCount > 0 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {paidCount} liquidaciones pagadas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registros completados
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Completado
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payroll Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidaciones Recientes</CardTitle>
            <CardDescription>Últimas liquidaciones procesadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payrollRecords.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">No hay liquidaciones registradas</p>
              </div>
            ) : (
              payrollRecords
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime(),
                )
                .slice(0, 5)
                .map((record, index) => (
                  <div key={record.id} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        record.status === "paid"
                          ? "bg-green-500"
                          : record.status === "processed"
                            ? "bg-purple-500"
                            : record.status === "approved"
                              ? "bg-blue-500"
                              : record.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                      }`}
                    ></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        Liquidación de {record.employeeName} -{" "}
                        {record.status === "paid"
                          ? "Pagada"
                          : record.status === "processed"
                            ? "Procesada"
                            : record.status === "approved"
                              ? "Aprobada"
                              : record.status === "pending"
                                ? "Pendiente"
                                : "Borrador"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(record.netTotal)} •{" "}
                        {new Date(record.period).toLocaleDateString("es-AR", {
                          month: "long",
                          year: "numeric",
                        })}
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
                ))
            )}

            {employees.length > 0 && payrollRecords.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {employees.length} empleados registrados, listo para crear
                  liquidaciones
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sistema de auditoría - Solo para admins */}
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
