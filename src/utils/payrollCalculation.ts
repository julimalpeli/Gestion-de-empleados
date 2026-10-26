import { calculateAguinaldo } from "@/utils/aguinaldo";
import type { Employee, PayrollRecord } from "@/services/interfaces";

export type PayrollStatus = PayrollRecord["status"];

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  approved: "Aprobada",
  processed: "Procesada",
  paid: "Pagada",
};

const NEXT_PAYROLL_STATUS: Partial<Record<PayrollStatus, PayrollStatus>> = {
  draft: "pending",
  pending: "approved",
  approved: "processed",
  processed: "paid",
};

export const getNextPayrollStatus = (
  status: PayrollStatus,
): PayrollStatus | null => NEXT_PAYROLL_STATUS[status] ?? null;

export const isAguinaldoPeriod = (period: string) => {
  const [, month] = period.split("-");
  const monthNum = parseInt(month, 10);
  return monthNum === 6 || monthNum === 12;
};

export const toSemesterPeriod = (monthPeriod: string): string => {
  const [year, month] = monthPeriod.split("-");
  const monthNum = parseInt(month, 10);
  const semester = monthNum <= 6 ? "1" : "2";
  return `${year}-${semester}`;
};

export interface HistoricalSalary {
  white_wage?: number;
  informal_wage?: number;
  presentismo?: number;
}

export interface PayrollCalculationInput {
  employee: Employee;
  period: string;
  workDays: number;
  holidayDays: number;
  overtimeHours: number;
  bonusAmount: number;
  vacationBonusAmount?: number;
  advances: number;
  discounts: number;
  whiteWage: number;
  presentismoMantiene: boolean;
  historicalSalary: HistoricalSalary | null;
  payrollRecords: PayrollRecord[];
}

export const calculatePayrollAmounts = ({
  employee,
  period,
  workDays,
  holidayDays,
  overtimeHours,
  bonusAmount,
  vacationBonusAmount = 0,
  advances,
  discounts,
  whiteWage,
  presentismoMantiene,
  historicalSalary,
  payrollRecords,
}: PayrollCalculationInput) => {
  // Sueldo base - calcular dailyWage con decimales para evitar errores de redondeo
  // Usar sueldoBase / 30 con decimales en vez del dailyWage redondeado de la DB
  let dailyWageToUse = (employee.sueldoBase || 0) / 30;

  if (
    historicalSalary &&
    historicalSalary.white_wage !== undefined &&
    historicalSalary.informal_wage !== undefined
  ) {
    dailyWageToUse =
      (historicalSalary.white_wage + historicalSalary.informal_wage) / 30;
  }

  const basePay = Math.round(dailyWageToUse * workDays);
  const holidayPay = Math.round(dailyWageToUse * holidayDays);

  // Horas extra (50% adicional sobre la hora normal)
  const hourlyRate = dailyWageToUse / 8;
  const overtimePay = Math.round(hourlyRate * 1.5 * overtimeHours);

  let presentismoAmount = 0;
  const employeeReceivesPresentismo = employee.receives_presentismo !== false;

  if (employeeReceivesPresentismo) {
    let presentismoToUse = employee.presentismo || 0;
    if (historicalSalary && historicalSalary.presentismo !== undefined) {
      presentismoToUse = historicalSalary.presentismo;
    }
    presentismoAmount = presentismoMantiene ? presentismoToUse : 0;
  }

  const bonusPay = bonusAmount;
  const vacationBonusPay = vacationBonusAmount;
  const grossTotal =
    basePay +
    holidayPay +
    overtimePay +
    presentismoAmount +
    bonusPay +
    vacationBonusPay;
  const totalAfterDeductions = grossTotal - advances - discounts;

  let realWhiteAmount = 0;
  let realInformalAmount = 0;

  if (historicalSalary && historicalSalary.white_wage !== undefined) {
    realWhiteAmount = historicalSalary.white_wage;
    realInformalAmount = historicalSalary.informal_wage ?? 0;
  } else {
    realWhiteAmount = employee.sueldoBase || 0;
    realInformalAmount = 0;
  }

  let aguinaldoAmount = 0;
  if (isAguinaldoPeriod(period)) {
    const aguinaldoResult = calculateAguinaldo(
      employee,
      toSemesterPeriod(period),
      payrollRecords,
    );
    aguinaldoAmount = aguinaldoResult.amount || 0;
  }

  const netTotal =
    basePay +
    presentismoAmount +
    overtimePay +
    bonusPay +
    vacationBonusPay +
    holidayPay +
    aguinaldoAmount -
    advances -
    discounts;

  return {
    basePay,
    holidayPay,
    overtimePay,
    hourlyRate,
    presentismoAmount,
    bonusPay,
    vacationBonusPay,
    grossTotal,
    totalAdvances: advances,
    totalDiscounts: discounts,
    totalAfterDeductions,
    whiteAmount: whiteWage,
    informalAmount: netTotal - whiteWage,
    realWhiteAmount,
    realInformalAmount,
    netTotal,
    holidayBonus: holidayPay,
    aguinaldo: aguinaldoAmount,
    overtimeAmount: overtimePay,
  };
};
