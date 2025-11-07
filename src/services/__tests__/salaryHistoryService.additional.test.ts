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

describe("salaryHistoryService.getSalaryForPeriod - additional cases", () => {
  beforeEach(() => {
    tableResponses.clear();
    tableCallCount.clear();
    vi.mocked(supabase.rpc).mockReset();
  });

  it("uses RPC when available and returns current source", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          white_wage: 300000,
          informal_wage: 120000,
          base_wage: 420000,
          presentismo: 25000,
        },
      ],
      error: null,
    });

    const salary = await salaryHistoryService.getSalaryForPeriod(
      "emp-1",
      "2025-06",
    );

    expect(salary.source).toBe("current");
    expect(salary.white_wage).toBe(300000);
    expect(salary.base_wage).toBe(420000);
  });

  it("uses previous values from a future change when no history exists", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: "rpc disabled" } });

    // salary_history: impact_period none, history empty -> futureChanges returns a record with previous_*
    tableResponses.set("salary_history", [
      { data: [], error: null }, // impact_period query
      { data: [], error: null }, // historyData (lte)
      { data: [
        {
          effective_date: "2025-10-01",
          previous_white_wage: 200000,
          previous_informal_wage: 80000,
          previous_base_wage: 280000,
          previous_presentismo: 12000,
        },
      ], error: null }, // futureChanges
    ]);

    const salary = await salaryHistoryService.getSalaryForPeriod(
      "emp-2",
      "2025-04",
    );

    expect(salary.source).toBe("history_previous");
    expect(salary.white_wage).toBe(200000);
    expect(salary.informal_wage).toBe(80000);
    expect(salary.presentismo).toBe(12000);
  });

  it("falls back to the latest change when nothing else found", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: "rpc disabled" } });

    tableResponses.set("salary_history", [
      { data: [], error: null }, // impact_period
      { data: [], error: null }, // historyData
      { data: [], error: null }, // futureChanges
      { data: [
        {
          effective_date: "2025-08-01",
          white_wage: 350000,
          informal_wage: 150000,
          base_wage: 500000,
          presentismo: 30000,
        },
      ], error: null }, // latestChange
    ]);

    const salary = await salaryHistoryService.getSalaryForPeriod(
      "emp-3",
      "2025-04",
    );

    expect(salary.source).toBe("history_latest");
    expect(salary.white_wage).toBe(350000);
    expect(salary.informal_wage).toBe(150000);
  });
});
