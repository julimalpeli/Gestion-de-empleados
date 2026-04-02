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
import { CurrencyInputSimple as CurrencyInput } from "@/components/ui/currency-input-simple";
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
import { calculateAguinaldo } from "@/utils/aguinaldo";
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
  Edit3,
  Clock,
  Check,
  Settings,
  Search,
  CircleDollarSign,
  Eye,
  Send,
  ArrowRight,
  X,
  Copy,
  FolderOpen,
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
import PermissionGate from "@/components/PermissionGate";
import usePermissions from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth-simple";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { salaryHistoryService } from "@/services/salaryHistoryService";

// Data is now loaded from Supabase via hooks

const Payroll = () => {
  console.log("💰 Payroll component starting to render...");
  console.log("🔍 Payroll component: Loading hooks...");
  const [isNewPayrollOpen, setIsNewPayrollOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [workDays, setWorkDays] = useState("30");
  const [holidayDays, setHolidayDays] = useState("");
  const [advances, setAdvances] = useState("");
  const [discounts, setDiscounts] = useState("");
  const [whiteWage, setWhiteWage] = useState("");

  // Debug logging para whiteWage
  const debugSetWhiteWage = (value, source = "unknown") => {
    console.log(`🔍 Setting whiteWage: "${value}" from: ${source}`);
    setWhiteWage(value);
  };
  const [presentismoStatus, setPresentismoStatus] = useState("mantiene");
  const [overtimeEnabled, setOvertimeEnabled] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Campo de búsqueda
  const [employeeFilter, setEmployeeFilter] = useState("active"); // Por defecto solo activos
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isPayrollDocManagerOpen, setIsPayrollDocManagerOpen] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState(null);
  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState(null);

  // Estado para valores históricos (cuando editamos liquidaciones pasadas)
  const [historicalSalary, setHistoricalSalary] = useState(null);

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

  const { isAdmin, isManager, canEditModule, hasPermission } = usePermissions();
  const { user } = useAuth();

  // Handle status changes
  const handleStatusChange = async (recordId: string, newStatus: string) => {
    if (!hasPermission("payroll", "edit")) {
      alert("No tenés permiso para cambiar el estado de liquidaciones.");
      return;
    }
    try {
      const record = payrollRecords.find((r) => r.id === recordId);
      if (!record) {
        alert("No se encontró la liquidación");
        return;
      }

      // Validate status transition
      const validTransitions = {
        draft: ["pending"],
        pending: ["approved", "draft"],
        approved: ["processed", "draft"],
        processed: ["paid"],
        paid: [], // No transitions from paid
      };

      if (!validTransitions[record.status]?.includes(newStatus)) {
        alert("Transición de estado no válida");
        return;
      }

      // Show confirmation for critical actions
      if (newStatus === "paid") {
        if (
          !confirm(
            "¿Confirma que desea marcar esta liquidación como pagada? Esta acción no se puede deshacer.",
          )
        ) {
          return;
        }
      }

      if (
        newStatus === "draft" &&
        (record.status === "pending" || record.status === "approved")
      ) {
        if (
          !confirm(
            "¿Confirma que desea rechazar esta liquidación y devolverla a borrador?",
          )
        ) {
          return;
        }
      }

      // Update the record with new status and timestamp
      const updateData = {
        status: newStatus,
        processedDate:
          newStatus === "paid"
            ? new Date().toISOString()
            : record.processedDate,
      };

      await updatePayrollRecord(recordId, updateData);

      // Show success message
      const statusNames = {
        draft: "Borrador",
        pending: "Pendiente",
        approved: "Aprobada",
        processed: "Procesada",
        paid: "Pagada",
      };

      setSuccessMessage(
        `Liquidación actualizada a estado: ${statusNames[newStatus]}`,
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar el estado de la liquidación");
    }
  };

  // Handle duplicate payroll record
  const handleDuplicateRecord = (record) => {
    try {
      const employee = employees.find((e) => e.id === record.employeeId || e.name === record.employeeName);
      if (!employee) {
        alert("No se encontró el empleado para duplicar la liquidación");
        return;
      }

      // Set all form fields with the original record data
      setSelectedEmployee(employee.id.toString());
      setWorkDays(record.baseDays.toString());
      setHolidayDays(record.holidayDays?.toString() || "");
      setAdvances(record.advances?.toString() || "");
      setDiscounts(record.discounts?.toString() || "");
      debugSetWhiteWage(
        record.whiteAmount?.toString() || "",
        "edit form setup",
      );
      setBonusAmount(record.bonusAmount?.toString() || "");

      // Set overtime data
      if (record.overtimeHours && record.overtimeHours > 0) {
        setOvertimeEnabled(true);
        setOvertimeHours(record.overtimeHours.toString());
      } else {
        setOvertimeEnabled(false);
        setOvertimeHours("");
      }

      // Set presentismo status based on amount
      if (record.presentismoAmount > 0) {
        setPresentismoStatus("mantiene");
      } else {
        setPresentismoStatus("perdido");
      }

      // Set current period as default for the duplicate
      const currentDate = new Date();
      const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      setSelectedPeriod(currentPeriod);

      // Open the form in create mode (not edit mode)
      setIsEditMode(false);
      setEditingRecord(null);
      setIsNewPayrollOpen(true);

      // Show success message
      setSuccessMessage(
        `Liquidación duplicada. Modifica los datos necesarios y guarda.`,
      );
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error duplicating record:", error);
      alert("Error al duplicar la liquidación");
    }
  };

  // Configurar período actual automáticamente
  useEffect(() => {
    if (!selectedPeriod) {
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setSelectedPeriod(currentPeriod);
    }
  }, [selectedPeriod]);

  // Auto-seleccionar el último período solo al cargar inicialmente los datos
  // No cambiar automáticamente si el usuario ya eligió "all"
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    if (
      payrollRecords &&
      payrollRecords.length > 0 &&
      periodFilter === "all" &&
      !hasAutoSelected
    ) {
      // Obtener todos los períodos únicos y ordenarlos del más reciente al más antiguo
      const periods = [
        ...new Set(payrollRecords.map((record) => record.period)),
      ];
      const sortedPeriods = periods.sort((a, b) => {
        // Convertir "YYYY-MM" a Date para comparar
        const dateA = new Date(a + "-01");
        const dateB = new Date(b + "-01");
        return dateB.getTime() - dateA.getTime(); // Más reciente primero
      });

      if (sortedPeriods.length > 0) {
        const latestPeriod = sortedPeriods[0];
        console.log(`🔍 Auto-selecting latest period: ${latestPeriod}`);
        setPeriodFilter(latestPeriod);
        setHasAutoSelected(true);
      }
    }
  }, [payrollRecords, periodFilter, hasAutoSelected]);

  // Función para verificar si un período es de aguinaldo (junio o diciembre)
  const isAguinaldoPeriod = (period: string) => {
    const [, month] = period.split("-");
    const monthNum = parseInt(month, 10);
    return monthNum === 6 || monthNum === 12;
  };

  // Convierte período mensual (YYYY-MM) a formato semestre (YYYY-S) para calculateAguinaldo
  const toSemesterPeriod = (monthPeriod: string): string => {
    const [year, month] = monthPeriod.split("-");
    const monthNum = parseInt(month, 10);
    const semester = monthNum <= 6 ? "1" : "2";
    return `${year}-${semester}`;
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
        baseAmount: calculation.basePay || 0,
        overtimeHours: overtimeEnabled ? parseFloat(overtimeHours) || 0 : 0,
        advances: parseFloat(advances) || 0,
        discounts: parseFloat(discounts) || 0,
        whiteAmount: calculation.whiteAmount || 0, // Guardar monto del depósito (valor ingresado por usuario)
        informalAmount: calculation.informalAmount || 0, // Guardar monto del efectivo (calculado)
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
      debugSetWhiteWage("", "reset after create");
      setPresentismoStatus("mantiene");
      setOvertimeEnabled(false);
      setOvertimeHours("");
      setBonusAmount("");
      setHistoricalSalary(null);
      setIsNewPayrollOpen(false);

      setSuccessMessage("Liquidación creada exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error creating payroll:", error);
      alert(`Error creando liquidación: ${error.message}`);
    }
  };

  // Función para ver detalles sin edición (solo lectura)
  const handleViewRecord = async (record) => {
    setEditingRecord(record);
    setSelectedEmployee(record.employeeId.toString());
    setSelectedPeriod(record.period);
    setWorkDays(record.baseDays.toString());
    setHolidayDays(record.holidayDays?.toString() || "");
    setAdvances(record.advances?.toString() || "0");
    setDiscounts(record.discounts?.toString() || "0");
    setBonusAmount(record.bonusAmount?.toString() || "0");
    setOvertimeHours(record.overtimeHours?.toString() || "0");
    setOvertimeEnabled(record.overtimeHours > 0);
    setPresentismoStatus(record.presentismoAmount > 0 ? "mantiene" : "perdido");

    // Obtener el sueldo histórico correcto para el período de la liquidación
    try {
      console.log(
        `🔍 [DEBUG] Getting historical salary for employee ${record.employeeId}, period ${record.period}`,
      );

      const historicalSalaryData =
        await salaryHistoryService.getSalaryForPeriod(
          record.employeeId.toString(),
          record.period,
        );

      console.log(`📊 [DEBUG] Historical data received:`, historicalSalaryData);
      console.log(
        `💰 [DEBUG] Setting whiteWage to: ${historicalSalaryData.white_wage} (from ${historicalSalaryData.source})`,
      );

      // En vista (solo lectura) usar salario del período para evitar desfasajes al reingresar
      setHistoricalSalary(historicalSalaryData);

      // Mantener el valor original de whiteAmount (forma de pago) como estaba guardado
      debugSetWhiteWage(
        record.whiteAmount?.toString() || "",
        "view record load",
      );
    } catch (error) {
      console.error("Error getting historical salary for view:", error);
      // Fallback al valor almacenado en la liquidación
      debugSetWhiteWage(record.whiteAmount?.toString() || "0", "view fallback");
    }

    setIsEditMode(false); // Solo lectura
    setIsNewPayrollOpen(true);
  };

  // Función para editar registro
  const handleEditRecord = async (record) => {
    setEditingRecord(record);
    setSelectedEmployee(record.employeeId.toString());
    setSelectedPeriod(record.period);
    setWorkDays(record.baseDays.toString());
    setHolidayDays(record.holidayDays?.toString() || "");
    setAdvances(record.advances?.toString() || "0");
    setDiscounts(record.discounts?.toString() || "0");
    setBonusAmount(record.bonusAmount?.toString() || "0");
    setOvertimeHours(record.overtimeHours?.toString() || "0");
    setOvertimeEnabled(record.overtimeHours > 0);
    setPresentismoStatus(record.presentismoAmount > 0 ? "mantiene" : "perdido");

    // Obtener el sueldo histórico solo para períodos pasados, no para el período actual
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const isCurrentPeriod = record.period === currentPeriod;

    try {
      // Siempre usar salario del período de la liquidación (evita desfasajes al editar)
      const historicalSalaryData =
        await salaryHistoryService.getSalaryForPeriod(
          record.employeeId.toString(),
          record.period,
        );

      console.log(
        `🔍 Historical salary for period ${record.period}:`,
        historicalSalaryData,
      );

      // Guardar valores históricos para cálculos (incluye presentismo del período)
      setHistoricalSalary(historicalSalaryData);

      // Mantener el valor original de whiteAmount (forma de pago) como estaba guardado
      debugSetWhiteWage(
        record.whiteAmount?.toString() || "",
        "edit record load",
      );

      // También actualizar el presentismo histórico si es necesario
      const employee = employees.find(
        (e) => e.id.toString() === record.employeeId.toString(),
      );

      // Solo verificar presentismo histórico si se cargó data histórica
      if (!isCurrentPeriod && employee) {
        try {
          const salaryData = await salaryHistoryService.getSalaryForPeriod(
            record.employeeId.toString(),
            record.period,
          );

          if (salaryData && salaryData.presentismo !== employee.presentismo) {
            console.log(
              `📊 Using historical presentismo: ${salaryData.presentismo} vs current: ${employee.presentismo}`,
            );
          }
        } catch (err) {
          console.log("Could not verify historical presentismo:", err.message);
        }
      }
    } catch (error) {
      console.error("Error getting historical salary:", error);
      // Fallback al valor almacenado en la liquidación
      debugSetWhiteWage(record.whiteAmount?.toString() || "0", "edit fallback");
      setHistoricalSalary(null);
    }

    setIsEditMode(true);
    setIsNewPayrollOpen(true);
  };

  // Función para actualizar payroll
  const handleUpdatePayroll = async () => {
    if (!editingRecord) return;

    const calculation = calculatePayroll();

    try {
      const updatedData = {
        baseDays: parseInt(workDays),
        holidayDays: parseInt(holidayDays) || 0,
        baseAmount: calculation.basePay || 0,
        overtimeHours: overtimeEnabled ? parseFloat(overtimeHours) || 0 : 0,
        advances: parseFloat(advances) || 0,
        discounts: parseFloat(discounts) || 0,
        whiteAmount: calculation.whiteAmount || 0, // Guardar monto del depósito (valor ingresado por usuario)
        informalAmount: calculation.informalAmount || 0, // Guardar monto del efectivo (calculado)
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
      debugSetWhiteWage("", "reset after edit");
      setPresentismoStatus("mantiene");
      setOvertimeEnabled(false);
      setOvertimeHours("");
      setBonusAmount("");
      setHistoricalSalary(null);
      setIsNewPayrollOpen(false);

      setSuccessMessage("Liquidación actualizada exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating payroll:", error);
      alert(`Error actualizando liquidación: ${error.message}`);
    }
  };

  // Eliminar registro
  const handleDeleteRecord = async (id) => {
    try {
      await deletePayrollRecord(id);
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      setSuccessMessage("Liquidación eliminada exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting payroll:", error);
      alert(`Error eliminando liquidación: ${error.message}`);
    }
  };

  // Calcular datos de liquidación
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
    const bonusNum = parseFloat(bonusAmount) || 0;
    const advancesNum = parseFloat(advances) || 0;
    const discountsNum = parseFloat(discounts) || 0;

    // Sueldo base - calcular dailyWage con decimales para evitar errores de redondeo
    // Usar sueldoBase / 30 con decimales en vez del dailyWage redondeado de la DB
    let dailyWageToUse = (employee.sueldoBase || 0) / 30;

    // Si tenemos salario histórico, calcular el dailyWage histórico
    if (
      historicalSalary &&
      historicalSalary.white_wage !== undefined &&
      historicalSalary.informal_wage !== undefined
    ) {
      dailyWageToUse =
        (historicalSalary.white_wage + historicalSalary.informal_wage) / 30;
    }

    const basePay = Math.round(dailyWageToUse * workDaysNum);

    // Pago por feriados (doble)
    const holidayPay = Math.round(dailyWageToUse * holidayDaysNum);

    // Horas extra (50% adicional sobre la hora normal)
    const hourlyRate = dailyWageToUse / 8;
    const overtimePay = Math.round(hourlyRate * 1.5 * overtimeHoursNum);

    // Presentismo: Check if employee receives presentismo at all
    // If receives_presentismo is false, presentismoAmount is always 0
    let presentismoAmount = 0;

    // First check: Does this employee receive presentismo?
    const employeeReceivesPresentismo = employee?.receives_presentismo !== false; // Default true for backward compatibility

    if (employeeReceivesPresentismo) {
      // Employee receives presentismo, now apply mantiene/pierde status
      let presentismoToUse = employee?.presentismo || 0;
      if (historicalSalary && historicalSalary.presentismo !== undefined) {
        presentismoToUse = historicalSalary.presentismo;
      }

      // En modo edición, el presentismo podría ser diferente al actual
      // pero mantener la lógica de mantiene/pierde del form
      presentismoAmount =
        presentismoStatus === "mantiene" ? presentismoToUse : 0;
    } else {
      // Employee does NOT receive presentismo - always 0
      presentismoAmount = 0;
    }

    const bonusPay = bonusNum;

    // Total bruto
    const grossTotal =
      basePay + holidayPay + overtimePay + presentismoAmount + bonusPay;

    // Deducciones
    const totalAdvances = advancesNum;
    const totalDiscounts = discountsNum;

    // Total después de deducciones
    const totalAfterDeductions = grossTotal - totalAdvances - totalDiscounts;

    // División entre depósito y efectivo para FORMAS DE PAGO (no afecta el total)
    const manualWhiteWage = parseFloat(whiteWage) || 0;

    // Los montos reales que debe cobrar el empleado (independiente de la forma de pago)
    let realWhiteAmount = 0;
    let realInformalAmount = 0;

    if (employee) {
      // Si tenemos salario histórico (editando liquidación pasada), usar esos valores
      if (historicalSalary && historicalSalary.white_wage !== undefined) {
        realWhiteAmount = historicalSalary.white_wage;
        realInformalAmount = historicalSalary.informal_wage;
      } else {
        realWhiteAmount = employee.sueldoBase || 0;
        realInformalAmount = 0;
      }
    }

    // Calculate aguinaldo if it's an aguinaldo period (June or December)
    let aguinaldoAmount = 0;
    if (isAguinaldoPeriod(selectedPeriod)) {
      const aguinaldoResult = calculateAguinaldo(
        employee,
        toSemesterPeriod(selectedPeriod),
        payrollRecords,
      );
      aguinaldoAmount = aguinaldoResult.amount || 0;
    }

    // Total neto = todos los conceptos positivos - deducciones
    // Usar el salario base proporcional a días trabajados, no el sueldo completo
    const netTotal =
      basePay + // Salario base proporcional a días trabajados
      presentismoAmount +
      overtimePay +
      bonusPay +
      holidayPay +
      aguinaldoAmount -
      totalAdvances -
      totalDiscounts;

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
      whiteAmount: manualWhiteWage, // Forma de pago (depósito)
      informalAmount: netTotal - manualWhiteWage, // Efectivo = Total Neto - Depósito
      realWhiteAmount, // Monto real en depósito
      realInformalAmount, // Monto real informal
      netTotal,
      holidayBonus: holidayPay,
      aguinaldo: aguinaldoAmount,
      overtimeAmount: overtimePay,
    };
  };

  const calculation = selectedEmployee
    ? calculatePayroll(!!editingRecord)
    : null;

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount || 0));
  };

  // Función para formatear período
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

  // Filtros
  const filteredRecords = payrollRecords.filter((record) => {
    // Filtro por empleado activo/inactivo
    const employee = employees.find((e) => e.id === record.employeeId || e.name === record.employeeName);
    if (!employee) return false;

    if (employeeFilter === "active" && employee.status !== "active")
      return false;
    if (employeeFilter === "inactive" && employee.status !== "inactive")
      return false;

    // Filtro por estado
    if (statusFilter !== "all" && record.status !== statusFilter) return false;

    // Filtro por período
    if (periodFilter !== "all" && record.period !== periodFilter) return false;

    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = record.employeeName
        ?.toLowerCase()
        .includes(searchLower);
      const matchesPeriod = formatPeriod(record.period)
        .toLowerCase()
        .includes(searchLower);
      const matchesPosition = employee?.position
        ?.toLowerCase()
        .includes(searchLower);
      const matchesDni = employee?.dni?.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesPeriod && !matchesPosition && !matchesDni) {
        return false;
      }
    }

    return true;
  });

  // Mostrar loading
  if (payrollLoading || employeesLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-32">
          <p>Cargando datos de liquidaciones...</p>
        </div>
      </div>
    );
  }

  // Mostrar error con botón de diagnóstico
  if (payrollError || employeesError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-red-500 text-center max-w-md">
            ❌ Error de conectividad: {payrollError || employeesError}
          </p>
          <p className="text-gray-600 text-sm text-center">
            No se puede conectar con la base de datos. Esto puede ser un
            problema temporal.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={diagnoseConnectivity}
              className="bg-blue-50 border-blue-200 text-blue-800"
            >
              🔍 Diagnosticar Conectividad
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="bg-gray-50 border-gray-200 text-gray-800"
            >
              🔄 Recargar Página
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <PermissionGate module="payroll" action="create">
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Liquidación
              </Button>
            </DialogTrigger>
          </PermissionGate>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecord && !isEditMode
                  ? "Ver Liquidación"
                  : isEditMode
                    ? "Editar Liquidación"
                    : "Nueva Liquidación"}
              </DialogTitle>
              <DialogDescription>
                {editingRecord && !isEditMode
                  ? "Detalles de la liquidación (solo lectura)"
                  : isEditMode
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
                    disabled={isEditMode || (editingRecord && !isEditMode)}
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
                      {(() => {
                        const emp = employees.find(
                          (e) => e.id.toString() === selectedEmployee,
                        );
                        let daily = (emp?.sueldoBase || 0) / 30;

                        if (editingRecord && editingRecord.baseAmount != null) {
                          const baseDays = editingRecord.baseDays || 0;
                          if (baseDays > 0) {
                            daily = editingRecord.baseAmount / baseDays;
                          }
                        } else if (
                          historicalSalary &&
                          historicalSalary.white_wage !== undefined &&
                          historicalSalary.informal_wage !== undefined
                        ) {
                          daily =
                            (historicalSalary.white_wage +
                              historicalSalary.informal_wage) /
                              30;
                        }

                        return formatCurrency(daily);
                      })()}
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
                    disabled={isEditMode || (editingRecord && !isEditMode)}
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
                    disabled={editingRecord && !isEditMode}
                  />
                  {selectedEmployee && (
                    <p className="text-xs text-muted-foreground">
                      Sueldo base:{" "}
                      {(() => {
                        if (editingRecord && editingRecord.baseAmount != null) {
                          return formatCurrency(editingRecord.baseAmount || 0);
                        }

                        const emp = employees.find(
                          (e) => e.id.toString() === selectedEmployee,
                        );
                        let daily = (emp?.sueldoBase || 0) / 30;
                        if (
                          historicalSalary &&
                          historicalSalary.white_wage !== undefined &&
                          historicalSalary.informal_wage !== undefined
                        ) {
                          daily =
                            (historicalSalary.white_wage +
                              historicalSalary.informal_wage) /
                              30;
                        }
                        return formatCurrency(
                          daily * (parseInt(workDays) || 0),
                        );
                      })()}
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
                    disabled={editingRecord && !isEditMode}
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
                      disabled={editingRecord && !isEditMode}
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
                        disabled={editingRecord && !isEditMode}
                      />
                      {selectedEmployee && (
                        <p className="text-xs text-muted-foreground">
                          Tarifa por hora:{" "}
                          {(() => {
                            let daily: number | undefined;

                            if (
                              editingRecord &&
                              editingRecord.baseAmount != null
                            ) {
                              const baseDays = editingRecord.baseDays || 0;
                              if (baseDays > 0) {
                                daily = editingRecord.baseAmount / baseDays;
                              }
                            }

                            if (daily === undefined) {
                              const emp = employees.find(
                                (e) => e.id.toString() === selectedEmployee,
                              );
                              daily = (emp?.sueldoBase || 0) / 30;
                              if (
                                historicalSalary &&
                                historicalSalary.white_wage !== undefined &&
                                historicalSalary.informal_wage !== undefined
                              ) {
                                daily =
                                  (historicalSalary.white_wage +
                                    historicalSalary.informal_wage) /
                                    30;
                              }
                            }

                            return formatCurrency((daily || 0) / 8);
                          })()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {selectedEmployee &&
                  employees.find((e) => e.id.toString() === selectedEmployee)
                    ?.receives_presentismo !== false && (
                    <div className="space-y-2">
                      <Label htmlFor="presentismo">Presentismo</Label>
                      <Select
                        value={presentismoStatus}
                        onValueChange={setPresentismoStatus}
                        disabled={editingRecord && !isEditMode}
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
                  )}
                {selectedEmployee &&
                  employees.find((e) => e.id.toString() === selectedEmployee)
                    ?.receives_presentismo === false && (
                    <div className="space-y-2 p-3 bg-gray-100 rounded border border-gray-300">
                      <p className="text-sm text-gray-700">
                        ℹ️ Este empleado no percibe presentismo
                      </p>
                    </div>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="bonusAmount">Bono Libre</Label>
                  <CurrencyInput
                    id="bonusAmount"
                    placeholder="$ 0,00"
                    value={bonusAmount}
                    onChange={(value) => setBonusAmount(value)}
                    disabled={editingRecord && !isEditMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advances">Adelantos</Label>
                  <CurrencyInput
                    id="advances"
                    placeholder="$ 0,00"
                    value={advances}
                    onChange={(value) => setAdvances(value)}
                    disabled={editingRecord && !isEditMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discounts">Descuentos</Label>
                  <CurrencyInput
                    id="discounts"
                    placeholder="$ 0,00"
                    value={discounts}
                    onChange={(value) => setDiscounts(value)}
                    disabled={editingRecord && !isEditMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whiteWage">Sueldo Depósito</Label>
                  <CurrencyInput
                    id="whiteWage"
                    placeholder="$ 0,00"
                    value={whiteWage}
                    onChange={(value) => debugSetWhiteWage(value, "user input")}
                    disabled={editingRecord && !isEditMode}
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
              {/* Solo mostrar botón de guardar si no es solo lectura */}
              {(isEditMode || !editingRecord) && (
                <Button
                  onClick={
                    isEditMode ? handleUpdatePayroll : handleCreatePayroll
                  }
                  disabled={!selectedEmployee || !selectedPeriod}
                  className="flex-1"
                >
                  {isEditMode ? "Actualizar Liquidación" : "Crear Liquidación"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewPayrollOpen(false);
                  setIsEditMode(false);
                  setEditingRecord(null);
                  setHistoricalSalary(null);
                }}
                className="flex-1"
              >
                {isEditMode || !editingRecord ? "Cancelar" : "Cerrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredRecords.reduce(
                  (sum, record) => sum + record.netTotal,
                  0,
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.length}</div>
            <p className="text-xs text-muted-foreground">Período actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estados</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <CircleDollarSign className="h-3 w-3" />
                  Pagadas
                </span>
                <span className="font-medium">
                  {payrollRecords.filter((r) => r.status === "paid").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-600 flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  Procesadas
                </span>
                <span className="font-medium">
                  {
                    payrollRecords.filter((r) => r.status === "processed")
                      .length
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Aprobadas
                </span>
                <span className="font-medium">
                  {payrollRecords.filter((r) => r.status === "approved").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pendientes
                </span>
                <span className="font-medium">
                  {payrollRecords.filter((r) => r.status === "pending").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payrollRecords.length > 0
                ? Math.round(
                    (payrollRecords.filter((r) => r.status === "paid").length /
                      payrollRecords.length) *
                      100,
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {payrollRecords.filter((r) => r.status === "paid").length} de{" "}
              {payrollRecords.length} pagadas
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-green-600 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    payrollRecords.length > 0
                      ? (payrollRecords.filter((r) => r.status === "paid")
                          .length /
                          payrollRecords.length) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Liquidaciones</CardTitle>
            <CardDescription>
              Gestión de todas las liquidaciones del sistema (
              {filteredRecords.length} de {payrollRecords.length} mostradas)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar liquidaciones por empleado, período, posición o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Solo empleados activos</SelectItem>
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

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los períodos</SelectItem>
                {Array.from(new Set(payrollRecords.map((r) => r.period)))
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map((period) => (
                    <SelectItem key={period} value={period}>
                      {formatPeriod(period)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Adelantos</TableHead>
                  <TableHead>Descuentos</TableHead>
                  <TableHead>Horas Extra</TableHead>
                  <TableHead>Feriados</TableHead>
                  <TableHead>Bono</TableHead>
                  <TableHead>Aguinaldo</TableHead>
                  <TableHead>Presentismo</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Efectivo</TableHead>
                  <TableHead>Total Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords
                  .sort(
                    (a, b) =>
                      new Date(b.period).getTime() -
                      new Date(a.period).getTime(),
                  )
                  .map((record) => {
                    const employee = employees.find(
                      (e) => e.id === record.employeeId || e.name === record.employeeName,
                    );
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{record.employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {employee?.position || "Sin posición"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {formatPeriod(record.period)}
                            {isAguinaldoPeriod(record.period) && (
                              <div className="text-xs text-green-600">
                                Período con aguinaldo
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{record.baseDays}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(record.advances)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(record.discounts)}
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
                          {isAguinaldoPeriod(record.period)
                            ? (() => {
                                const employee = employees.find(
                                  (e) => e.id === record.employeeId || e.name === record.employeeName,
                                );
                                if (!employee) return "-";

                                const correctAguinaldoResult =
                                  calculateAguinaldo(
                                    employee,
                                    toSemesterPeriod(record.period),
                                    payrollRecords,
                                  );
                                if (correctAguinaldoResult.amount === 0)
                                  return "-";

                                const isProportional =
                                  correctAguinaldoResult.proportional;

                                return (
                                  <div>
                                    <div>
                                      {formatCurrency(
                                        correctAguinaldoResult.amount,
                                      )}
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
                          {record.presentismoAmount > 0 ? (
                            <span className="text-blue-600 font-medium">
                              {formatCurrency(record.presentismoAmount)}
                            </span>
                          ) : (
                            <span className="text-red-600">Perdido</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(record.whiteAmount)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(record.netTotal - record.whiteAmount)}
                        </TableCell>
                        <TableCell className="font-bold">
                          <div>
                            <div>{formatCurrency(record.netTotal)}</div>
                            {isAguinaldoPeriod(record.period) &&
                              (() => {
                                const employee = employees.find(
                                  (e) => e.id === record.employeeId || e.name === record.employeeName,
                                );
                                if (employee) {
                                  const correctAguinaldoResult =
                                    calculateAguinaldo(
                                      employee,
                                      toSemesterPeriod(record.period),
                                      payrollRecords,
                                    );
                                  if (correctAguinaldoResult.amount > 0) {
                                    return (
                                      <div className="text-xs text-green-700">
                                        Incluye aguinaldo:{" "}
                                        {formatCurrency(
                                          correctAguinaldoResult.amount,
                                        )}
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            {/* Status Badge with Icon */}
                            <Badge
                              variant="outline"
                              className={
                                record.status === "draft"
                                  ? "bg-gray-50 text-gray-700 border-gray-200"
                                  : record.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : record.status === "approved"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : record.status === "processed"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : record.status === "paid"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-gray-50 text-gray-700 border-gray-200"
                              }
                            >
                              <div className="flex items-center gap-1">
                                {record.status === "draft" && (
                                  <Edit3 className="h-3 w-3" />
                                )}
                                {record.status === "pending" && (
                                  <Clock className="h-3 w-3" />
                                )}
                                {record.status === "approved" && (
                                  <Check className="h-3 w-3" />
                                )}
                                {record.status === "processed" && (
                                  <Settings className="h-3 w-3" />
                                )}
                                {record.status === "paid" && (
                                  <CircleDollarSign className="h-3 w-3" />
                                )}
                                <span className="font-medium">
                                  {record.status === "draft"
                                    ? "Borrador"
                                    : record.status === "pending"
                                      ? "Pendiente"
                                      : record.status === "approved"
                                        ? "Aprobada"
                                        : record.status === "processed"
                                          ? "Procesada"
                                          : record.status === "paid"
                                            ? "Pagada"
                                            : "Sin Estado"}
                                </span>
                              </div>
                            </Badge>

                            {/* Status Actions */}
                            <div className="flex gap-1">
                              {/* Send to Pending */}
                              {record.status === "draft" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                        onClick={() =>
                                          handleStatusChange(
                                            record.id,
                                            "pending",
                                          )
                                        }
                                      >
                                        <Send className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Enviar para revisión</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {/* Approve */}
                              {record.status === "pending" && isManager() && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() =>
                                          handleStatusChange(
                                            record.id,
                                            "approved",
                                          )
                                        }
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Aprobar liquidación</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {/* Process */}
                              {record.status === "approved" && isManager() && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                        onClick={() =>
                                          handleStatusChange(
                                            record.id,
                                            "processed",
                                          )
                                        }
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Procesar para pago</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {/* Mark as Paid */}
                              {record.status === "processed" && isManager() && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() =>
                                          handleStatusChange(record.id, "paid")
                                        }
                                      >
                                        <CircleDollarSign className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Marcar como pagada</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {/* Reject/Return to Draft */}
                              {(record.status === "pending" ||
                                record.status === "approved") &&
                                isManager() && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() =>
                                            handleStatusChange(
                                              record.id,
                                              "draft",
                                            )
                                          }
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Rechazar / Volver a borrador</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                              {/* View Only for Paid */}
                              {record.status === "paid" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-gray-500"
                                        onClick={() => handleViewRecord(record)}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver detalles</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            {/* Status Date */}
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
                          <div className="flex gap-1">
                            <PermissionGate module="payroll" action="edit">
                              {record.status !== "paid" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditRecord(record)}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar liquidación</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </PermissionGate>

                            <DropdownMenu>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Generar Recibo</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const emp = employees.find(
                                      (e) => e.id === record.employeeId || e.name === record.employeeName,
                                    );
                                    if (emp) {
                                      generatePayrollReceiptPDF({
                                        employee: {
                                          name: emp.name,
                                          dni: emp.dni,
                                          position: emp.position,
                                          startDate: emp.startDate,
                                        },
                                        payroll: record,
                                        period: formatPeriod(record.period),
                                        company: {
                                          name: "Cadiz Bar",
                                          address: "Dirección del Local",
                                          phone: "Teléfono de Contacto",
                                        },
                                      });
                                    } else {
                                      alert(
                                        "Error: No se encontró información del empleado",
                                      );
                                    }
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const emp = employees.find(
                                      (e) => e.id === record.employeeId || e.name === record.employeeName,
                                    );
                                    if (emp) {
                                      generatePayrollReceiptExcel({
                                        employee: {
                                          name: emp.name,
                                          dni: emp.dni,
                                          position: emp.position,
                                          startDate: emp.startDate,
                                        },
                                        payroll: record,
                                        period: formatPeriod(record.period),
                                        company: {
                                          name: "Cadiz Bar",
                                          address: "Dirección del Local",
                                          phone: "Teléfono de Contacto",
                                        },
                                      });
                                    } else {
                                      alert(
                                        "Error: No se encontró información del empleado",
                                      );
                                    }
                                  }}
                                >
                                  <div className="h-4 w-4 mr-2 text-center">
                                    📊
                                  </div>
                                  Generar Excel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const emp = employees.find(
                                        (e) => e.id === record.employeeId || e.name === record.employeeName,
                                      );
                                      if (emp) {
                                        setSelectedPayrollRecord(record);
                                        setSelectedEmployeeForDocs(emp);
                                        setIsPayrollDocManagerOpen(true);
                                      } else {
                                        alert(
                                          "Error: No se encontró información del empleado",
                                        );
                                      }
                                    }}
                                  >
                                    <FolderOpen className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Gestionar documentos</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <PermissionGate module="payroll" action="create">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDuplicateRecord(record)
                                      }
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Duplicar liquidación</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </PermissionGate>

                            <PermissionGate module="payroll" action="delete">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setRecordToDelete(record);
                                        setDeleteConfirmOpen(true);
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar liquidación</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </PermissionGate>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la liquidación de {recordToDelete?.employeeName} para el período{" "}
              {recordToDelete ? formatPeriod(recordToDelete.period) : ""}.
            </AlertDialogDescription>
            {recordToDelete?.status === "paid" && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                ⚠️ <strong>Advertencia:</strong> Esta liquidación está marcada
                como PAGADA. Eliminarla afectará los registros de pagos
                realizados.
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteRecord(recordToDelete?.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Manager Dialog */}
      {selectedEmployeeForDocs && (
        <DocumentManager
          isOpen={isPayrollDocManagerOpen}
          onClose={() => setIsPayrollDocManagerOpen(false)}
          employee={selectedEmployeeForDocs}
          payrollId={selectedPayrollRecord?.id}
          title={`Documentos de ${selectedEmployeeForDocs.name} - ${selectedPayrollRecord ? formatPeriod(selectedPayrollRecord.period) : "Liquidación"}`}
        />
      )}
    </div>
  );
};

export default Payroll;
