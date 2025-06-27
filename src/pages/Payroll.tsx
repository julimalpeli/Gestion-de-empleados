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
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Plus,
  Calculator,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  Users,
  Info,
  TrendingUp,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const payrollRecords = [
  {
    id: 1,
    employeeName: "Juan Pérez",
    period: "Junio 2024",
    baseDays: 22,
    holidayDays: 2,
    baseAmount: 330000,
    holidayBonus: 60000,
    aguinaldo: 225000, // Aguinaldo de junio
    discounts: 50000,
    advances: 50000,
    whiteAmount: 220000,
    informalAmount: 120000,
    netTotal: 565000, // Incluye aguinaldo
    status: "processed",
  },
  {
    id: 2,
    employeeName: "María González",
    period: "Junio 2024",
    baseDays: 20,
    holidayDays: 1,
    baseAmount: 240000,
    holidayBonus: 12000,
    aguinaldo: 180000, // Aguinaldo de junio
    discounts: 0,
    advances: 30000,
    whiteAmount: 160000,
    informalAmount: 62000,
    netTotal: 402000, // Incluye aguinaldo
    status: "pending",
  },
  {
    id: 3,
    employeeName: "Carlos López",
    period: "Febrero 2024",
    baseDays: 21,
    holidayDays: 0,
    baseAmount: 283500,
    holidayBonus: 0,
    aguinaldo: 0, // No hay aguinaldo en febrero
    discounts: 15000,
    advances: 0,
    whiteAmount: 199500,
    informalAmount: 69000,
    netTotal: 268500,
    status: "draft",
  },
];

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

