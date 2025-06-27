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
import FileUpload from "@/components/FileUpload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock data
const payrollRecords = [
  {
    id: 1,
    employeeName: "Juan Pérez",
    period: "Diciembre 2024",
    baseDays: 22,
    holidayDays: 2,
    baseAmount: 330000,
    holidayBonus: 60000,
    aguinaldo: 225000, // Aguinaldo de diciembre
    discounts: 50000,
    advances: 50000,
    whiteAmount: 220000,
    informalAmount: 120000,
    presentismoAmount: 25000,
    netTotal: 590000, // Incluye aguinaldo
    status: "processed",
  },
  {
    id: 2,
    employeeName: "María González",
    period: "Diciembre 2024",
    baseDays: 20,
    holidayDays: 1,
    baseAmount: 240000,
    holidayBonus: 12000,
    aguinaldo: 180000, // Aguinaldo de diciembre
    discounts: 0,
    advances: 30000,
    whiteAmount: 160000,
    informalAmount: 62000,
    presentismoAmount: 20000,
    netTotal: 422000, // Incluye aguinaldo
    status: "pending",
  },
  {
    id: 3,
    employeeName: "Carlos López",
    period: "Noviembre 2024",
    baseDays: 21,
    holidayDays: 0,
    baseAmount: 283500,
    holidayBonus: 0,
    aguinaldo: 0, // No hay aguinaldo en noviembre
    discounts: 15000,
    advances: 0,
    whiteAmount: 199500,
    informalAmount: 69000,
    presentismoAmount: 22000,
    netTotal: 290500,
    status: "draft",
  },
];

