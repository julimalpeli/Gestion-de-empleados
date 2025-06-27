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
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  FileBarChart,
  TrendingUp,
  Calendar,
  DollarSign,
  Calculator,
  Info,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiquidationsReport from "@/components/LiquidationsReport";

// Mock employees data - should match with Employees.tsx
const employees = [
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
];

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2024-2");

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

  const calculateAguinaldo = (employee: any, period: string) => {
    const [year, semester] = period.split("-");
    const currentYear = parseInt(year);
    const currentSemester = parseInt(semester);

    // Determinar fechas del semestre
    const semesterStart =
      currentSemester === 1
        ? new Date(currentYear, 0, 1) // 1 enero
        : new Date(currentYear, 6, 1); // 1 julio

    const semesterEnd =
      currentSemester === 1
        ? new Date(currentYear, 5, 30) // 30 junio
        : new Date(currentYear, 11, 31); // 31 diciembre

    const startDate = new Date(employee.startDate);

    // Si empezó después del semestre, no corresponde aguinaldo
    if (startDate > semesterEnd) {
      return {
        corresponds: false,
        amount: 0,
        daysWorked: 0,
        totalDays: 0,
        proportional: false,
        reason: "No trabajó en este período",
      };
    }

    // Fecha efectiva de inicio (la mayor entre inicio de semestre e inicio de trabajo)
    const effectiveStart =
      startDate > semesterStart ? startDate : semesterStart;

    // Calcular días trabajados
    const totalSemesterDays =
      Math.ceil(
        (semesterEnd.getTime() - semesterStart.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;
    const daysWorked =
      Math.ceil(
        (semesterEnd.getTime() - effectiveStart.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    // Mejor remuneración del semestre (sueldo blanco + informal, sin presentismo)
    const bestSalary = employee.whiteWage + employee.informalWage;

    // Calcular aguinaldo
    const fullAguinaldo = (bestSalary / 12) * 6; // 6 meses
    const proportionalAguinaldo = (bestSalary / 12) * (daysWorked / 30); // Proporcional por días

    const isProportional = daysWorked < totalSemesterDays;
    const finalAmount = isProportional ? proportionalAguinaldo : fullAguinaldo;

    return {
      corresponds: true,
      amount: Math.round(finalAmount),
      daysWorked,
      totalDays: totalSemesterDays,
      proportional: isProportional,
      bestSalary,
      fullAguinaldo: Math.round(fullAguinaldo),
      reason: isProportional
        ? "Aguinaldo proporcional por días trabajados"
        : "Aguinaldo completo",
    };
  };

  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const aguinaldoCalculations = activeEmployees.map((emp) => ({
    ...emp,
    aguinaldo: calculateAguinaldo(emp, selectedPeriod),
  }));

  const totalAguinaldos = aguinaldoCalculations.reduce(
    (sum, emp) => sum + emp.aguinaldo.amount,
    0,
  );

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

      <Tabs defaultValue="aguinaldos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aguinaldos">
            Calculadora de Aguinaldos
          </TabsTrigger>
          <TabsTrigger value="costos">Reportes de Costos</TabsTrigger>
          <TabsTrigger value="asistencia">Reportes de Asistencia</TabsTrigger>
        </TabsList>

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
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-1">
                        Primer Semestre 2024
                      </SelectItem>
                      <SelectItem value="2024-2">
                        Segundo Semestre 2024
                      </SelectItem>
                      <SelectItem value="2025-1">
                        Primer Semestre 2025
                      </SelectItem>
                      <SelectItem value="2025-2">
                        Segundo Semestre 2025
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="ml-auto">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total a pagar:
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAguinaldos)}
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
                    <li>Se incluye: Sueldo en blanco + Sueldo informal</li>
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
                  {aguinaldoCalculations.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.position}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(emp.startDate)}</TableCell>
                      <TableCell>
                        {formatCurrency(emp.aguinaldo.bestSalary || 0)}
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
                  ))}
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

        <TabsContent value="costos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Reportes de Costos
              </CardTitle>
              <CardDescription>
                Análisis de costos laborales por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Próximamente disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Reportes de Asistencia
              </CardTitle>
              <CardDescription>
                Control de días trabajados y ausentismo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Próximamente disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
