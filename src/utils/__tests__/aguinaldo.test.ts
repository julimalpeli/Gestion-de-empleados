import { describe, it, expect } from "vitest";

import { calculateAguinaldo } from "../aguinaldo";
import type { PayrollRecord } from "@/services/interfaces";

describe("calculateAguinaldo", () => {
  const baseRecord = (
    overrides: Partial<PayrollRecord>,
  ): PayrollRecord => ({
    id: "base",
    employeeId: "emp-0",
    employeeName: "Empleado",
    period: "2024-01",
    baseDays: 30,
    holidayDays: 0,
    baseAmount: 0,
    holidayBonus: 0,
    aguinaldo: 0,
    discounts: 0,
    advances: 0,
    whiteAmount: 0,
    informalAmount: 0,
    presentismoAmount: 0,
    overtimeHours: 0,
    overtimeAmount: 0,
    bonusAmount: 0,
    netTotal: 0,
    status: "processed",
    processedDate: undefined,
    processedBy: undefined,
    notes: undefined,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...overrides,
  });

  it("returns full aguinaldo using the best historical salary within the semester", () => {
    const employee = {
      id: "emp-1",
      name: "Alice",
      startDate: "2020-05-10",
      sueldoBase: 100000,
    };

    const payrollRecords: PayrollRecord[] = [
      baseRecord({
        id: "p-semestral",
        employeeId: "emp-1",
        employeeName: "Alice",
        period: "2024-03",
        whiteAmount: 80000,
        informalAmount: 30000,
        overtimeAmount: 5000,
        holidayBonus: 7000,
        createdAt: "2024-03-31",
        updatedAt: "2024-03-31",
      }),
      baseRecord({
        id: "p-anterior",
        employeeId: "emp-1",
        employeeName: "Alice",
        period: "2023-11",
        whiteAmount: 60000,
        informalAmount: 20000,
        overtimeAmount: 2000,
        holidayBonus: 1000,
        createdAt: "2023-11-30",
        updatedAt: "2023-11-30",
      }),
      baseRecord({
        id: "p-otro",
        employeeId: "emp-2",
        employeeName: "Bob",
        period: "2024-02",
        whiteAmount: 50000,
        informalAmount: 10000,
        overtimeAmount: 1000,
        holidayBonus: 2000,
      }),
    ];

    const result = calculateAguinaldo(employee, "2024-1", payrollRecords);

    expect(result.corresponds).toBe(true);
    expect(result.proportional).toBe(false);
    expect(result.daysWorked).toBe(182);
    expect(result.totalDays).toBe(182);
    expect(result.bestSalary).toBe(122000);
    expect(result.bestSalaryPeriod).toBe("2024-03");
    expect(result.amount).toBe(61000);
    expect(result.fullAguinaldo).toBe(61000);
    expect(result.reason).toBe("Aguinaldo completo");
  });

  it("computes proportional aguinaldo when the employee started mid-semester", () => {
    const employee = {
      id: "emp-2",
      name: "Bob",
      startDate: "2024-04-15",
      sueldoBase: 90000,
    };

    const payrollRecords: PayrollRecord[] = [
      baseRecord({
        id: "p-semestral",
        employeeId: "emp-2",
        employeeName: "Bob",
        period: "2024-05",
        whiteAmount: 60000,
        informalAmount: 10000,
        overtimeAmount: 0,
        holidayBonus: 0,
      }),
    ];

    const result = calculateAguinaldo(employee, "2024-1", payrollRecords);

    expect(result.corresponds).toBe(true);
    expect(result.proportional).toBe(true);
    expect(result.daysWorked).toBe(77);
    expect(result.totalDays).toBe(182);
    expect(result.bestSalary).toBe(90000);
    expect(result.bestSalaryPeriod).toBe("Sueldo base");
    expect(result.amount).toBe(19250);
    expect(result.fullAguinaldo).toBe(45000);
    expect(result.reason).toBe("Aguinaldo proporcional por días trabajados");
  });

  it("returns zero when the employee started after the semester ended", () => {
    const employee = {
      id: "emp-3",
      name: "Charlie",
      startDate: "2025-01-05",
      sueldoBase: 85000,
    };

    const result = calculateAguinaldo(employee, "2024-2", []);

    expect(result.corresponds).toBe(false);
    expect(result.amount).toBe(0);
    expect(result.daysWorked).toBe(0);
    expect(result.totalDays).toBe(184);
    expect(result.bestSalary).toBe(85000);
    expect(result.bestSalaryPeriod).toBe("Sueldo base");
    expect(result.reason).toBe("No trabajó en este período");
  });
});
