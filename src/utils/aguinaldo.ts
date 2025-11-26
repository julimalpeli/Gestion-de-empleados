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

  const semesterStart =
    currentSemester === 1
      ? new Date(currentYear, 0, 1)
      : new Date(currentYear, 6, 1);

  const semesterEnd =
    currentSemester === 1
      ? new Date(currentYear, 5, 30)
      : new Date(currentYear, 11, 31);

  const startDate = new Date(employee.startDate);

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
      totalDays: Math.floor(
        (semesterEnd.getTime() - semesterStart.getTime()) / DAY_MS,
      ) + 1,
      proportional: false,
      bestSalary: employee.sueldoBase || 0,
      bestSalaryPeriod: "Sueldo base",
      fullAguinaldo: 0,
      reason: "No trabajó en este período",
    };
  }

  const effectiveStart =
    startDate > semesterStart ? startDate : semesterStart;

  const totalSemesterDays =
    Math.floor((semesterEnd.getTime() - semesterStart.getTime()) / DAY_MS) + 1;
  let daysWorked =
    Math.floor((semesterEnd.getTime() - effectiveStart.getTime()) / DAY_MS) + 1;

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

    const relevantPayrolls =
      payrollsInSemester.length > 0 ? payrollsInSemester : employeePayrolls;

    const salaryCalculations = relevantPayrolls.map((payroll) => {
      const depositoAmount = payroll.whiteAmount || 0;
      const efectivoAmount = payroll.informalAmount || 0;
      const overtimeAmount = payroll.overtimeAmount || 0;
      const holidayBonus = payroll.holidayBonus || 0;
      const presentismoAmount = payroll.presentismoAmount || 0;
      const aguinaldoAmount = payroll.aguinaldo || 0;

      const includedConcepts =
        depositoAmount + efectivoAmount + overtimeAmount + holidayBonus;
      const excludedConcepts = presentismoAmount + aguinaldoAmount;
      const adjustedSalary = Math.max(includedConcepts - excludedConcepts, 0);

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
          overtimeAmount,
          holidayBonus,
          presentismoAmount,
          aguinaldoAmount,
          includedConcepts,
          excludedConcepts,
          bestSalaryForAguinaldo: adjustedSalary,
          formula:
            "(depósito + efectivo + extras + feriados) - (presentismo + aguinaldo)",
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
              (p.informalAmount || 0) +
              (p.overtimeAmount || 0) +
              (p.holidayBonus || 0) -
              ((p.presentismoAmount || 0) + (p.aguinaldo || 0)),
            0,
          ),
        })),
      },
    );
  }

  const fullAguinaldo = (bestSalary / 12) * 6;
  const proportionalAguinaldo = (bestSalary / 12) * (daysWorked / 30);

  const isProportional = daysWorked < totalSemesterDays;
  const finalAmount = isProportional ? proportionalAguinaldo : fullAguinaldo;

  return {
    corresponds: true,
    amount: Math.round(finalAmount),
    daysWorked,
    totalDays: totalSemesterDays,
    proportional: isProportional,
    bestSalary,
    bestSalaryPeriod,
    fullAguinaldo: Math.round(fullAguinaldo),
    reason: isProportional
      ? "Aguinaldo proporcional por días trabajados"
      : "Aguinaldo completo",
  };
};
