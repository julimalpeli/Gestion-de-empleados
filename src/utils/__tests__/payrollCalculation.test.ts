import { describe, it, expect } from "vitest";
import {
  calculatePayrollAmounts,
  getNextPayrollStatus,
} from "@/utils/payrollCalculation";
import type { Employee } from "@/services/interfaces";

const employee = {
  id: "1",
  name: "Ana Pérez",
  sueldoBase: 300000,
  presentismo: 30000,
  receives_presentismo: true,
} as Employee;

const baseInput = {
  employee,
  period: "2026-03",
  workDays: 30,
  holidayDays: 0,
  overtimeHours: 0,
  bonusAmount: 0,
  advances: 0,
  discounts: 0,
  whiteWage: 0,
  presentismoMantiene: true,
  historicalSalary: null,
  payrollRecords: [],
};

describe("getNextPayrollStatus", () => {
  it("avanza draft -> pending -> approved -> processed -> paid", () => {
    expect(getNextPayrollStatus("draft")).toBe("pending");
    expect(getNextPayrollStatus("pending")).toBe("approved");
    expect(getNextPayrollStatus("approved")).toBe("processed");
    expect(getNextPayrollStatus("processed")).toBe("paid");
  });

  it("no tiene siguiente estado para pagada", () => {
    expect(getNextPayrollStatus("paid")).toBeNull();
  });
});

describe("calculatePayrollAmounts", () => {
  it("calcula sueldo base proporcional y presentismo para un mes completo", () => {
    const result = calculatePayrollAmounts(baseInput);

    expect(result.basePay).toBe(300000);
    expect(result.presentismoAmount).toBe(30000);
    expect(result.netTotal).toBe(330000);
  });

  it("no suma presentismo cuando el empleado lo pierde", () => {
    const result = calculatePayrollAmounts({
      ...baseInput,
      presentismoMantiene: false,
    });

    expect(result.presentismoAmount).toBe(0);
    expect(result.netTotal).toBe(300000);
  });

  it("no suma presentismo si el empleado no lo recibe", () => {
    const result = calculatePayrollAmounts({
      ...baseInput,
      employee: { ...employee, receives_presentismo: false },
    });

    expect(result.presentismoAmount).toBe(0);
  });

  it("descuenta adelantos y descuentos del neto", () => {
    const result = calculatePayrollAmounts({
      ...baseInput,
      advances: 50000,
      discounts: 10000,
    });

    expect(result.netTotal).toBe(270000);
  });

  it("calcula el efectivo como neto menos depósito", () => {
    const result = calculatePayrollAmounts({
      ...baseInput,
      whiteWage: 200000,
    });

    expect(result.whiteAmount).toBe(200000);
    expect(result.informalAmount).toBe(130000);
  });

  it("usa el salario histórico cuando existe para el período", () => {
    const result = calculatePayrollAmounts({
      ...baseInput,
      historicalSalary: { white_wage: 150000, informal_wage: 150000, presentismo: 0 },
    });

    expect(result.basePay).toBe(300000);
    expect(result.presentismoAmount).toBe(0);
    expect(result.realWhiteAmount).toBe(150000);
    expect(result.realInformalAmount).toBe(150000);
  });
});