const Payroll = () => {
  const [isNewPayrollOpen, setIsNewPayrollOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [workDays, setWorkDays] = useState("30");
  const [holidayDays, setHolidayDays] = useState("");
  const [advances, setAdvances] = useState("");
  const [discounts, setDiscounts] = useState("");
  const [whiteWage, setWhiteWage] = useState("");
  const [presentismoStatus, setPresentismoStatus] = useState("mantiene");
  const [selectedAguinaldoPeriod, setSelectedAguinaldoPeriod] =
    useState("2024-2");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Current month for aguinaldo logic
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isAguinaldoMonth = currentMonth === 6 || currentMonth === 12;

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePayroll = () => {
    if (!selectedEmployee || !workDays) return null;

    const employee = employees.find(
      (e) => e.id.toString() === selectedEmployee,
    );
    if (!employee) return null;

    const basePay = employee.dailyWage * parseInt(workDays);
    const holidayPay = employee.dailyWage * 2 * (parseInt(holidayDays) || 0);

    // Agregar presentismo según selección en liquidación
    const presentismoAmount =
      presentismoStatus === "mantiene" ? employee.presentismo : 0;

    const totalAdvances = parseInt(advances) || 0;
    const totalDiscounts = parseInt(discounts) || 0;
    const manualWhiteWage = parseInt(whiteWage) || 0;

    // Total bruto = sueldo base + feriados + presentismo
    const grossTotal = basePay + holidayPay + presentismoAmount;

    // Total después de descuentos y adelantos
    const totalAfterDeductions = grossTotal - totalAdvances - totalDiscounts;

    // Sueldo informal = Total después de deducciones - Sueldo en blanco manual
    const informalAmount = Math.max(0, totalAfterDeductions - manualWhiteWage);

    // Total neto = sueldo en blanco + sueldo informal
    const netTotal = manualWhiteWage + informalAmount;

    return {
      basePay,
      holidayPay,
      presentismoAmount,
      grossTotal,
      totalAdvances,
      totalDiscounts,
      totalAfterDeductions,
      whiteAmount: manualWhiteWage,
      informalAmount,
      netTotal,
    };
  };

  const calculation = calculatePayroll();

  const handleEditRecord = (record) => {
    setIsEditMode(true);
    setEditingRecord(record);

    // Find employee
    const employee = employees.find((e) => e.name === record.employeeName);
    if (employee) {
      setSelectedEmployee(employee.id.toString());
    }

    // Pre-fill form with record data
    setWorkDays(record.baseDays.toString());
    setHolidayDays(record.holidayDays.toString());
    setAdvances(record.advances.toString());
    setDiscounts(record.discounts.toString());
    setWhiteWage(record.whiteAmount.toString());

    // Determine presentismo status based on record
    // This is a simple heuristic - in real app you'd store this info
    const employee_presentismo = employee?.presentismo || 0;
    const has_presentismo =
      record.netTotal > record.whiteAmount + record.informalAmount;
    setPresentismoStatus(has_presentismo ? "mantiene" : "pierde");

    setIsNewPayrollOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Liquidaciones</h1>
            <p className="text-muted-foreground">
              Gestión de sueldos y liquidaciones
            </p>
          </div>
        </div>

        <Dialog open={isNewPayrollOpen} onOpenChange={setIsNewPayrollOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Liquidación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Calcular Nueva Liquidación</DialogTitle>
              <DialogDescription>
                Completa los datos para generar la liquidación del empleado
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Empleado</Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={employee.id.toString()}
                        >
                          {employee.name} - {formatCurrency(employee.dailyWage)}
                          /día
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workDays">Días Trabajados</Label>
                  <Input
                    id="workDays"
                    type="number"
                    placeholder="30"
                    value={workDays}
                    onChange={(e) => setWorkDays(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentismo">Estado del Presentismo</Label>
                  <Select
                    value={presentismoStatus}
                    onValueChange={setPresentismoStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mantiene">
                        Mantiene presentismo
                      </SelectItem>
                      <SelectItem value="pierde">
                        Pierde presentismo este mes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedEmployee && (
                    <p className="text-xs text-muted-foreground">
                      Monto del presentismo:{" "}
                      {formatCurrency(
                        employees.find(
                          (e) => e.id.toString() === selectedEmployee,
                        )?.presentismo || 0,
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holidayDays">
                    Días Feriados (doble pago)
                  </Label>
                  <Input
                    id="holidayDays"
                    type="number"
                    placeholder="0"
                    value={holidayDays}
                    onChange={(e) => setHolidayDays(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advances">Adelantos de Sueldo</Label>
                  <Input
                    id="advances"
                    type="number"
                    placeholder="0"
                    value={advances}
                    onChange={(e) => setAdvances(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discounts">Otros Descuentos</Label>
                  <Input
                    id="discounts"
                    type="number"
                    placeholder="0"
                    value={discounts}
                    onChange={(e) => setDiscounts(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whiteWage">Sueldo en Blanco (manual)</Label>
                  <Input
                    id="whiteWage"
                    type="number"
                    placeholder="350000"
                    value={whiteWage}
                    onChange={(e) => setWhiteWage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    El sueldo informal se calculará automáticamente
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vista Previa</h3>
                {calculation ? (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span>Sueldo base:</span>
                        <span>{formatCurrency(calculation.basePay)}</span>
                      </div>
                      {calculation.holidayPay > 0 && (
                        <div className="flex justify-between">
                          <span>Feriados (doble):</span>
                          <span>{formatCurrency(calculation.holidayPay)}</span>
                        </div>
                      )}
                      {calculation.presentismoAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Presentismo:</span>
                          <span>
                            +{formatCurrency(calculation.presentismoAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>Subtotal bruto:</span>
                        <span>{formatCurrency(calculation.grossTotal)}</span>
                      </div>
                      {calculation.totalAdvances > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Adelantos:</span>
                          <span>
                            -{formatCurrency(calculation.totalAdvances)}
                          </span>
                        </div>
                      )}
                      {calculation.totalDiscounts > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Descuentos:</span>
                          <span>
                            -{formatCurrency(calculation.totalDiscounts)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>Total después de deducciones:</span>
                        <span>
                          {formatCurrency(calculation.totalAfterDeductions)}
                        </span>
                      </div>
                      <hr />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>En blanco (manual):</span>
                          <span className="font-medium">
                            {formatCurrency(calculation.whiteAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Informal (calculado):</span>
                          <span className="font-medium">
                            {formatCurrency(calculation.informalAmount)}
                          </span>
                        </div>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Neto:</span>
                        <span>{formatCurrency(calculation.netTotal)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      Selecciona un empleado y completa los días trabajados para
                      ver la vista previa
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  // Aquí se guardaría la liquidación
                  setIsNewPayrollOpen(false);
                  // Limpiar campos
                  setSelectedEmployee("");
                  setWorkDays("30");
                  setHolidayDays("");
                  setAdvances("");
                  setDiscounts("");
                  setWhiteWage("");
                  setPresentismoStatus("mantiene");
                }}
                className="w-full"
                disabled={!calculation}
              >
                Generar Liquidación
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewPayrollOpen(false);
                  // Limpiar campos
                  setSelectedEmployee("");
                  setWorkDays("30");
                  setHolidayDays("");
                  setAdvances("");
                  setDiscounts("");
                  setWhiteWage("");
                  setPresentismoStatus("mantiene");
                }}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                payrollRecords.reduce(
                  (sum, record) => sum + record.netTotal,
                  0,
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">Febrero 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRecords.length}</div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollRecords.filter((r) => r.status === "processed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {payrollRecords.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximo Aguinaldo
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Jun 2024</div>
            <p className="text-xs text-muted-foreground">Primer semestre</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Período Actual</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="aguinaldo">Calculadora de Aguinaldos</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones - Junio 2024</CardTitle>
              <CardDescription>
                Estado actual de las liquidaciones del período (incluye
                aguinaldo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Días Base</TableHead>
                    <TableHead>Feriados</TableHead>
                    {isAguinaldoMonth && <TableHead>Aguinaldo</TableHead>}
                    <TableHead>Adelantos</TableHead>
                    <TableHead>En Blanco</TableHead>
                    <TableHead>Informal</TableHead>
                    <TableHead>Total Neto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.employeeName}
                      </TableCell>
                      <TableCell>{record.baseDays} días</TableCell>
                      <TableCell>{record.holidayDays} días</TableCell>
                      {isAguinaldoMonth && (
                        <TableCell className="font-medium text-green-600">
                          {record.aguinaldo > 0
                            ? formatCurrency(record.aguinaldo)
                            : "-"}
                        </TableCell>
                      )}
                      <TableCell>{formatCurrency(record.advances)}</TableCell>
                      <TableCell>
                        {formatCurrency(record.whiteAmount)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(record.informalAmount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(record.netTotal)}
                        {record.aguinaldo > 0 && (
                          <div className="text-xs text-green-600">
                            Incluye aguinaldo
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "processed"
                              ? "default"
                              : record.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {record.status === "processed"
                            ? "Procesada"
                            : record.status === "pending"
                              ? "Pendiente"
                              : "Borrador"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* History Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Liquidaciones</CardTitle>
              <CardDescription>
                Consulta liquidaciones de períodos anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Año:</label>
                  <Select defaultValue="2024">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empleado:</label>
                  <Select defaultValue="todos">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los empleados</SelectItem>
                      <SelectItem value="juan">Juan Pérez</SelectItem>
                      <SelectItem value="maria">María González</SelectItem>
                      <SelectItem value="carlos">Carlos López</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historical Records */}
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones 2024</CardTitle>
              <CardDescription>
                Historial completo de liquidaciones procesadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Días Trabajados</TableHead>
                    <TableHead>Sueldo Base</TableHead>
                    <TableHead>Aguinaldo</TableHead>
                    <TableHead>Presentismo</TableHead>
                    <TableHead>Adelantos</TableHead>
                    <TableHead>Total Neto</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Sample historical data */}
                  <TableRow>
                    <TableCell className="font-medium">Junio 2024</TableCell>
                    <TableCell>Juan Pérez</TableCell>
                    <TableCell>22 días</TableCell>
                    <TableCell>{formatCurrency(450000)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(225000)}
                    </TableCell>
                    <TableCell>{formatCurrency(25000)}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(50000)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(650000)}
                    </TableCell>
                    <TableCell>30/06/2024</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">Mayo 2024</TableCell>
                    <TableCell>Juan Pérez</TableCell>
                    <TableCell>21 días</TableCell>
                    <TableCell>{formatCurrency(420000)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{formatCurrency(25000)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(445000)}
                    </TableCell>
                    <TableCell>31/05/2024</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">Abril 2024</TableCell>
                    <TableCell>Juan Pérez</TableCell>
                    <TableCell>22 días</TableCell>
                    <TableCell>{formatCurrency(450000)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{formatCurrency(25000)}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(30000)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(445000)}
                    </TableCell>
                    <TableCell>30/04/2024</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">Junio 2024</TableCell>
                    <TableCell>María González</TableCell>
                    <TableCell>20 días</TableCell>
                    <TableCell>{formatCurrency(360000)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(180000)}
                    </TableCell>
                    <TableCell className="text-red-600 line-through">
                      {formatCurrency(20000)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(25000)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(515000)}
                    </TableCell>
                    <TableCell>30/06/2024</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">Mayo 2024</TableCell>
                    <TableCell>María González</TableCell>
                    <TableCell>19 días</TableCell>
                    <TableCell>{formatCurrency(342000)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-red-600 line-through">
                      {formatCurrency(20000)}
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(342000)}
                    </TableCell>
                    <TableCell>31/05/2024</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      Diciembre 2023
                    </TableCell>
                    <TableCell>Carlos López</TableCell>
                    <TableCell>21 días</TableCell>
                    <TableCell>{formatCurrency(400000)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(202500)}
                    </TableCell>
                    <TableCell>{formatCurrency(22000)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(624500)}
                    </TableCell>
                    <TableCell>29/12/2023</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Historical Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pagado 2024
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(3021500)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Incluye aguinaldos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aguinaldos Pagados
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(607500)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Junio + Diciembre 2023
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Liquidaciones Procesadas
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">36</div>
                <p className="text-xs text-muted-foreground">
                  En los últimos 12 meses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Promedio Mensual
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(251792)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por mes (sin aguinaldos)
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aguinaldo" className="space-y-6">
          {/* Aguinaldo Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Aguinaldos (SAC)
              </CardTitle>
              <CardDescription>
                Cálculo del Sueldo Anual Complementario por período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Período a calcular:
                  </label>
                  <Select
                    value={selectedAguinaldoPeriod}
                    onValueChange={setSelectedAguinaldoPeriod}
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
                      {formatCurrency(
                        employees
                          .filter((emp) => emp.status === "active")
                          .map((emp) =>
                            calculateAguinaldo(emp, selectedAguinaldoPeriod),
                          )
                          .reduce((sum, calc) => sum + calc.amount, 0),
                      )}
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

          {/* Aguinaldo Results Table */}
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
                  {employees
                    .filter((emp) => emp.status === "active")
                    .map((emp) => {
                      const aguinaldo = calculateAguinaldo(
                        emp,
                        selectedAguinaldoPeriod,
                      );
                      return (
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
                            {formatCurrency(aguinaldo.bestSalary || 0)}
                          </TableCell>
                          <TableCell>
                            {aguinaldo.corresponds ? (
                              <div className="text-center">
                                <div className="font-medium">
                                  {aguinaldo.daysWorked}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  de {aguinaldo.totalDays} días
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {aguinaldo.corresponds ? (
                              <Badge
                                variant={
                                  aguinaldo.proportional
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {aguinaldo.proportional
                                  ? "Proporcional"
                                  : "Completo"}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No corresponde</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-bold">
                            {aguinaldo.corresponds ? (
                              <div>
                                <div className="text-lg">
                                  {formatCurrency(aguinaldo.amount)}
                                </div>
                                {aguinaldo.proportional && (
                                  <div className="text-xs text-muted-foreground">
                                    Completo:{" "}
                                    {formatCurrency(aguinaldo.fullAguinaldo)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">$0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{aguinaldo.reason}</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Stats for Aguinaldos */}
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
                    employees
                      .filter((emp) => emp.status === "active")
                      .map((emp) =>
                        calculateAguinaldo(emp, selectedAguinaldoPeriod),
                      )
                      .filter((calc) => calc.corresponds).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  de {employees.filter((emp) => emp.status === "active").length}{" "}
                  activos
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
                    employees
                      .filter((emp) => emp.status === "active")
                      .map((emp) =>
                        calculateAguinaldo(emp, selectedAguinaldoPeriod),
                      )
                      .filter((calc) => calc.proportional).length
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
                  {(() => {
                    const calculations = employees
                      .filter((emp) => emp.status === "active")
                      .map((emp) =>
                        calculateAguinaldo(emp, selectedAguinaldoPeriod),
                      );
                    const total = calculations.reduce(
                      (sum, calc) => sum + calc.amount,
                      0,
                    );
                    const count = calculations.filter(
                      (calc) => calc.corresponds,
                    ).length;
                    return formatCurrency(
                      Math.round(total / Math.max(count, 1)),
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por empleado con aguinaldo
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;
