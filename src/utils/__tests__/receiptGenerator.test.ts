import { describe, expect, it } from "vitest";
import { buildPayrollReceiptCsv } from "@/utils/receiptGenerator";

const sampleData = {
  employee: {
    name: "Porras Daiana",
    dni: "44586777",
    position: "Moza",
    startDate: "2023-03-01",
  },
  payroll: {
    baseDays: 30,
    holidayDays: 2,
    holidayBonus: 15000,
    overtimeHours: 4,
    overtimeAmount: 22000,
    presentismoAmount: 12000,
    bonusAmount: 8000,
    advances: 0,
    discounts: 0,
    aguinaldo: 0,
    whiteAmount: 280000,
    informalAmount: 95000,
    netTotal: 415000,
  },
  period: "2025-04",
  company: {
    name: "Cádiz Bar de Tapas",
    address: "Av. Siempreviva 742",
    phone: "+54 9 11 5555-1234",
  },
};

describe("buildPayrollReceiptCsv", () => {
  it("uses Depósito/Efectivo terminology and omits legacy wording", () => {
    const csv = buildPayrollReceiptCsv(sampleData);

    expect(csv).toContain("Sueldo Depósito");
    expect(csv).toContain("Sueldo Efectivo");
    expect(csv).not.toMatch(/Blanco/i);
    expect(csv).toMatch(/TOTAL NETO A COBRAR/);
  });
});
