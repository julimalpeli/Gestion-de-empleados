import { supabase } from "@/lib/supabase";
import type { Employee, PayrollRecord } from "@/services/interfaces";
import { calculateAguinaldo } from "./aguinaldo";

export interface PreGenerationResult {
  success: boolean;
  createdCount: number;
  failedCount: number;
  errors: Array<{ employeeId: string; employeeName: string; error: string }>;
  message: string;
}

export interface PreGenerationRequest {
  period: string;
  employees: Employee[];
  payrollRecords: PayrollRecord[];
}

/**
 * Pre-generates aguinaldo liquidaciones for all active employees in a given period
 * Only works for June (month 06) or December (month 12) periods
 */
export async function preGenerateAguinaldosForPeriod(
  request: PreGenerationRequest,
): Promise<PreGenerationResult> {
  const { period, employees, payrollRecords } = request;
  const [year, month] = period.split("-");

  // Validate period (June or December only)
  if (month !== "06" && month !== "12") {
    return {
      success: false,
      createdCount: 0,
      failedCount: 0,
      errors: [],
      message: `Período inválido. Solo se pueden pre-generar aguinaldos para Junio (06) o Diciembre (12). Período recibido: ${period}`,
    };
  }

  // Check if records already exist for this period
  const existingRecords = payrollRecords.filter((p) => p.period === period);
  if (existingRecords.length > 0) {
    return {
      success: false,
      createdCount: 0,
      failedCount: 0,
      errors: [],
      message: `Ya existen ${existingRecords.length} registros de liquidación para el período ${period}. Elimina los registros existentes antes de pre-generar nuevamente.`,
    };
  }

  // Convert month number to semester
  const monthNum = parseInt(month, 10);
  const semester = monthNum === 6 ? "1" : "2";
  const semesterPeriod = `${year}-${semester}`;

  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const errors: Array<{ employeeId: string; employeeName: string; error: string }> = [];
  let createdCount = 0;

  // Prepare records to insert
  const recordsToInsert: Array<{
    employee_id: string;
    period: string;
    base_days: number;
    holiday_days: number;
    base_amount: number;
    holiday_bonus: number;
    aguinaldo: number;
    discounts: number;
    advances: number;
    white_amount: number;
    informal_amount: number;
    presentismo_amount: number;
    net_total: number;
    status: string;
    notes: string;
  }> = [];

  for (const employee of activeEmployees) {
    try {
      const aguinaldoResult = calculateAguinaldo(employee, semesterPeriod, payrollRecords);

      if (!aguinaldoResult.corresponds) {
        errors.push({
          employeeId: employee.id,
          employeeName: employee.name,
          error: aguinaldoResult.reason,
        });
        continue;
      }

      // Create a minimal payroll record with aguinaldo pre-filled
      recordsToInsert.push({
        employee_id: employee.id,
        period,
        base_days: 0,
        holiday_days: 0,
        base_amount: 0,
        holiday_bonus: 0,
        aguinaldo: aguinaldoResult.amount,
        discounts: 0,
        advances: 0,
        white_amount: 0,
        informal_amount: 0,
        presentismo_amount: 0,
        net_total: aguinaldoResult.amount,
        status: "draft",
        notes: `Pre-generado automáticamente. Mejor sueldo: ${aguinaldoResult.bestSalary} (${aguinaldoResult.bestSalaryPeriod}). Días: ${aguinaldoResult.daysWorked}/${aguinaldoResult.totalDays}`,
      });
    } catch (error) {
      errors.push({
        employeeId: employee.id,
        employeeName: employee.name,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  if (recordsToInsert.length === 0) {
    return {
      success: false,
      createdCount: 0,
      failedCount: errors.length,
      errors,
      message: `No se pudo pre-generar ningún aguinaldo. ${errors.length} empleado(s) con errores.`,
    };
  }

  // Insert all records at once
  try {
    const { error } = await supabase
      .from("payroll_records")
      .insert(recordsToInsert);

    if (error) {
      return {
        success: false,
        createdCount: 0,
        failedCount: recordsToInsert.length,
        errors: [
          {
            employeeId: "batch",
            employeeName: "Inserción en base de datos",
            error: error.message,
          },
        ],
        message: `Error al insertar registros: ${error.message}`,
      };
    }

    createdCount = recordsToInsert.length;
  } catch (error) {
    return {
      success: false,
      createdCount: 0,
      failedCount: recordsToInsert.length,
      errors: [
        {
          employeeId: "batch",
          employeeName: "Conexión a base de datos",
          error: error instanceof Error ? error.message : "Error desconocido",
        },
      ],
      message: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }

  return {
    success: true,
    createdCount,
    failedCount: errors.length,
    errors,
    message: `Se pre-generaron ${createdCount} aguinaldos para el período ${period}. ${errors.length > 0 ? `${errors.length} empleado(s) fueron omitidos.` : ""}`,
  };
}

/**
 * Generates June/December periods: past records + 2-3 semesters ahead
 * Shows only periods that are relevant for the current year and forward planning
 */
export function generateAguinaldoPeriods(): Array<{ value: string; label: string }> {
  const periods: Array<{ value: string; label: string }> = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  // Determine the next aguinaldo period
  let nextAguinaldoYear = currentYear;
  let nextAguinaldoMonth = currentMonth <= 6 ? 6 : 12;

  if (currentMonth > 6 && nextAguinaldoMonth === 12) {
    // Next aguinaldo is in December of current year
    nextAguinaldoMonth = 12;
  } else if (currentMonth === 6 || currentMonth < 6) {
    // Next aguinaldo is in June of current year
    nextAguinaldoMonth = 6;
  } else {
    // We're past June and not at December, so next is December of current year
    nextAguinaldoMonth = 12;
  }

  // Add past records: 2 years back
  for (let year = currentYear - 2; year < currentYear; year++) {
    periods.push({ value: `${year}-06`, label: `Junio ${year}` });
    periods.push({ value: `${year}-12`, label: `Diciembre ${year}` });
  }

  // Add current year periods (if not passed)
  if (currentMonth <= 6) {
    periods.push({ value: `${currentYear}-06`, label: `Junio ${currentYear}` });
  }
  periods.push({ value: `${currentYear}-12`, label: `Diciembre ${currentYear}` });

  // Add next year: June and December (2 periods ahead)
  periods.push({ value: `${currentYear + 1}-06`, label: `Junio ${currentYear + 1}` });
  periods.push({ value: `${currentYear + 1}-12`, label: `Diciembre ${currentYear + 1}` });

  // Sort by year and month descending (newest first)
  return periods.sort((a, b) => {
    const [aYear, aMonth] = a.value.split("-").map(Number);
    const [bYear, bMonth] = b.value.split("-").map(Number);
    const aDate = new Date(aYear, aMonth - 1);
    const bDate = new Date(bYear, bMonth - 1);
    return bDate.getTime() - aDate.getTime();
  });
}

/**
 * Checks if a period has existing payroll records
 */
export function isPeriodPaid(period: string, payrollRecords: PayrollRecord[]): boolean {
  return payrollRecords.some((record) => record.period === period);
}

/**
 * Gets the number of paid records for a given period
 */
export function getPaidCountForPeriod(
  period: string,
  payrollRecords: PayrollRecord[],
): number {
  return payrollRecords.filter((record) => record.period === period).length;
}
