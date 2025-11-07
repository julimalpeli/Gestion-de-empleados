import { describe, expect, it, beforeEach, vi } from "vitest";

const tableResponses = new Map<string, Array<{ data: any; error: any }>>();
const tableCallCount = new Map<string, number>();

vi.mock("@/lib/supabase", () => {
  class QueryBuilder {
    constructor(private readonly table: string) {}

    select() {
      return this;
    }

    eq() {
      return this;
    }

    lte() {
      return this;
    }

    gt() {
      return this;
    }

    order() {
      return this;
    }

    limit() {
      const currentIndex = tableCallCount.get(this.table) ?? 0;
      tableCallCount.set(this.table, currentIndex + 1);
      const queue = tableResponses.get(this.table) ?? [];
      const response = queue[currentIndex] ?? { data: [], error: null };
      return Promise.resolve(response);
    }
  }

  return {
    supabase: {
      rpc: vi.fn(),
      from(table: string) {
        return new QueryBuilder(table);
      },
    },
  };
});

const { supabase } = await import("@/lib/supabase");
const { salaryHistoryService } = await import("../salaryHistoryService");

describe("salaryHistoryService.getSalaryForPeriod", () => {
  beforeEach(() => {
    tableResponses.clear();
    tableCallCount.clear();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: "rpc disabled" },
    });
  });

  it("falls back to payroll records when history is missing", async () => {
    tableResponses.set("salary_history", [
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    tableResponses.set("payroll_records", [
      {
        data: [
          {
            white_amount: 250000,
            informal_amount: 120000,
            base_amount: 250000,
            base_days: 30,
            presentismo_amount: 15000,
          },
        ],
        error: null,
      },
    ]);

    const salary = await salaryHistoryService.getSalaryForPeriod(
      "employee-123",
      "2025-04",
    );

    expect(salary.source).toBe("payroll_record");
    expect(salary.white_wage).toBe(250000);
    expect(salary.informal_wage).toBe(120000);
    expect(salary.presentismo).toBe(15000);
  });
});
