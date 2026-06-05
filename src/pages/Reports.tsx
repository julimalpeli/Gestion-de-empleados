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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  FileBarChart,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Calculator,
  Info,
  Users,
  Scissors,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiquidationsReport from "@/components/LiquidationsReport";
import SimpleLiquidationsReport from "@/components/SimpleLiquidationsReport";
import MultipleReceiptsReport from "@/components/MultipleReceiptsReport";
import AguinaldoReport from "@/components/AguinaldoReport";
import { useEmployees } from "@/hooks/use-employees";
import { usePayroll } from "@/hooks/use-payroll";
import { calculateAguinaldo } from "@/utils/aguinaldo";
import {
  preGenerateAguinaldosForPeriod,
  generateAguinaldoPeriods,
  isPeriodPaid,
  getPaidCountForPeriod,
} from "@/utils/preGenerateAguinaldos";

// Mock employees data - COMENTADO porque ahora usamos Supabase
/* const mockEmployees = [
  {
    id: 1,
    name: "Juan Pérez",
    position: "Cocinero",
    whiteWage: 300000,
    informalWage: 150000,
    dailyWage: 15000,
    presentismo: 25000,
    losesPresentismo: false,
    status: "active",
    startDate: "2023-01-15",
  },
  {
    id: 2,
    name: "María González",
    position: "Mesera",
    whiteWage: 240000,
    informalWage: 120000,
    dailyWage: 12000,
    presentismo: 20000,
    losesPresentismo: true,
    status: "active",
    startDate: "2023-03-20",
  },
  {
    id: 3,
    name: "Carlos López",
    position: "Cajero",
    whiteWage: 285000,
    informalWage: 120000,
    dailyWage: 13500,
    presentismo: 22000,
    losesPresentismo: false,
    status: "active",
    startDate: "2022-11-10",
  },
  {
    id: 4,
    name: "Ana Martínez",
    position: "Ayudante de Cocina",
    whiteWage: 210000,
    informalWage: 120000,
    dailyWage: 11000,
    presentismo: 18000,
    losesPresentismo: false,
    status: "inactive",
    startDate: "2023-06-01",
  },
  {
    id: 5,
    name: "Luis Fernández",
    position: "Encargado",
    whiteWage: 525000,
    informalWage: 225000,
    dailyWage: 25000,
    presentismo: 35000,
    losesPresentismo: false,
    status: "active",
    startDate: "2025-05-22",
  },
]; */

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2026-06");

  // Usar hooks de Supabase
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useEmployees();

  const {
    payrollRecords,
    loading: payrollLoading,
    error: payrollError,
    fetchPayrollRecords: refetchPayroll,
  } = usePayroll();
  const [isLiquidationsReportOpen, setIsLiquidationsReportOpen] =
    useState(false);
  const [isSimpleLiquidationsReportOpen, setIsSimpleLiquidationsReportOpen] =
    useState(false);
  const [isMultipleReceiptsReportOpen, setIsMultipleReceiptsReportOpen] =
    useState(false);
  const [isPreGenerateDialogOpen, setIsPreGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    message: string;
    createdCount?: number;
    failedCount?: number;
  } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount || 0));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR");
  };

  const handlePreGenerateAguinaldos = async () => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const result = await preGenerateAguinaldosForPeriod({
        period: selectedPeriod,
        employees,
        payrollRecords,
      });

      setGenerationResult({
        success: result.success,
        message: result.message,
        createdCount: result.createdCount,
        failedCount: result.failedCount,
      });

      if (result.success) {
        // Refresh payroll records after successful generation
        setTimeout(() => {
          refetchPayroll();
          setIsPreGenerateDialogOpen(false);
        }, 1000);
      }
    } catch (error) {
      setGenerationResult({
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const aguinaldoCalculations = activeEmployees.map((emp) => ({
    ...emp,
    aguinaldo: calculateAguinaldo(emp, selectedPeriod, payrollRecords),
  }));

  const totalAguinaldos = aguinaldoCalculations.reduce(
    (sum, emp) => sum + emp.aguinaldo.amount,
    0,
  );

  // Manejo de loading y error
  if (employeesLoading || payrollLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p>Cargando datos para reportes...</p>
        </div>
      </div>
    );
  }

  if (employeesError || payrollError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">
            Error: {employeesError || payrollError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis y reportes del sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="liquidaciones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="liquidaciones">
            Reporte de Liquidaciones
          </TabsTrigger>
          <TabsTrigger value="reporte-aguinaldo">
            Reporte de Aguinaldo
          </TabsTrigger>
          <TabsTrigger value="aguinaldos">
            Calculadora de Aguinaldos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liquidaciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                Reporte de Liquidaciones
              </CardTitle>
              <CardDescription>
                Reporte detallado con montos de efectivo, depósito y aguinaldos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => setIsSimpleLiquidationsReportOpen(true)}
                  size="lg"
                  variant="outline"
                  className="text-lg px-6 py-4"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Reporte Simple
                </Button>
                <Button
                  onClick={() => setIsLiquidationsReportOpen(true)}
                  size="lg"
                  className="text-lg px-6 py-4"
                >
                  <FileBarChart className="h-5 w-5 mr-2" />
                  Reporte Detallado
                </Button>
                <Button
                  onClick={() => setIsMultipleReceiptsReportOpen(true)}
                  size="lg"
                  variant="secondary"
                  className="text-lg px-6 py-4"
                >
                  <Scissors className="h-5 w-5 mr-2" />
                  Recibos para Imprimir
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-center text-muted-foreground text-sm">
                  <strong>Simple:</strong> Efectivo, depósito, aguinaldo y total
                  neto
                </p>
                <p className="text-center text-muted-foreground text-sm">
                  <strong>Detallado:</strong> Todos los conceptos, días,
                  bonificaciones, etc.
                </p>
                <p className="text-center text-muted-foreground text-sm">
                  <strong>Recibos:</strong> Para imprimir y recortar, entrega
                  individual
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporte-aguinaldo" className="space-y-6">
          <AguinaldoReport />
        </TabsContent>

        <TabsContent value="aguinaldos" className="space-y-6">
          {/* Period Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Aguinaldos (SAC)
              </CardTitle>
              <CardDescription>
                Cálculo automático del Sueldo Anual Complementario por período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Período a calcular:
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedPeriod}
                      onValueChange={setSelectedPeriod}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generateAguinaldoPeriods().map((period) => {
                          const isPaid = isPeriodPaid(
                            period.value,
                            payrollRecords,
                          );
                          const paidCount = getPaidCountForPeriod(
                            period.value,
                            payrollRecords,
                          );
                          return (
                            <SelectItem
                              key={period.value}
                              value={period.value}
                            >
                              <div className="flex items-center gap-2">
                                <span>{period.label}</span>
                                {isPaid ? (
                                  <Badge
                                    variant="default"
                                    className="text-xs"
                                  >
                                    ✓ Pagado ({paidCount})
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    📊 Proyectado
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => setIsPreGenerateDialogOpen(true)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      title="Pre-generar aguinaldos para todos los empleados"
                    >
                      <Wand2 className="h-4 w-4" />
                      Pre-generar
                    </Button>
                  </div>
                </div>

                <div className="ml-auto">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total {isPeriodPaid(selectedPeriod, payrollRecords) ? "Pagado" : "Proyectado"}:
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAguinaldos)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isPeriodPaid(selectedPeriod, payrollRecords)
                        ? `${getPaidCountForPeriod(selectedPeriod, payrollRecords)} empleados`
                        : "No pagado aún"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    Método de Cálculo:
                  </p>
                  <p className="text-blue-700 mt-1">
                    <strong>
                      Aguinaldo = (Mejor remuneración ÷ 12) × Meses/días
                      trabajados
                    </strong>
                  </p>
                  <ul className="list-disc list-inside mt-2 text-blue-600 space-y-1">
                    <li>Se incluye: Sueldo Depósito + Efectivo</li>
                    <li>NO se incluye: Presentismo (no remunerativo)</li>
                    <li>Proporcional para empleados con menos de 6 meses</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aguinaldo Results */}
          <Card>
            <CardHeader>
              <CardTitle>Cálculo por Empleado</CardTitle>
              <CardDescription>
                Detalle del aguinaldo correspondiente a cada empleado activo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead>Mejor Sueldo</TableHead>
                    <TableHead>Días Trabajados</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Aguinaldo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aguinaldoCalculations.map((emp) => {
                    const isPaid = isPeriodPaid(selectedPeriod, payrollRecords);
                    return (
                      <TableRow
                        key={emp.id}
                        className={
                          isPaid ? "" : "bg-blue-50 hover:bg-blue-100"
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div>
                              <p>{emp.name}</p>
                              <p className="text-xs text-muted-foreground">
                                DNI: {emp.dni || "N/A"} • {emp.position}
                              </p>
                            </div>
                            {!isPaid && (
                              <Badge variant="secondary" className="text-xs whitespace-nowrap ml-2">
                                📊 Proyectado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(emp.startDate)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(emp.aguinaldo.bestSalary || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {emp.aguinaldo.bestSalaryPeriod || "Sueldo base"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {emp.aguinaldo.corresponds ? (
                            <div className="text-center">
                              <div className="font-medium">
                                {emp.aguinaldo.daysWorked}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                de {emp.aguinaldo.totalDays} días
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {emp.aguinaldo.corresponds ? (
                            <Badge
                              variant={
                                emp.aguinaldo.proportional
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {emp.aguinaldo.proportional
                                ? "Proporcional"
                                : "Completo"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No corresponde</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-bold">
                          {emp.aguinaldo.corresponds ? (
                            <div>
                              <div className="text-lg">
                                {formatCurrency(emp.aguinaldo.amount)}
                              </div>
                              {emp.aguinaldo.proportional && (
                                <div className="text-xs text-muted-foreground">
                                  Completo:{" "}
                                  {formatCurrency(emp.aguinaldo.fullAguinaldo)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">$0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">{emp.aguinaldo.reason}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Empleados con Aguinaldo
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    aguinaldoCalculations.filter(
                      (emp) => emp.aguinaldo.corresponds,
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  de {activeEmployees.length} activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aguinaldos Proporcionales
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    aguinaldoCalculations.filter(
                      (emp) => emp.aguinaldo.proportional,
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Por días trabajados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Promedio por Empleado
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    Math.round(
                      totalAguinaldos /
                        Math.max(
                          aguinaldoCalculations.filter(
                            (emp) => emp.aguinaldo.corresponds,
                          ).length,
                          1,
                        ),
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por empleado con aguinaldo
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costos" className="space-y-6">
          {/* Resumen de Costos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Liquidaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    payrollRecords.reduce(
                      (sum, record) => sum + (record.netTotal || 0),
                      0,
                    ),
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Sueldo Depósito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    payrollRecords.reduce(
                      (sum, record) => sum + (record.whiteAmount || 0),
                      0,
                    ),
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Declarados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Sueldo en Efectivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    payrollRecords.reduce(
                      (sum, record) => sum + (record.informalAmount || 0),
                      0,
                    ),
                  )}
                </p>
                <p className="text-xs text-muted-foreground">En efectivo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Costo por Empleado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    payrollRecords.length > 0
                      ? Math.round(
                          payrollRecords.reduce(
                            (sum, record) => sum + (record.netTotal || 0),
                            0,
                          ) / payrollRecords.length,
                        )
                      : 0,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Promedio mensual
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Costos por Empleado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Costos por Empleado
              </CardTitle>
              <CardDescription>
                Desglose detallado de costos laborales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Sueldo Base</TableHead>
                      <TableHead>Depósito</TableHead>
                      <TableHead>Efectivo</TableHead>
                      <TableHead>Presentismo</TableHead>
                      <TableHead>Horas Extras</TableHead>
                      <TableHead>Bonos</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const employeePayrolls = payrollRecords.filter(
                        (record) => record.employeeId === employee.id || record.employeeName === employee.name,
                      );
                      const totalPayroll = employeePayrolls.reduce(
                        (sum, record) => sum + (record.netTotal || 0),
                        0,
                      );
                      const depositoTotal = employeePayrolls.reduce(
                        (sum, record) => sum + (record.whiteAmount || 0),
                        0,
                      );
                      const informalTotal = employeePayrolls.reduce(
                        (sum, record) => sum + (record.informalAmount || 0),
                        0,
                      );
                      const presentismoTotal = employeePayrolls.reduce(
                        (sum, record) => sum + (record.presentismoAmount || 0),
                        0,
                      );
                      const overtimeTotal = employeePayrolls.reduce(
                        (sum, record) => sum + (record.overtimeAmount || 0),
                        0,
                      );
                      const bonusTotal = employeePayrolls.reduce(
                        (sum, record) => sum + (record.bonusAmount || 0),
                        0,
                      );

                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{employee.name}</p>
                              <p className="text-xs text-muted-foreground">
                                DNI: {employee.dni || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(employee.sueldoBase || 0)}
                          </TableCell>
                          <TableCell>{formatCurrency(depositoTotal)}</TableCell>
                          <TableCell>{formatCurrency(informalTotal)}</TableCell>
                          <TableCell>
                            {formatCurrency(presentismoTotal)}
                          </TableCell>
                          <TableCell>{formatCurrency(overtimeTotal)}</TableCell>
                          <TableCell>{formatCurrency(bonusTotal)}</TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(totalPayroll)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="space-y-6">
          {/* Resumen de Asistencia */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Días Trabajados Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {payrollRecords.reduce(
                    (sum, record) => sum + (record.baseDays || 0),
                    0,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Feriados Trabajados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {payrollRecords.reduce(
                    (sum, record) => sum + (record.holidayDays || 0),
                    0,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Días extras</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Horas Extras Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {payrollRecords.reduce(
                    (sum, record) => sum + (record.overtimeHours || 0),
                    0,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Horas adicionales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Promedio Asistencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {payrollRecords.length > 0
                    ? Math.round(
                        payrollRecords.reduce(
                          (sum, record) => sum + (record.baseDays || 0),
                          0,
                        ) / payrollRecords.length,
                      )
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Días por empleado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Asistencia por Empleado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Asistencia por Empleado
              </CardTitle>
              <CardDescription>
                Detalle de días trabajados y ausentismo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Días Base</TableHead>
                      <TableHead>Feriados</TableHead>
                      <TableHead>Horas Extras</TableHead>
                      <TableHead>Presentismo</TableHead>
                      <TableHead>Ausentismo</TableHead>
                      <TableHead>% Asistencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const employeePayrolls = payrollRecords.filter(
                        (record) => record.employeeId === employee.id || record.employeeName === employee.name,
                      );
                      const totalBaseDays = employeePayrolls.reduce(
                        (sum, record) => sum + (record.baseDays || 0),
                        0,
                      );
                      const totalHolidayDays = employeePayrolls.reduce(
                        (sum, record) => sum + (record.holidayDays || 0),
                        0,
                      );
                      const totalOvertimeHours = employeePayrolls.reduce(
                        (sum, record) => sum + (record.overtimeHours || 0),
                        0,
                      );
                      const hasPresentismo = employeePayrolls.some(
                        (record) => record.presentismoAmount > 0,
                      );

                      // Check if employee receives presentismo at all
                      const employeeReceivesPresentismo = employee.receives_presentismo !== false; // Default true for backward compatibility

                      // Determine presentismo status badge
                      let presentismoVariant: "default" | "destructive" | "secondary" | "outline" = "default";
                      let presentismoLabel = "Mantiene";

                      if (!employeeReceivesPresentismo) {
                        presentismoVariant = "secondary";
                        presentismoLabel = "No Percibe";
                      } else if (!hasPresentismo) {
                        presentismoVariant = "destructive";
                        presentismoLabel = "Perdido";
                      }

                      const expectedDays = 30; // Días esperados por mes
                      const absentDays = Math.max(
                        0,
                        expectedDays - totalBaseDays,
                      );
                      const attendancePercentage = Math.round(
                        (totalBaseDays / expectedDays) * 100,
                      );

                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{employee.name}</p>
                              <p className="text-xs text-muted-foreground">
                                DNI: {employee.dni || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{totalBaseDays}</div>
                              <div className="text-xs text-muted-foreground">
                                de {expectedDays} días
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {totalHolidayDays > 0 ? (
                              <Badge variant="secondary">
                                {totalHolidayDays} días
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {totalOvertimeHours > 0 ? (
                              <Badge variant="outline">
                                {totalOvertimeHours} hs
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={presentismoVariant}>
                              {presentismoLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {absentDays > 0 ? (
                              <span className="text-red-600 font-medium">
                                {absentDays} días
                              </span>
                            ) : (
                              <span className="text-green-600">Perfecto</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  attendancePercentage >= 90
                                    ? "default"
                                    : attendancePercentage >= 75
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {attendancePercentage}%
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Liquidations Report Modals */}
      <LiquidationsReport
        isOpen={isLiquidationsReportOpen}
        onClose={() => setIsLiquidationsReportOpen(false)}
      />
      <SimpleLiquidationsReport
        isOpen={isSimpleLiquidationsReportOpen}
        onClose={() => setIsSimpleLiquidationsReportOpen(false)}
      />
      <MultipleReceiptsReport
        isOpen={isMultipleReceiptsReportOpen}
        onClose={() => setIsMultipleReceiptsReportOpen(false)}
      />

      {/* Pre-Generate Aguinaldos Dialog */}
      <Dialog
        open={isPreGenerateDialogOpen}
        onOpenChange={setIsPreGenerateDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pre-generar Aguinaldos</DialogTitle>
            <DialogDescription>
              Se crearán registros de liquidación para todos los empleados
              activos del período seleccionado
            </DialogDescription>
          </DialogHeader>

          {!generationResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Período seleccionado:
                </p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {generateAguinaldoPeriods().find(
                    (p) => p.value === selectedPeriod,
                  )?.label || selectedPeriod}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Se generarán registros para{" "}
                  <strong>{activeEmployees.length} empleados activos</strong>
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Los registros se crearán en estado "borrador". Podrás
                  editarlos antes de confirmar el pago.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPreGenerateDialogOpen(false);
                    setGenerationResult(null);
                  }}
                  disabled={isGenerating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePreGenerateAguinaldos}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generar Ahora
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {generationResult.success ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">¡Éxito!</p>
                      <p className="text-green-700 mt-1">
                        {generationResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-900">
                      <strong>{generationResult.createdCount}</strong> aguinaldo
                      {generationResult.createdCount !== 1 ? "s" : ""} generado
                      {generationResult.createdCount !== 1 ? "s" : ""}
                      {generationResult.failedCount ? (
                        <>
                          <br />
                          <strong>{generationResult.failedCount}</strong> no pudo
                          {generationResult.failedCount !== 1 ? "n" : ""} ser
                          procesado{generationResult.failedCount !== 1 ? "s" : ""}
                        </>
                      ) : null}
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setIsPreGenerateDialogOpen(false);
                      setGenerationResult(null);
                    }}
                    className="w-full"
                  >
                    Cerrar
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">Error</p>
                      <p className="text-red-700 mt-1">
                        {generationResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => {
                        setGenerationResult(null);
                      }}
                      variant="outline"
                    >
                      Reintentar
                    </Button>
                    <Button
                      onClick={() => {
                        setIsPreGenerateDialogOpen(false);
                        setGenerationResult(null);
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
