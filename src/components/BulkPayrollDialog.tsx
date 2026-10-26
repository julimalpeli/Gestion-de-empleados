import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  salaryHistoryService,
  type SalaryForPeriod,
} from "@/services/salaryHistoryService";
import type {
  CreatePayrollRequest,
  Employee,
  PayrollRecord,
} from "@/services/interfaces";
import { calculatePayrollAmounts } from "@/utils/payrollCalculation";

interface BulkPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  createPayrollRecordsBulk: (
    payrolls: (CreatePayrollRequest & { employeeName: string })[],
  ) => Promise<unknown>;
  onCreated: (count: number) => void;
}

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));

const BulkPayrollDialog = ({
  open,
  onOpenChange,
  employees,
  payrollRecords,
  createPayrollRecordsBulk,
  onCreated,
}: BulkPayrollDialogProps) => {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [workDays, setWorkDays] = useState("30");
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibleEmployees = useMemo(() => {
    const withRecord = new Set(
      payrollRecords
        .filter((record) => record.period === period)
        .map((record) => String(record.employeeId)),
    );
    return employees
      .filter((e) => e.status === "active" && !withRecord.has(String(e.id)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, payrollRecords, period]);

  const selectedEmployees = eligibleEmployees.filter(
    (e) => !excludedIds.includes(String(e.id)),
  );

  const allSelected =
    eligibleEmployees.length > 0 &&
    selectedEmployees.length === eligibleEmployees.length;

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setExcludedIds([]);
    setError(null);
  };

  const handleToggleAll = (checked: boolean) => {
    setExcludedIds(
      checked ? [] : eligibleEmployees.map((e) => String(e.id)),
    );
  };

  const handleToggleEmployee = (id: string, checked: boolean) => {
    setExcludedIds((prev) =>
      checked ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    const days = parseInt(workDays, 10);
    if (!/^\d{4}-\d{2}$/.test(period)) {
      setError("Selecciona un período válido");
      return;
    }
    if (!days || days < 1 || days > 31) {
      setError("Los días trabajados deben estar entre 1 y 31");
      return;
    }
    if (selectedEmployees.length === 0) {
      setError("Selecciona al menos un empleado");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payrolls: (CreatePayrollRequest & { employeeName: string })[] = [];

      for (const employee of selectedEmployees) {
        let historicalSalary: SalaryForPeriod | null = null;
        try {
          historicalSalary = await salaryHistoryService.getSalaryForPeriod(
            String(employee.id),
            period,
          );
        } catch {
          historicalSalary = null;
        }

        const calculation = calculatePayrollAmounts({
          employee,
          period,
          workDays: days,
          holidayDays: 0,
          overtimeHours: 0,
          bonusAmount: 0,
          advances: 0,
          discounts: 0,
          whiteWage: 0,
          presentismoMantiene: true,
          historicalSalary,
          payrollRecords,
        });

        payrolls.push({
          employeeId: String(employee.id),
          employeeName: employee.name,
          period,
          baseDays: days,
          holidayDays: 0,
          baseAmount: calculation.basePay,
          holidayBonus: calculation.holidayPay,
          aguinaldo: calculation.aguinaldo,
          discounts: 0,
          advances: 0,
          whiteAmount: calculation.whiteAmount,
          informalAmount: calculation.informalAmount,
          presentismoAmount: calculation.presentismoAmount,
          overtimeHours: 0,
          overtimeAmount: calculation.overtimeAmount,
          bonusAmount: 0,
          vacationBonusAmount: 0,
          netTotal: calculation.netTotal,
          status: "draft",
        });
      }

      await createPayrollRecordsBulk(payrolls);
      onCreated(payrolls.length);
      setExcludedIds([]);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error creando liquidaciones",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Liquidación masiva</DialogTitle>
          <DialogDescription>
            Crea borradores para los empleados activos que todavía no tienen
            liquidación en el período elegido.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-period">Período</Label>
            <Input
              id="bulk-period"
              type="month"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulk-work-days">Días trabajados</Label>
            <Input
              id="bulk-work-days"
              type="number"
              min={1}
              max={31}
              value={workDays}
              onChange={(e) => setWorkDays(e.target.value)}
            />
          </div>
        </div>

        {eligibleEmployees.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Todos los empleados activos ya tienen liquidación en este período.
          </p>
        ) : (
          <div className="rounded-md border">
            <div className="flex items-center justify-between border-b p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => handleToggleAll(checked === true)}
                />
                Seleccionar todos
              </label>
              <span className="text-xs text-muted-foreground">
                {selectedEmployees.length} de {eligibleEmployees.length}{" "}
                seleccionados
              </span>
            </div>
            <ul className="divide-y max-h-80 overflow-y-auto">
              {eligibleEmployees.map((employee) => {
                const id = String(employee.id);
                return (
                  <li key={id}>
                    <label className="flex items-center justify-between gap-3 p-3 cursor-pointer">
                      <span className="flex items-center gap-3">
                        <Checkbox
                          checked={!excludedIds.includes(id)}
                          onCheckedChange={(checked) =>
                            handleToggleEmployee(id, checked === true)
                          }
                        />
                        <span>
                          <span className="block text-sm font-medium">
                            {employee.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {employee.position || "Sin posición"}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Sueldo base: {formatCurrency(employee.sueldoBase)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedEmployees.length === 0}
          >
            {isSubmitting
              ? "Creando..."
              : `Crear ${selectedEmployees.length} liquidaciones`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPayrollDialog;