// Mock employees data
const employees = [
  {
    id: 1,
    name: "Juan Pérez",
    dailyWage: 15000,
    whiteWage: 300000,
    informalWage: 150000,
    presentismo: 25000,
    status: "active",
    startDate: "2023-01-15",
  },
  {
    id: 2,
    name: "María González",
    dailyWage: 12000,
    whiteWage: 240000,
    informalWage: 120000,
    presentismo: 20000,
    status: "active",
    startDate: "2023-03-20",
  },
  {
    id: 3,
    name: "Carlos López",
    dailyWage: 13500,
    whiteWage: 285000,
    informalWage: 120000,
    presentismo: 22000,
    status: "active",
    startDate: "2018-11-10",
  },
  {
    id: 4,
    name: "Ana Martínez",
    dailyWage: 11000,
    whiteWage: 210000,
    informalWage: 120000,
    presentismo: 18000,
    status: "inactive",
    startDate: "2023-06-01",
  },
  {
    id: 5,
    name: "Luis Fernández",
    dailyWage: 25000,
    whiteWage: 525000,
    informalWage: 225000,
    presentismo: 35000,
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
  const [overtimeEnabled, setOvertimeEnabled] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedAguinaldoPeriod, setSelectedAguinaldoPeriod] =
    useState("2024-2");

  // Check if current month is aguinaldo month (June or December)
  const currentMonth = new Date().getMonth() + 1;
  const isAguinaldoMonth = currentMonth === 6 || currentMonth === 12;

  const calculatePayroll = () => {
    if (!selectedEmployee || !workDays) return null;

    const employee = employees.find(
      (e) => e.id.toString() === selectedEmployee,
    );
    if (!employee) return null;

    const basePay = employee.dailyWage * parseInt(workDays);
    const holidayPay = employee.dailyWage * 2 * (parseInt(holidayDays) || 0);

    // Calcular horas extra si está habilitado
    const hourlyRate = employee.dailyWage / 8; // Sueldo por hora = sueldo diario ÷ 8
    const overtimePay = overtimeEnabled
      ? hourlyRate * (parseInt(overtimeHours) || 0)
      : 0;

    // Agregar presentismo según selección en liquidación
    const presentismoAmount =
      presentismoStatus === "mantiene" ? employee.presentismo : 0;

    // Bono libre
    const bonusPay = parseInt(bonusAmount) || 0;

    const totalAdvances = parseInt(advances) || 0;
    const totalDiscounts = parseInt(discounts) || 0;
    const manualWhiteWage = parseInt(whiteWage) || 0;

    // Total bruto = sueldo base + feriados + horas extra + presentismo + bono
    const grossTotal =
      basePay + holidayPay + overtimePay + presentismoAmount + bonusPay;

    // Total después de descuentos y adelantos
    const totalAfterDeductions = grossTotal - totalAdvances - totalDiscounts;

    // Sueldo informal = Total después de deducciones - Sueldo en blanco manual
    const informalAmount = Math.max(0, totalAfterDeductions - manualWhiteWage);

    // Total neto = sueldo en blanco + sueldo informal
    const netTotal = manualWhiteWage + informalAmount;

    return {
      basePay,
      holidayPay,
      overtimePay,
      hourlyRate,
      presentismoAmount,
      bonusPay,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TooltipProvider>
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
              <DialogTitle>
                {isEditMode
                  ? "Editar Liquidación"
                  : "Calcular Nueva Liquidación"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Modifica los datos de la liquidación existente"
                  : "Completa los datos para generar la liquidación del empleado"}
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="overtimeToggle"
                      checked={overtimeEnabled}
                      onChange={(e) => setOvertimeEnabled(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="overtimeToggle">Horas Extra</Label>
                  </div>
                  {overtimeEnabled && (
                    <div className="space-y-2">
                      <Input
                        id="overtimeHours"
                        type="number"
                        placeholder="0"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(e.target.value)}
                      />
                      {selectedEmployee && (
                        <p className="text-xs text-muted-foreground">
                          Tarifa por hora:{" "}
                          {formatCurrency(
                            (employees.find(
                              (e) => e.id.toString() === selectedEmployee,
                            )?.dailyWage || 0) / 8,
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonusAmount">Bono Libre</Label>
                  <Input
                    id="bonusAmount"
                    type="number"
                    placeholder="0"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Monto adicional que se suma al salario final
                  </p>
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
                      {calculation.overtimePay > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Horas extra ({overtimeHours}h):</span>
                          <span>
                            +{formatCurrency(calculation.overtimePay)}
                          </span>
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
                      {calculation.bonusPay > 0 && (
                        <div className="flex justify-between text-purple-600">
                          <span>Bono:</span>
                          <span>+{formatCurrency(calculation.bonusPay)}</span>
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
                  setIsNewPayrollOpen(false);
                  setSelectedEmployee("");
                  setWorkDays("30");
                  setHolidayDays("");
                  setAdvances("");
                  setDiscounts("");
                  setWhiteWage("");
                  setOvertimeEnabled(false);
                  setOvertimeHours("");
                  setBonusAmount("");
                  setPresentismoStatus("mantiene");
                  setIsEditMode(false);
                  setEditingRecord(null);
                }}
                className="w-full"
                disabled={!calculation}
              >
                {isEditMode ? "Guardar Cambios" : "Generar Liquidación"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewPayrollOpen(false);
                  setSelectedEmployee("");
                  setWorkDays("30");
                  setHolidayDays("");
                  setAdvances("");
                  setDiscounts("");
                  setWhiteWage("");
                  setOvertimeEnabled(false);
                  setOvertimeHours("");
                  setBonusAmount("");
                  setPresentismoStatus("mantiene");
                  setIsEditMode(false);
                  setEditingRecord(null);
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-xs text-muted-foreground">Diciembre 2024</p>
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
            <div className="text-2xl font-bold">Jun 2025</div>
            <p className="text-xs text-muted-foreground">Primer semestre</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Período Actual</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones - Diciembre 2024</CardTitle>
              <CardDescription>
                Estado actual de las liquidaciones del período (incluye
                aguinaldo)
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
                      {isAguinaldoMonth && <TableHead>Aguinaldo</TableHead>}
                      <TableHead>Adelantos</TableHead>
                      <TableHead>En Blanco</TableHead>
                      <TableHead>Informal</TableHead>
                      <TableHead>Presentismo</TableHead>
                      <TableHead>Total Neto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
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
                        <TableCell>
                          {record.presentismoAmount > 0 ? (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(record.presentismoAmount)}
                            </span>
                          ) : (
                            <span className="text-red-600">Perdido</span>
                          )}
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
                        <TableCell>
                          <FileUpload
                            entityId={record.id}
                            entityType="payroll"
                            title={`Documentos - ${record.employeeName} (${record.period})`}
                            description="Subir recibos de sueldo, comprobantes y otros documentos de la liquidación"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={record.status === "processed"}
                            >
                              <Calculator className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={record.status === "processed"}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Liquidaciones</CardTitle>
              <CardDescription>
                Consulta liquidaciones de períodos anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidad de historial disponible próximamente
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;