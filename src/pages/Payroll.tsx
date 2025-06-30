import { useState, useEffect } from "react";
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
import { usePayroll } from "@/hooks/use-payroll";
import { useEmployees } from "@/hooks/use-employees";
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
import usePermissions from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Data is now loaded from Supabase via hooks

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
  const [employeeFilter, setEmployeeFilter] = useState("active"); // Por defecto solo activos
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Usar hooks de Supabase
  const {
    payrollRecords,
    loading: payrollLoading,
    error: payrollError,
    getExistingPayrollRecord,
    createPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
  } = usePayroll();

  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useEmployees();

  const { isAdmin, canEditModule } = usePermissions();
  const { user } = useAuth();

  // Initialize period with current month
  useEffect(() => {
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedPeriod(currentPeriod);
  }, []);

  // Success message effect
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStateChange = async (record, newStatus) => {
    try {
      console.log("Updating status to:", newStatus);

      const updateData = {
        status: newStatus,
        processedDate: new Date().toISOString(),
        processedBy: user?.id || null,
      };

      await updatePayrollRecord(record.id, updateData);

      const statusLabels = {
        pending: "pendiente",
        approved: "aprobada",
        paid: "pagada",
        processed: "procesada",
      };

      setSuccessMessage(
        `Liquidación de ${record.employeeName} marcada como ${statusLabels[newStatus]}`,
      );
    } catch (error) {
      console.error("Error updating payroll status:", error);
      alert("Error al actualizar el estado de la liquidación");
    }
  };

  const handleDeletePayroll = async () => {
    if (!recordToDelete) return;

    try {
      await deletePayrollRecord(recordToDelete.id);
      setSuccessMessage(
        `Liquidación de ${recordToDelete.employeeName} eliminada exitosamente`,
      );
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error("Error deleting payroll:", error);
      alert("Error al eliminar liquidación");
    }
  };

  const handleEditRecord = (record) => {
    setIsEditMode(true);
    setEditingRecord(record);

    // Find employee
    const employee = employees.find((e) => e.name === record.employeeName);
    if (employee) {
      setSelectedEmployee(employee.id.toString());
    }

    // Pre-fill form with record data
    setSelectedPeriod(record.period);
    setWorkDays(record.baseDays.toString());
    setHolidayDays(record.holidayDays.toString());
    setAdvances(record.advances.toString());
    setDiscounts(record.discounts ? record.discounts.toString() : "0");
    setWhiteWage(record.whiteAmount.toString());
    setBonusAmount(record.bonusAmount ? record.bonusAmount.toString() : "0");
    setOvertimeHours(
      record.overtimeHours ? record.overtimeHours.toString() : "0",
    );
    setOvertimeEnabled(record.overtimeHours > 0);

    // Determine presentismo status based on record
    const has_presentismo = record.presentismoAmount > 0;
    setPresentismoStatus(has_presentismo ? "mantiene" : "pierde");

    setIsNewPayrollOpen(true);
  };

  const generatePayslip = (record) => {
    // Generate payslip PDF logic here
    console.log("Generating payslip for:", record.employeeName);
    alert(`Generando recibo de sueldo para ${record.employeeName}`);
  };
  const [selectedAguinaldoPeriod, setSelectedAguinaldoPeriod] =
    useState("2024-2");

  // Check if current month is aguinaldo month (June or December) - kept for backward compatibility
  const currentMonth = new Date().getMonth() + 1;
  const isAguinaldoMonth = currentMonth === 6 || currentMonth === 12;

  const isAguinaldoPeriod = (period: string) => {
    const [year, month] = period.split("-");
    return month === "06" || month === "12"; // Junio o Diciembre
  };

  const calculateAguinaldo = (employee, period) => {
    if (!isAguinaldoPeriod(period)) return 0;

    const [year, month] = period.split("-");
    const startDate = new Date(employee.startDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Determinar fecha límite según el período
    let endDate;
    if (month === "06") {
      // Primer semestre - hasta 30 de junio
      endDate = new Date(parseInt(year), 5, 30); // Mes 5 = junio (0-indexed)
    } else {
      // Segundo semestre - hasta 31 de diciembre
      endDate = new Date(parseInt(year), 11, 31); // Mes 11 = diciembre (0-indexed)
    }

    // Sueldo total más alto (sin presentismo)
    const totalSalary = employee.whiteWage + employee.informalWage;

    // Si tiene más de 6 meses de antigüedad al momento de liquidar
    const liquidationDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const hasMoreThanSixMonths =
      (liquidationDate - startDate) / (1000 * 60 * 60 * 24) >= 180;

    if (hasMoreThanSixMonths) {
      // Aguinaldo completo
      return totalSalary / 2;
    } else {
      // Aguinaldo proporcional
      // Calcular días trabajados desde el día posterior a la fecha de ingreso hasta fecha límite
      const dayAfterStart = new Date(startDate);
      dayAfterStart.setDate(dayAfterStart.getDate() + 1);
      const workStartDate =
        dayAfterStart > new Date(parseInt(year), 0, 1)
          ? dayAfterStart
          : new Date(parseInt(year), 0, 1);
      const daysWorked = Math.max(
        0,
        Math.ceil((endDate - workStartDate) / (1000 * 60 * 60 * 24)) + 1,
      );

      // Fórmula: (Sueldo total / 2) / 180 * días trabajados
      return Math.max(0, (totalSalary / 2 / 180) * daysWorked);
    }
  };

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

    // Calculate aguinaldo if it's an aguinaldo period (June or December)
    const aguinaldoAmount = calculateAguinaldo(employee, selectedPeriod);

    // Total neto = total después de deducciones (incluye horas extras, presentismo, bonos, etc.)
    const netTotal = totalAfterDeductions;

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
      total: netTotal, // Agregar alias para compatibilidad
      baseAmount: basePay,
      holidayBonus: holidayPay,
      aguinaldo: aguinaldoAmount,
      overtimeAmount: overtimePay,
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

  // Manejo de loading y error
  if (payrollLoading || employeesLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (payrollError || employeesError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">
            Error: {payrollError || employeesError}
          </p>
        </div>
      </div>
    );
  }

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
                    <Label htmlFor="period">
                      Período a Liquidar <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="period"
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Selecciona el mes y año del período a liquidar
                    </p>
                  </div>

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
                        {employees
                          .filter((employee) => employee.status === "active")
                          .map((employee) => (
                            <SelectItem
                              key={employee.id}
                              value={employee.id.toString()}
                            >
                              {employee.name} -{" "}
                              {formatCurrency(employee.dailyWage)}
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
                            <span>
                              {formatCurrency(calculation.holidayPay)}
                            </span>
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
                        {calculation.aguinaldo > 0 && selectedEmployee && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-green-600">
                              <span>
                                Aguinaldo ({formatPeriod(selectedPeriod)}):
                              </span>
                              <span>
                                +{formatCurrency(calculation.aguinaldo)}
                              </span>
                            </div>
                            {(() => {
                              const employee = employees.find(
                                (e) => e.id.toString() === selectedEmployee,
                              );
                              if (!employee) return null;

                              const startDate = new Date(employee.startDate);
                              const [year, month] = selectedPeriod.split("-");
                              const liquidationDate = new Date(
                                parseInt(year),
                                parseInt(month) - 1,
                                1,
                              );
                              const hasMoreThanSixMonths =
                                (liquidationDate - startDate) /
                                  (1000 * 60 * 60 * 24) >=
                                180;

                              if (!hasMoreThanSixMonths) {
                                return (
                                  <div className="text-xs text-green-700">
                                    Proporcional - Ingreso:{" "}
                                    {new Date(
                                      employee.startDate,
                                    ).toLocaleDateString("es-AR")}
                                  </div>
                                );
                              }
                              return null;
                            })()}
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
                          <span>
                            {formatCurrency(
                              calculation.netTotal + calculation.aguinaldo,
                            )}
                          </span>
                        </div>
                        {calculation.aguinaldo > 0 && (
                          <div className="text-xs text-green-600 text-center">
                            Incluye aguinaldo de {formatPeriod(selectedPeriod)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-4 text-center text-muted-foreground">
                        Selecciona un empleado y completa los días trabajados
                        para ver la vista previa
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={async () => {
                    if (!calculation) return;

                    try {
                      if (!selectedPeriod) {
                        alert("Debes seleccionar un período para liquidar");
                        return;
                      }

                      const period = selectedPeriod;

                      if (isEditMode && editingRecord) {
                        // Actualizar registro existente
                        await updatePayrollRecord(editingRecord.id, {
                          baseDays: parseInt(workDays),
                          holidayDays: parseInt(holidayDays) || 0,
                          baseAmount: calculation.baseAmount,
                          holidayBonus: calculation.holidayBonus,
                          aguinaldo: calculation.aguinaldo,
                          discounts: parseFloat(discounts) || 0,
                          advances: parseFloat(advances) || 0,
                          whiteAmount: calculation.whiteAmount,
                          informalAmount: calculation.informalAmount,
                          presentismoAmount: calculation.presentismoAmount,
                          overtimeHours: parseFloat(overtimeHours) || 0,
                          overtimeAmount: calculation.overtimeAmount,
                          bonusAmount: parseFloat(bonusAmount) || 0,
                          netTotal: calculation.total,
                          status: "processed",
                        });
                      } else {
                        // Check if record already exists
                        const existingRecord = await getExistingPayrollRecord(
                          selectedEmployee,
                          period,
                        );

                        if (existingRecord) {
                          const confirmUpdate = confirm(
                            `Ya existe una liquidación para este empleado en ${period}. ¿Deseas actualizarla?`,
                          );

                          if (confirmUpdate) {
                            // Update existing record
                            await updatePayrollRecord(existingRecord.id, {
                              baseDays: parseInt(workDays),
                              holidayDays: parseInt(holidayDays) || 0,
                              baseAmount: calculation.baseAmount,
                              holidayBonus: calculation.holidayBonus,
                              aguinaldo: calculation.aguinaldo,
                              discounts: parseFloat(discounts) || 0,
                              advances: parseFloat(advances) || 0,
                              whiteAmount: calculation.whiteAmount,
                              informalAmount: calculation.informalAmount,
                              presentismoAmount: calculation.presentismoAmount,
                              overtimeHours: parseFloat(overtimeHours) || 0,
                              overtimeAmount: calculation.overtimeAmount,
                              bonusAmount: parseFloat(bonusAmount) || 0,
                              netTotal: calculation.total,
                              status: "processed",
                            });
                          } else {
                            return; // User cancelled
                          }
                        } else {
                          // Crear nuevo registro
                          await createPayrollRecord({
                            employeeId: selectedEmployee,
                            period,
                            baseDays: parseInt(workDays),
                            holidayDays: parseInt(holidayDays) || 0,
                            baseAmount: calculation.baseAmount,
                            holidayBonus: calculation.holidayBonus,
                            aguinaldo: calculation.aguinaldo,
                            discounts: parseFloat(discounts) || 0,
                            advances: parseFloat(advances) || 0,
                            whiteAmount: calculation.whiteAmount,
                            informalAmount: calculation.informalAmount,
                            presentismoAmount: calculation.presentismoAmount,
                            overtimeHours: parseFloat(overtimeHours) || 0,
                            overtimeAmount: calculation.overtimeAmount,
                            bonusAmount: parseFloat(bonusAmount) || 0,
                            netTotal: calculation.total,
                            status: "processed",
                          });
                        }
                      }

                      // Limpiar formulario
                      setIsNewPayrollOpen(false);
                      setSelectedEmployee("");
                      const currentDate = new Date();
                      const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
                      setSelectedPeriod(currentPeriod);
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
                    } catch (error) {
                      console.error("Error saving payroll:", error);
                      alert("Error al guardar liquidación");
                    }
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
                    const currentDate = new Date();
                    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
                    setSelectedPeriod(currentPeriod);
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
              <CardTitle className="text-sm font-medium">
                Total a Pagar
              </CardTitle>
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
              <CardTitle className="text-sm font-medium">
                Liquidaciones
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollRecords.length}</div>
              <p className="text-xs text-muted-foreground">Este período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payrollRecords.filter((r) => r.status === "paid").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  payrollRecords.filter(
                    (r) => r.status === "pending" || r.status === "approved",
                  ).length
                }{" "}
                pendientes
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
                <CardTitle>Liquidaciones del Período</CardTitle>
                <CardDescription>
                  Estado actual de las liquidaciones registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="mb-4 flex gap-4">
                  <Select
                    value={employeeFilter}
                    onValueChange={setEmployeeFilter}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        Solo empleados activos
                      </SelectItem>
                      <SelectItem value="all">Todos los empleados</SelectItem>
                      <SelectItem value="inactive">
                        Solo empleados inactivos
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="approved">Aprobadas</SelectItem>
                      <SelectItem value="processed">Procesadas</SelectItem>
                      <SelectItem value="paid">Pagadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Período Liquidado</TableHead>
                        <TableHead>Días Base</TableHead>
                        <TableHead>Feriados</TableHead>
                        <TableHead>Horas Extras</TableHead>
                        <TableHead>Bono Libre</TableHead>
                        <TableHead>Descuentos</TableHead>
                        <TableHead>Aguinaldo</TableHead>
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
                      {payrollRecords
                        .filter((record) => {
                          const employee = employees.find(
                            (e) => e.name === record.employeeName,
                          );
                          if (!employee) return false;

                          // Filter by employee status
                          let employeeMatch = true;
                          if (employeeFilter === "active")
                            employeeMatch = employee.status === "active";
                          else if (employeeFilter === "inactive")
                            employeeMatch = employee.status === "inactive";

                          // Filter by liquidation status
                          let statusMatch = true;
                          if (statusFilter !== "all")
                            statusMatch = record.status === statusFilter;

                          return employeeMatch && statusMatch;
                        })
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.employeeName}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatPeriod(record.period)}
                              {isAguinaldoPeriod(record.period) && (
                                <div className="text-xs text-green-600">
                                  Período con aguinaldo
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{record.baseDays} días</TableCell>
                            <TableCell>
                              {record.holidayDays > 0 ? (
                                <div>
                                  <div className="font-medium">
                                    {formatCurrency(record.holidayBonus)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {record.holidayDays} días
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.overtimeHours > 0 ? (
                                <div>
                                  <div className="font-medium">
                                    {formatCurrency(record.overtimeAmount)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {record.overtimeHours} hs
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.bonusAmount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(record.bonusAmount)}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.discounts > 0 ? (
                                <span className="text-red-600">
                                  {formatCurrency(record.discounts)}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {isAguinaldoPeriod(record.period) &&
                              record.aguinaldo > 0 ? (
                                <div>
                                  <div>{formatCurrency(record.aguinaldo)}</div>
                                  {(() => {
                                    const employee = employees.find(
                                      (e) => e.name === record.employeeName,
                                    );
                                    if (!employee) return null;

                                    const startDate = new Date(
                                      employee.startDate,
                                    );
                                    const [year, month] =
                                      record.period.split("-");
                                    const liquidationDate = new Date(
                                      parseInt(year),
                                      parseInt(month) - 1,
                                      1,
                                    );
                                    const hasMoreThanSixMonths =
                                      (liquidationDate - startDate) /
                                        (1000 * 60 * 60 * 24) >=
                                      180;

                                    if (!hasMoreThanSixMonths) {
                                      return (
                                        <div className="text-xs text-green-700">
                                          Proporcional
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(record.advances)}
                            </TableCell>
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
                              {formatCurrency(
                                record.netTotal +
                                  (isAguinaldoPeriod(record.period)
                                    ? record.aguinaldo || 0
                                    : 0),
                              )}
                              {isAguinaldoPeriod(record.period) &&
                                record.aguinaldo > 0 && (
                                  <div className="text-xs text-green-600">
                                    Incluye aguinaldo:{" "}
                                    {formatCurrency(record.aguinaldo)}
                                  </div>
                                )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant={
                                    record.status === "processed"
                                      ? "default"
                                      : record.status === "pending"
                                        ? "secondary"
                                        : record.status === "approved"
                                          ? "default"
                                          : record.status === "paid"
                                            ? "default"
                                            : "outline"
                                  }
                                  className={
                                    record.status === "paid"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : record.status === "approved"
                                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                        : ""
                                  }
                                >
                                  {record.status === "processed"
                                    ? "Procesada"
                                    : record.status === "pending"
                                      ? "Pendiente"
                                      : record.status === "approved"
                                        ? "Aprobada"
                                        : record.status === "paid"
                                          ? "Pagada"
                                          : "Borrador"}
                                </Badge>
                                {record.processedDate && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      record.processedDate,
                                    ).toLocaleDateString("es-AR")}
                                  </span>
                                )}
                              </div>
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
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditRecord(record)}
                                      disabled={
                                        record.status === "paid" ||
                                        (record.status === "processed" &&
                                          !isAdmin())
                                      }
                                    >
                                      <Calculator className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {record.status === "paid"
                                        ? "No se puede editar liquidación pagada"
                                        : record.status === "processed" &&
                                            !isAdmin()
                                          ? "Solo admin puede editar liquidaciones procesadas"
                                          : "Editar liquidación"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>

                                {/* State transition buttons */}
                                {record.status === "draft" && isAdmin() && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleStateChange(record, "pending")
                                        }
                                      >
                                        <UserCheck className="h-4 w-4 text-orange-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Marcar como pendiente</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {record.status === "pending" && isAdmin() && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleStateChange(record, "approved")
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Aprobar liquidación</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {(record.status === "approved" ||
                                  record.status === "processed") &&
                                  isAdmin() && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleStateChange(record, "paid")
                                          }
                                        >
                                          <DollarSign className="h-4 w-4 text-green-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como pagada</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => generatePayslip(record)}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Descargar recibo</p>
                                  </TooltipContent>
                                </Tooltip>

                                {(isAdmin() || canEditModule("payroll")) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setRecordToDelete(record);
                                          setDeleteConfirmOpen(true);
                                        }}
                                        title="Eliminar liquidación"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Eliminar liquidación</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
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

        {/* Success Message */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">{successMessage}</div>
              <button
                onClick={() => setSuccessMessage("")}
                className="ml-2 text-white hover:text-green-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Payroll;
