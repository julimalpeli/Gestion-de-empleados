import { supabase } from "@/lib/supabase";
import type { PayrollRecord, Employee } from "@/services/interfaces";
import { calculateAguinaldo } from "./aguinaldo";

export interface RecalculationResult {
  success: boolean;
  recordsUpdated: number;
  details: Array<{
    employeeId: string;
    employeeName: string;
    period: string;
    oldAguinaldo: number;
    newAguinaldo: number;
    difference: number;
  }>;
  errors: Array<{
    recordId: string;
    error: string;
  }>;
}

export const recalculateAguinaldosForPeriod = async (
  period: string,
): Promise<RecalculationResult> => {
  console.log(`🔄 Recalculating aguinaldos for period: ${period}`);

  const [year, month] = period.split("-");
  if (month !== "06" && month !== "12") {
    return {
      success: false,
      recordsUpdated: 0,
      details: [],
      errors: [
        {
          recordId: "",
          error: "El período debe ser junio (06) o diciembre (12)",
        },
      ],
    };
  }

  const result: RecalculationResult = {
    success: true,
    recordsUpdated: 0,
    details: [],
    errors: [],
  };

  try {
    // Fetch all employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("*");

    if (employeesError || !employees) {
      throw new Error(`Failed to fetch employees: ${employeesError?.message}`);
    }

    // Fetch all payroll records for the period
    const { data: payrollRecords, error: payrollError } = await supabase
      .from("payroll_records")
      .select("*")
      .eq("period", period);

    if (payrollError || !payrollRecords) {
      throw new Error(
        `Failed to fetch payroll records: ${payrollError?.message}`,
      );
    }

    console.log(
      `📊 Found ${payrollRecords.length} payroll records for period ${period}`,
    );

    // Process each payroll record
    for (const record of payrollRecords) {
      try {
        const employee = employees.find((e) => e.id === record.employee_id);
        if (!employee) {
          result.errors.push({
            recordId: record.id,
            error: `Employee not found: ${record.employee_id}`,
          });
          continue;
        }

        // Map database employee to expected format
        const employeeForCalc: any = {
          id: employee.id,
          name: employee.name,
          startDate: employee.start_date,
          sueldoBase: employee.sueldo_base,
        };

        // Map database payroll records to expected format
        const payrollRecordsForCalc: PayrollRecord[] = payrollRecords.map(
          (p) => ({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: p.employee_name,
            period: p.period,
            baseDays: p.base_days,
            holidayDays: p.holiday_days,
            baseAmount: p.base_amount,
            holidayBonus: p.holiday_bonus,
            aguinaldo: p.aguinaldo,
            discounts: p.discounts,
            advances: p.advances,
            whiteAmount: p.white_amount,
            informalAmount: p.informal_amount,
            presentismoAmount: p.presentismo_amount,
            overtimeHours: p.overtime_hours,
            overtimeAmount: p.overtime_amount,
            bonusAmount: p.bonus_amount,
            netTotal: p.net_total,
            status: p.status,
            processedDate: p.processed_date,
            processedBy: p.processed_by,
            notes: p.notes,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }),
        );

        // Calculate correct aguinaldo
        const calculation = calculateAguinaldo(
          employeeForCalc,
          period,
          payrollRecordsForCalc,
        );

        const newAguinaldo = calculation.amount;
        const oldAguinaldo = record.aguinaldo || 0;
        const difference = newAguinaldo - oldAguinaldo;

        // Only update if there's a difference
        if (difference !== 0) {
          const { error: updateError } = await supabase
            .from("payroll_records")
            .update({ aguinaldo: newAguinaldo })
            .eq("id", record.id);

          if (updateError) {
            result.errors.push({
              recordId: record.id,
              error: `Update failed: ${updateError.message}`,
            });
            result.success = false;
          } else {
            result.recordsUpdated++;
            result.details.push({
              employeeId: record.employee_id,
              employeeName: employee.name,
              period: record.period,
              oldAguinaldo,
              newAguinaldo,
              difference,
            });

            console.log(
              `✅ Updated ${employee.name}: ${oldAguinaldo} → ${newAguinaldo} (${difference > 0 ? "+" : ""}${difference})`,
            );
          }
        } else {
          console.log(`⚪ No change needed for ${employee.name}`);
        }
      } catch (error) {
        result.errors.push({
          recordId: record.id,
          error: error instanceof Error ? error.message : String(error),
        });
        result.success = false;
      }
    }

    console.log(
      `📋 Recalculation complete: ${result.recordsUpdated} records updated, ${result.errors.length} errors`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Recalculation failed: ${errorMessage}`);
    result.success = false;
    result.errors.push({
      recordId: "",
      error: errorMessage,
    });
  }

  return result;
};

// Make available globally for debugging
if (typeof window !== "undefined") {
  (window as any).recalculateAguinaldosForPeriod =
    recalculateAguinaldosForPeriod;
  console.log("🔧 Aguinaldo recalculation function available:");
  console.log("   - recalculateAguinaldosForPeriod('2025-12')");
}
