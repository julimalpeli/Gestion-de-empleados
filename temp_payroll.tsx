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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  generatePayrollReceiptPDF,
  generatePayrollReceiptExcel,
} from "@/utils/receiptGenerator";
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
  Trash2,
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
import DocumentManager from "@/components/DocumentManager";
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
  const [isPayrollDocManagerOpen, setIsPayrollDocManagerOpen] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState(null);
  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState(null);

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

  // Configurar período actual automáticamente
  useEffect(() => {
    if (!selectedPeriod) {
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setSelectedPeriod(currentPeriod);
    }
  }, [selectedPeriod]);

  // Función para verificar si un período es de aguinaldo (junio o diciembre)
  const isAguinaldoPeriod = (period: string) => {
    const [year, month] = period.split("-");
    return month === "06" || month === "12";
  };

  // Función para calcular aguinaldo (tomada de Reports.tsx)
  const calculateAguinaldo = (employee, period) => {
    if (!isAguinaldoPeriod(period)) return 0;

    const [year, month] = period.split("-");
    const currentYear = parseInt(year);
    const currentMonth = parseInt(month);

    // Determinar fechas del semestre según el mes
    const semesterStart =
      currentMonth === 6
        ? new Date(currentYear, 0, 1) // 1 enero (primer semestre)
        : new Date(currentYear, 6, 1); // 1 julio (segundo semestre)

    const semesterEnd =
      currentMonth === 6
        ? new Date(currentYear, 5, 30) // 30 junio
        : new Date(currentYear, 11, 31); // 31 diciembre

    const startDate = new Date(employee.startDate);

    // Si empezó después del semestre, no corresponde aguinaldo
    if (startDate > semesterEnd) {
      return 0;
    }

    // Fecha efectiva de inicio (la mayor entre inicio de semestre e inicio de trabajo)
    // Importante: se cuenta desde el día POSTERIOR a la fecha de ingreso
    const effectiveStartDate = new Date(startDate);
    effectiveStartDate.setDate(effectiveStartDate.getDate() + 1);

    const effectiveStart =
      effectiveStartDate > semesterStart ? effectiveStartDate : semesterStart;

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

    return Math.round(finalAmount);
  };

  // Manejo de nuevo payroll
  const handleCreatePayroll = async () => {
    if (!selectedEmployee || !selectedPeriod) {
      alert("Selecciona empleado y período");
      return;
    }

    const employee = employees.find(
      (e) => e.id.toString() === selectedEmployee,
    );
    if (!employee) {
      alert("Empleado no encontrado");
      return;
    }

    // Verificar si ya existe liquidación para este período
    const existingRecord = await getExistingPayrollRecord(
      selectedEmployee,
      selectedPeriod,
    );

    if (existingRecord) {
      alert(
        `Ya existe una liquidación para ${employee.name} en ${formatPeriod(selectedPeriod)}`,
      );
      return;
    }

    const calculation = calculatePayroll();

    try {
      const payrollData = {
        employeeId: selectedEmployee,
        employeeName: employee.name,
        period: selectedPeriod,
        baseDays: parseInt(workDays),
        holidayDays: parseInt(holidayDays) || 0,
        overtimeHours: overtimeEnabled ? parseFloat(overtimeHours) || 0 : 0,
        advances: parseFloat(advances) || 0,
        discounts: parseFloat(discounts) || 0,
        whiteAmount: parseFloat(whiteWage) || 0,
        informalAmount: calculation.informalAmount || 0,
        bonusAmount: parseFloat(bonusAmount) || 0,
        presentismoAmount: calculation.presentismoAmount || 0,
        aguinaldo: calculation.aguinaldo || 0,
        netTotal: calculation.netTotal,
        status: "draft",
        // Campos calculados adicionales
        holidayBonus: calculation.holidayPay || 0,
        overtimeAmount: calculation.overtimePay || 0,
      };

      console.log("Creating payroll with data:", payrollData);
      await createPayrollRecord(payrollData);

      // Reset form
      setSelectedEmployee("");
      setWorkDays("30");
      setHolidayDays("");
      setAdvances("");
      setDiscounts("");
      setWhiteWage("");
      setPresentismoStatus("mantiene");
      setOvertimeEnabled(false);
      setOvertimeHours("");
      setBonusAmount("");
      setIsNewPayrollOpen(false);

      setSuccessMessage(
        `Liquidación creada exitosamente para ${employee.name}`,
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error creating payroll:", error);
      alert("Error al crear liquidación: " + error.message);
    }
  };

  // Función para editar registro existente
  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setSelectedEmployee(record.employeeId.toString());
    setSelectedPeriod(record.period);
    setWorkDays(record.baseDays.toString());
    setHolidayDays(record.holidayDays?.toString() || "");
    setAdvances(record.advances?.toString() || "");
    setDiscounts(record.discounts?.toString() || "");
    setWhiteWage(record.whiteAmount?.toString() || "");
    setBonusAmount(record.bonusAmount?.toString() || "");
    setOvertimeHours(record.overtimeHours?.toString() || "");
    setOvertimeEnabled(record.overtimeHours > 0);
    setPresentismoStatus(record.presentismoAmount > 0 ? "mantiene" : "perdido");
    setIsEditMode(true);
    setIsNewPayrollOpen(true);
  };

  // Función para actualizar registro
  const handleUpdatePayroll = async () => {
    if (!editingRecord) return;

    const employee = employees.find(
      (e) => e.id.toString() === selectedEmployee,
    );
    if (!employee) {
      alert("Empleado no encontrado");
      return;
    }

    const calculation = calculatePayroll();

    try {
      const updatedData = {
        baseDays: parseInt(workDays),
        holidayDays: parseInt(holidayDays) || 0,
        overtimeHours: overtimeEnabled ? parseFloat(overtimeHours) || 0 : 0,
        advances: parseFloat(advances) || 0,
        discounts: parseFloat(discounts) || 0,
        whiteAmount: parseFloat(whiteWage) || 0,
        informalAmount: calculation.informalAmount || 0,
        bonusAmount: parseFloat(bonusAmount) || 0,
        presentismoAmount: calculation.presentismoAmount || 0,
        aguinaldo: calculation.aguinaldo || 0,
        netTotal: calculation.netTotal,
        // Campos calculados adicionales
        holidayBonus: calculation.holidayPay || 0,
        overtimeAmount: calculation.overtimePay || 0,
      };

      await updatePayrollRecord(editingRecord.id, updatedData);

      // Reset form
      setEditingRecord(null);
      setIsEditMode(false);
      setSelectedEmployee("");
      setWorkDays("30");
      setHolidayDays("");
      setAdvances("");
      setDiscounts("");
      setWhiteWage("");
      setPresentismoStatus("mantiene");
      setOvertimeEnabled(false);
      setOvertimeHours("");
      setBonusAmount("");
      setIsNewPayrollOpen(false);

      setSuccessMessage("Liquidación actualizada exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating payroll:", error);
      alert("Error al actualizar liquidación: " + error.message);
    }
  };

  // Función para generar recibo
  const generatePayslip = async (record) => {
    try {
      const employee = employees.find((emp) => emp.id === record.employeeId);
      if (!employee) {
        alert("No se encontró la información del empleado");
        return;
      }

      const receiptData = {
        employee: {
          name: employee.name,
          dni: employee.dni,
          position: employee.position,
          startDate: employee.startDate,
        },
        payroll: record,
        period: record.period,
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

  // Helper functions for status display
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "processed":
        return "secondary";
      case "approved":
        return "outline";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagada";
      case "processed":
        return "Procesada";
      case "approved":
        return "Aprobada";
      case "pending":
        return "Pendiente";
      default:
        return "Borrador";
    }
  };

  // Función para eliminar liquidaci��n
  const handleDeletePayroll = async () => {
    if (!recordToDelete) return;

    try {
      await deletePayrollRecord(recordToDelete.id);
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      setSuccessMessage("Liquidación eliminada exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting payroll:", error);
      alert("Error al eliminar liquidación: " + error.message);
    }
  };

  // Función para obtener período actual
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  // Filtrar registros por período actual vs historial
  const currentPeriodRecords = payrollRecords.filter(
    (record) => record.period === getCurrentPeriod(),
  );

  const historyRecords = payrollRecords.filter(
    (record) => record.period !== getCurrentPeriod(),
  );

  // Cálculo de payroll
  const calculatePayroll = () => {
    if (!selectedEmployee) return null;

    const employee = employees.find(
      (e) => e.id.toString() === selectedEmployee,
    );
    if (!employee) return null;

    const workDaysNum = parseInt(workDays) || 0;
    const holidayDaysNum = parseInt(holidayDays) || 0;
    const overtimeHoursNum = overtimeEnabled
      ? parseFloat(overtimeHours) || 0
      : 0;
    const advancesNum = parseFloat(advances) || 0;
    const discountsNum = parseFloat(discounts) || 0;
    const bonusNum = parseFloat(bonusAmount) || 0;

    // Cálculos base
    const basePay = employee.dailyWage * workDaysNum;
    const holidayPay = employee.dailyWage * holidayDaysNum * 2; // Doble pago
    const hourlyRate = employee.dailyWage / 8;
    const overtimePay = overtimeHoursNum * hourlyRate * 1.5; // 50% extra

    // Presentismo: valor fijo del empleado si mantiene
    const presentismoAmount =
      presentismoStatus === "mantiene" ? employee?.presentismo || 0 : 0;

    const bonusPay = bonusNum;

    // Total bruto
    const grossTotal =
      basePay + holidayPay + overtimePay + presentismoAmount + bonusPay;

    // Deducciones
    const totalAdvances = advancesNum;
    const totalDiscounts = discountsNum;

    // Total después de deducciones
    const totalAfterDeductions = grossTotal - totalAdvances - totalDiscounts;

    // División entre blanco e informal
    const manualWhiteWage = parseFloat(whiteWage) || 0;
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Editar Liquidación" : "Nueva Liquidación"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Modifica los datos de la liquidación existente"
                    : "Completa los datos para crear una nueva liquidación"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">
                      Empleado <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedEmployee}
                      onValueChange={setSelectedEmployee}
                      disabled={isEditMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees
                          .filter((emp) => emp.status === "active")
                          .map((employee) => (
                            <SelectItem
                              key={employee.id}
                              value={employee.id.toString()}
                            >
                              {employee.name} - {employee.position}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedEmployee && (
                      <p className="text-xs text-muted-foreground">
                        Sueldo diario:{" "}
                        {formatCurrency(
                          employees.find(
                            (e) => e.id.toString() === selectedEmployee,
                          )?.dailyWage || 0,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">
                      Período <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="period"
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      disabled={isEditMode}
                    />
                    {selectedPeriod && isAguinaldoPeriod(selectedPeriod) && (
                      <p className="text-xs text-green-600">
                        ✨ Período con aguinaldo (SAC)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workDays">
                      Días Trabajados <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="workDays"
                      type="number"
                      min="1"
                      max="31"
                      value={workDays}
                      onChange={(e) => setWorkDays(e.target.value)}
                    />
                    {selectedEmployee && (
                      <p className="text-xs text-muted-foreground">
                        Sueldo base:{" "}
                        {formatCurrency(
                          (employees.find(
                            (e) => e.id.toString() === selectedEmployee,
                          )?.dailyWage || 0) * parseInt(workDays),
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
                    <Label htmlFor="presentismo">Presentismo</Label>
                    <Select
                      value={presentismoStatus}
                      onValueChange={setPresentismoStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mantiene">
                          Mantiene{" "}
                          {selectedEmployee && (
                            <span>
                              (
                              {formatCurrency(
                                employees.find(
                                  (e) => e.id.toString() === selectedEmployee,
                                )?.presentismo || 0,
                              )}
                              )
                            </span>
                          )}
                        </SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="advances">Adelantos</Label>
                    <Input
                      id="advances"
                      type="number"
                      placeholder="0"
                      value={advances}
                      onChange={(e) => setAdvances(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discounts">Descuentos</Label>
                    <Input
                      id="discounts"
                      type="number"
                      placeholder="0"
                      value={discounts}
                      onChange={(e) => setDiscounts(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whiteWage">Sueldo Depósito</Label>
                    <Input
                      id="whiteWage"
                      type="number"
                      placeholder="0"
                      value={whiteWage}
                      onChange={(e) => setWhiteWage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      El resto se calculará como sueldo en efectivo
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
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total Neto:</span>
                            <span>{formatCurrency(calculation.netTotal)}</span>
                          </div>
                          <div className="text-sm space-y-1 mt-2">
                            <div className="flex justify-between">
                              <span>Depósito:</span>
                              <span>
                                {formatCurrency(calculation.whiteAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Efectivo:</span>
                              <span>
                                {formatCurrency(calculation.informalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-muted-foreground">
                      Selecciona un empleado para ver la vista previa
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={
                    isEditMode ? handleUpdatePayroll : handleCreatePayroll
                  }
                  disabled={!selectedEmployee || !selectedPeriod}
                  className="flex-1"
                >
                  {isEditMode ? "Actualizar Liquidación" : "Crear Liquidación"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNewPayrollOpen(false);
                    setIsEditMode(false);
                    setEditingRecord(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
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
                <div>
                  <CardTitle>Liquidaciones del Período</CardTitle>
                  <CardDescription>
                    Estado actual de las liquidaciones registradas
                  </CardDescription>
                </div>
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
                      {currentPeriodRecords
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
                              {isAguinaldoPeriod(record.period)
                                ? (() => {
                                    const employee = employees.find(
                                      (e) => e.name === record.employeeName,
                                    );
                                    if (!employee) return "-";

                                    const correctAguinaldo = calculateAguinaldo(
                                      employee,
                                      record.period,
                                    );
                                    if (correctAguinaldo === 0) return "-";

                                    // Determinar si es proporcional usando la lógica correcta
                                    const [year, month] =
                                      record.period.split("-");
                                    const currentYear = parseInt(year);
                                    const currentMonth = parseInt(month);

                                    const semesterStart =
                                      currentMonth === 6
                                        ? new Date(currentYear, 0, 1)
                                        : new Date(currentYear, 6, 1);

                                    const semesterEnd =
                                      currentMonth === 6
                                        ? new Date(currentYear, 5, 30)
                                        : new Date(currentYear, 11, 31);

                                    const startDate = new Date(
                                      employee.startDate,
                                    );
                                    const effectiveStartDate = new Date(
                                      startDate,
                                    );
                                    effectiveStartDate.setDate(
                                      effectiveStartDate.getDate() + 1,
                                    );

                                    const effectiveStart =
                                      effectiveStartDate > semesterStart
                                        ? effectiveStartDate
                                        : semesterStart;

                                    const totalSemesterDays =
                                      Math.ceil(
                                        (semesterEnd.getTime() -
                                          semesterStart.getTime()) /
                                          (1000 * 60 * 60 * 24),
                                      ) + 1;

                                    const daysWorked =
                                      Math.ceil(
                                        (semesterEnd.getTime() -
                                          effectiveStart.getTime()) /
                                          (1000 * 60 * 60 * 24),
                                      ) + 1;

                                    const isProportional =
                                      daysWorked < totalSemesterDays;

                                    return (
                                      <div>
                                        <div>
                                          {formatCurrency(correctAguinaldo)}
                                        </div>
                                        {isProportional && (
                                          <div className="text-xs text-green-700">
                                            Proporcional
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()
                                : "-"}
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
