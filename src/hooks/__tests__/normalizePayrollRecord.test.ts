import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

import { normalizePayrollRecord } from "../normalizers/normalizePayrollRecord";

describe("normalizePayrollRecord", () => {
  const fixedNow = new Date("2024-01-15T10:00:00.000Z");

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("normalizes snake_case and camelCase fields while preserving provided totals", () => {
    const record = {
      id: "rec-1",
      employee_id: "emp-1",
      employee: {
        name: "John Doe",
        sueldo_base: "50000",
      },
      period: "2024-06",
      base_days: "30",
      holiday_days: 2,
      base_amount: "60000",
      holiday_bonus: "5000",
      aguinaldo: "10000",
      discounts: "2000",
      advances: "1500",
      white_amount: "40000",
      informal_amount: "5000",
      presentismo_amount: "3000",
      overtime_hours: "10",
      overtime_amount: "4000",
      bonus_amount: "2500",
      net_total: "60000",
      status: "processed",
      processed_date: "2024-06-30",
      processed_by: "admin",
      notes: "Generado en junio",
      created_at: "2024-06-01",
      updated_at: "2024-06-15",
    };

    const result = normalizePayrollRecord(record);

    expect(result).toMatchObject({
      id: "rec-1",
      employeeId: "emp-1",
      employeeName: "John Doe",
      period: "2024-06",
      baseDays: 30,
      holidayDays: 2,
      baseAmount: 60000,
      holidayBonus: 5000,
      aguinaldo: 10000,
      discounts: 2000,
      advances: 1500,
      whiteAmount: 40000,
      informalAmount: 5000,
      presentismoAmount: 3000,
      overtimeHours: 10,
      overtimeAmount: 4000,
      bonusAmount: 2500,
      netTotal: 60000,
      status: "processed",
      processedDate: "2024-06-30",
      processedBy: "admin",
      notes: "Generado en junio",
      createdAt: "2024-06-01",
      updatedAt: "2024-06-15",
    });
  });

  it("derives fallback values when numeric fields or identifiers are missing", () => {
    const record = {
      employee_id: "emp-2",
      employee: {},
      employeeName: "Fallback Name",
      period: "2024-12",
      whiteAmount: 10000,
      informal_amount: "2000",
      presentismoAmount: 500,
      holiday_bonus: 300,
      overtime_amount: 150,
      bonusAmount: 250,
      discounts: "100",
      advances: "50",
    };

    const result = normalizePayrollRecord(record);

    expect(result.id).toBe("");
    expect(result.employeeId).toBe("emp-2");
    expect(result.employeeName).toBe("Fallback Name");
    expect(result.period).toBe("2024-12");
    expect(result.baseAmount).toBe(12000);
    expect(result.whiteAmount).toBe(10000);
    expect(result.informalAmount).toBe(2000);
    expect(result.baseDays).toBe(0);
    expect(result.holidayDays).toBe(0);
    expect(result.presentismoAmount).toBe(500);
    expect(result.holidayBonus).toBe(300);
    expect(result.overtimeHours).toBe(0);
    expect(result.overtimeAmount).toBe(150);
    expect(result.bonusAmount).toBe(250);
    expect(result.advances).toBe(50);
    expect(result.discounts).toBe(100);
    expect(result.netTotal).toBe(13050);
    expect(result.status).toBe("draft");
    expect(result.createdAt).toBe(fixedNow.toISOString());
    expect(result.updatedAt).toBe(fixedNow.toISOString());
  });
});
