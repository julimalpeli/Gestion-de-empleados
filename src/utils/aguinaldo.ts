import type { PayrollRecord } from "@/services/interfaces";

export interface AguinaldoCalculationResult {
  corresponds: boolean;
  amount: number;
  daysWorked: number;
  totalDays: number;
  proportional: boolean;
  bestSalary: number;
  bestSalaryPeriod: string;
  fullAguinaldo: number;
  reason: string;
}

type AguinaldoEmployee = {
  id: string;
  name?: string;
  startDate: string;
  sueldoBase?: number;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export const calculateAguinaldo = (
  employee: AguinaldoEmployee,
  period: string,
  payrollRecords: PayrollRecord[],
): AguinaldoCalculationResult => {
  const [year, semester] = period.split("-");
  const currentYear = Number(year);
  const currentSemester = Number(semester);

  if (!Number.isFinite(currentYear) || !Number.isFinite(currentSemester)) {
    return {
      corresponds: false,
      amount: 0,
      daysWorked: 0,
      totalDays: 0,
      proportional: false,
      bestSalary: employee.sueldoBase || 0,
      bestSalaryPeriod: "Sueldo base",
      fullAguinaldo: 0,
      reason: "Período inválido",
    };
  }

  // Usar hora del mediodía (12:00) para evitar problemas de DST/timezone en cálculo de días
  const semesterStart =
    currentSemester === 1
      ? new Date(currentYear, 0, 1, 12, 0, 0)
      : new Date(currentYear, 6, 1, 12, 0, 0);

  const semesterEnd =
    currentSemester === 1
      ? new Date(currentYear, 5, 30, 12, 0, 0)
      : new Date(currentYear, 11, 31, 12, 0, 0);

  const startDate = new Date(employee.startDate + "T12:00:00");

  if (Number.isNaN(startDate.getTime())) {
    return {
      corresponds: false,
      amount: 0,
      daysWorked: 0,
      totalDays: 0,
      proportional: false,
      bestSalary: employee.sueldoBase || 0,
      bestSalaryPeriod: "Sueldo base",
      fullAguinaldo: 0,
      reason: "Fecha de inicio inválida",
    };
  }

  if (startDate > semesterEnd) {
    return {
      corresponds: false,
      amount: 0,
      daysWorked: 0,
      totalDays:
        Math.floor((semesterEnd.getTime() - semesterStart.getTime()) / DAY_MS) +
        1,
      proportional: false,
      bestSalary: employee.sueldoBase || 0,
      bestSalaryPeriod: "Sueldo base",
      fullAguinaldo: 0,
      reason: "No trabajó en este período",
    };
  }

  // Importante: se cuenta desde el día POSTERIOR a la fecha de ingreso
  const effectiveStartDate = new Date(startDate);
  effectiveStartDate.setDate(effectiveStartDate.getDate() + 1);

  const effectiveStart =
    effectiveStartDate > semesterStart ? effectiveStartDate : semesterStart;

  const totalSemesterDays =
    Math.round(
      (semesterEnd.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  let daysWorked =
    Math.round(
      (semesterEnd.getTime() - effectiveStart.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

  if (daysWorked < 0) {
    daysWorked = 0;
  }

  if (daysWorked > totalSemesterDays) {
    daysWorked = totalSemesterDays;
  }

  const employeePayrolls = payrollRecords.filter(
    (p) => p.employeeId === employee.id,
  );

  let bestSalary = employee.sueldoBase || 0;
  let bestSalaryPeriod = "Sueldo base";

  if (employeePayrolls.length > 0) {
    const payrollsInSemester = employeePayrolls.filter((payroll) => {
      if (!payroll.period) {
        return false;
      }
      const [recordYearStr, recordMonthStr] = payroll.period.split("-");
      const recordYear = Number(recordYearStr);
      const recordMonth = Number(recordMonthStr);
      if (
        !Number.isFinite(recordYear) ||
        !Number.isFinite(recordMonth) ||
        recordMonth < 1 ||
        recordMonth > 12
      ) {
        return false;
      }
      const recordDate = new Date(recordYear, recordMonth - 1, 1);
      return (
        recordDate.getTime() >= semesterStart.getTime() &&
        recordDate.getTime() <= semesterEnd.getTime()
      );
    });

    // ⚠️ CRITICAL: Only use payrolls from CURRENT semester
    // Do NOT fall back to older periods - that would violate SAC calculation rules
    const relevantPayrolls = payrollsInSemester;

    // If there are payrolls in the semester, find the best one
    if (relevantPayrolls.length > 0) {
      const salaryCalculations = relevantPayrolls.map((payroll) => {
        const depositoAmount = payroll.whiteAmount || 0;
        const efectivoAmount = payroll.informalAmount || 0;
        const presentismoAmount = payroll.presentismoAmount || 0;
        const aguinaldoAmount = payroll.aguinaldo || 0;

        const totalPaid = depositoAmount + efectivoAmount;
        const excludedConcepts = presentismoAmount + aguinaldoAmount;
        const adjustedSalary = Math.max(totalPaid - excludedConcepts, 0);

        if (
          employee.name?.includes("Daiana") ||
          employee.name?.includes("Porras") ||
          employee.name?.includes("Carlos") ||
          employee.name?.includes("Bustamante")
        ) {
          console.log(`🔍 Aguinaldo debug para ${employee.name}:`, {
            period: payroll.period,
            depositoAmount,
            efectivoAmount,
            presentismoAmount,
            aguinaldoAmount,
            totalPaid,
            excludedConcepts,
            bestSalaryForAguinaldo: adjustedSalary,
            formula: "(depósito + efectivo) - (presentismo + aguinaldo)",
          });
        }

        return adjustedSalary;
      });

      const maxHistoricalSalary =
        salaryCalculations.length > 0 ? Math.max(...salaryCalculations) : 0;
      const maxSalaryIndex =
        salaryCalculations.length > 0
          ? salaryCalculations.indexOf(maxHistoricalSalary)
          : -1;

      const baseSalary = employee.sueldoBase || 0;

      if (maxSalaryIndex >= 0 && maxHistoricalSalary > baseSalary) {
        bestSalary = maxHistoricalSalary;
        bestSalaryPeriod = relevantPayrolls[maxSalaryIndex].period;
      } else {
        bestSalary = baseSalary;
        bestSalaryPeriod = "Sueldo base";
      }

      console.log(
        `🎯 Mejor sueldo calculado para ${employee.name}: ${bestSalary}`,
        {
          baseSalary: employee.sueldoBase || 0,
          salaryTotalsInRange: salaryCalculations,
          maxHistoricalSalary,
          maxSalaryIndex,
          bestPeriod: bestSalaryPeriod,
          consideredPayrolls: relevantPayrolls.map((p) => ({
            period: p.period,
            amount: Math.max(
              (p.whiteAmount || 0) +
                (p.informalAmount || 0) -
                ((p.presentismoAmount || 0) + (p.aguinaldo || 0)),
              0,
            ),
          })),
        },
      );
    } else {
      // No payrolls in this semester - use base salary and flag it
      bestSalary = employee.sueldoBase || 0;
      bestSalaryPeriod = "Sueldo base (sin registros en semestre)";

      console.warn(
        `⚠️ No payroll records found for ${employee.name} in semester ${period}. Using base salary.`,
      );
    }
  }

  const fullAguinaldo = (bestSalary / 12) * 6;
  const proportionalAguinaldo = (bestSalary / 12) * (daysWorked / 30);

  const isProportional = daysWorked < totalSemesterDays;
  const finalAmount = isProportional ? proportionalAguinaldo : fullAguinaldo;

  // Generate descriptive reason
  let reason = "";
  if (isProportional) {
    reason = `Aguinaldo proporcional: ${daysWorked} días de ${totalSemesterDays} (fórmula: mejor sueldo/12 × días/30)`;
  } else {
    reason = `Aguinaldo completo: ${totalSemesterDays} días trabajados (fórmula: mejor sueldo/12 × 6)`;
  }

  return {
    corresponds: true,
    amount: Math.round(finalAmount),
    daysWorked,
    totalDays: totalSemesterDays,
    proportional: isProportional,
    bestSalary,
    bestSalaryPeriod,
    fullAguinaldo: Math.round(fullAguinaldo),
    reason,
  };
};
