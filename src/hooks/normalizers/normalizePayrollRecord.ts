import type { PayrollRecord } from "@/services/interfaces";

const hasOwn = Object.prototype.hasOwnProperty;

const readField = (source: any, snake: string, camel: string) => {
  if (!source) {
    return undefined;
  }
  if (hasOwn.call(source, snake)) {
    const value = source[snake];
    return value ?? undefined;
  }
  if (hasOwn.call(source, camel)) {
    const value = source[camel];
    return value ?? undefined;
  }
  return undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const toNumber = (value: unknown): number => {
  const parsed = toOptionalNumber(value);
  return parsed ?? 0;
};

export const normalizePayrollRecord = (record: any): PayrollRecord => {
  const employeeData = readField(record, "employee", "employee") as any;

  const whiteAmountSource = toOptionalNumber(
    readField(record, "white_amount", "whiteAmount"),
  );

  const informalAmountSource = toOptionalNumber(
    readField(record, "informal_amount", "informalAmount"),
  );

  const resolvedWhiteAmount = whiteAmountSource ?? 0;
  const resolvedInformalAmount = informalAmountSource ?? 0;

  const employeeBaseSource = toOptionalNumber(
    readField(employeeData, "sueldo_base", "sueldoBase"),
  );
  const resolvedEmployeeBase =
    employeeBaseSource !== undefined
      ? employeeBaseSource
      : whiteAmountSource !== undefined || informalAmountSource !== undefined
        ? (whiteAmountSource ?? 0) + (informalAmountSource ?? 0)
        : undefined;

  const baseAmountSource =
    toOptionalNumber(readField(record, "base_amount", "baseAmount")) ??
    resolvedEmployeeBase;

  const resolvedBaseAmount =
    baseAmountSource !== undefined
      ? baseAmountSource
      : (whiteAmountSource ?? 0) + (informalAmountSource ?? 0);

  const baseDays = toNumber(readField(record, "base_days", "baseDays"));
  const holidayDays = toNumber(
    readField(record, "holiday_days", "holidayDays"),
  );
  const holidayBonus = toNumber(
    readField(record, "holiday_bonus", "holidayBonus"),
  );
  const aguinaldo = toNumber(readField(record, "aguinaldo", "aguinaldo"));
  const aguinaldoPagoEfectivo = toNumber(
    readField(record, "aguinaldo_pago_efectivo", "aguinaldoPagoEfectivo"),
  );
  const aguinaldoPagoDeposito = toNumber(
    readField(record, "aguinaldo_pago_deposito", "aguinaldoPagoDeposito"),
  );

  // Debug log for aguinaldo split if values are present
  if ((aguinaldoPagoEfectivo > 0 || aguinaldoPagoDeposito > 0) && console.log) {
    console.debug("📋 Aguinaldo split loaded:", {
      employee: readField(record, "employee", "employee")?.name,
      period: readField(record, "period", "period"),
      total: aguinaldo,
      efectivo: aguinaldoPagoEfectivo,
      deposito: aguinaldoPagoDeposito,
    });
  }
  const discounts = toNumber(readField(record, "discounts", "discounts"));
  const advances = toNumber(readField(record, "advances", "advances"));
  const presentismoAmount = toNumber(
    readField(record, "presentismo_amount", "presentismoAmount"),
  );
  const overtimeHours = toOptionalNumber(
    readField(record, "overtime_hours", "overtimeHours"),
  );
  const overtimeAmount = toNumber(
    readField(record, "overtime_amount", "overtimeAmount"),
  );
  const bonusAmount = toNumber(
    readField(record, "bonus_amount", "bonusAmount"),
  );
  const netTotal =
    toOptionalNumber(readField(record, "net_total", "netTotal")) ??
    resolvedWhiteAmount +
      resolvedInformalAmount +
      presentismoAmount +
      holidayBonus +
      aguinaldo +
      overtimeAmount +
      bonusAmount -
      advances -
      discounts;

  const processedDate = readField(record, "processed_date", "processedDate");
  const processedBy = readField(record, "processed_by", "processedBy");
  const notes = readField(record, "notes", "notes");
  const now = new Date().toISOString();

  return {
    id: (readField(record, "id", "id") as string) ?? "",
    employeeId:
      (readField(record, "employee_id", "employeeId") as string) ?? "",
    employeeName:
      (readField(employeeData, "name", "name") as string) ??
      (readField(record, "employeeName", "employeeName") as string) ??
      "Empleado no encontrado",
    period: (readField(record, "period", "period") as string) ?? "",
    baseDays,
    holidayDays,
    baseAmount: resolvedBaseAmount,
    holidayBonus,
    aguinaldo,
    aguinaldoPagoEfectivo,
    aguinaldoPagoDeposito,
    discounts,
    advances,
    whiteAmount: resolvedWhiteAmount,
    informalAmount: resolvedInformalAmount,
    presentismoAmount,
    overtimeHours: overtimeHours ?? 0,
    overtimeAmount,
    bonusAmount,
    netTotal,
    status:
      (readField(record, "status", "status") as PayrollRecord["status"]) ??
      "draft",
    processedDate: processedDate as string | undefined,
    processedBy: processedBy as string | undefined,
    notes: notes as string | undefined,
    createdAt: (readField(record, "created_at", "createdAt") as string) ?? now,
    updatedAt: (readField(record, "updated_at", "updatedAt") as string) ?? now,
  };
};
