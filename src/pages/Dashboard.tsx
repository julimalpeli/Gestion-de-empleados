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

  // Check if we have connection errors
  const hasConnectionError = employeesError || payrollError;

  // Calculate real statistics
  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const inactiveEmployees = employees.filter(
    (emp) => emp.status === "inactive",
  );

  // Current month period
  const currentDate = new Date();
  const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  // Payroll statistics
  const currentMonthPayrolls = payrollRecords.filter(
    (record) => record.period === currentPeriod,
  );
  const pendingPayrolls = payrollRecords.filter(
    (record) =>
      record.status === "pending" ||
      record.status === "approved" ||
      record.status === "processed",
  );
  const totalToPay = currentMonthPayrolls.reduce(
    (sum, record) => sum + record.netTotal,
    0,
  );

  // Status counts
  const paidCount = payrollRecords.filter((r) => r.status === "paid").length;
  const processedCount = payrollRecords.filter(
    (r) => r.status === "processed",
  ).length;
  const approvedCount = payrollRecords.filter(
    (r) => r.status === "approved",
  ).length;
  const pendingCount = payrollRecords.filter(
    (r) => r.status === "pending",
  ).length;
  const draftCount = payrollRecords.filter((r) => r.status === "draft").length;

  // Calculate total hours worked (estimate based on payroll records)
  const totalHoursWorked = currentMonthPayrolls.reduce((sum, record) => {
    return sum + record.baseDays * 8 + (record.overtimeHours || 0);
  }, 0);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Debug: Log data to console
  console.log("Dashboard Debug:", {
    employeesLoading,
    payrollLoading,
    employeesCount: employees.length,
    payrollRecordsCount: payrollRecords.length,
    activeEmployees: activeEmployees.length,
    currentPeriod,
    currentMonthPayrolls: currentMonthPayrolls.length,
    totalToPay,
    employees: employees.slice(0, 2), // First 2 for debug
    payrollRecords: payrollRecords.slice(0, 2), // First 2 for debug
  });

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
          <p>Cargando estadísticas...</p>
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
          <p className="text-muted-foreground">Resumen de {currentMonth}</p>

          {/* Always show debug info */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div>
              <strong>Estado actual:</strong>
            </div>
            <div>
              • Empleados: {employees.length} (Activos: {activeEmployees.length}
              )
            </div>
            <div>• Liquidaciones: {payrollRecords.length}</div>
            <div>• Período actual: {currentPeriod}</div>
            <div>• Liquidaciones mes: {currentMonthPayrolls.length}</div>
            <div>• Total a pagar: {formatCurrency(totalToPay)}</div>
            {hasError && (
              <div className="text-red-600">• Error en hooks detectado</div>
            )}
            {(employeesLoading || payrollLoading) && (
              <div className="text-orange-600">• Cargando datos...</div>
            )}
          </div>
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
    </div>
  );
};

export default Dashboard;
