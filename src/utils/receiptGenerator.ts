import type { PayrollRecord } from "@/services/interfaces";

interface ReceiptData {
  employee: {
    name: string;
    dni: string;
    position: string;
    startDate: string;
  };
  payroll: PayrollRecord;
  period: string;
  company: {
    name: string;
    address: string;
    phone: string;
  };
}

export const generatePayrollReceiptPDF = async (data: ReceiptData) => {
  try {
    // Create HTML content for the receipt
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo de Sueldo - ${data.employee.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .receipt-title { font-size: 18px; margin-top: 10px; }
          .employee-info { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .payment-details { margin-bottom: 20px; }
          .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .details-table th, .details-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .details-table th { background-color: #f2f2f2; }
          .total-section { background-color: #e8f5e8; padding: 15px; font-weight: bold; font-size: 16px; }
          .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${data.company.name}</div>
          <div>${data.company.address}</div>
          <div class="receipt-title">RECIBO DE SUELDO</div>
        </div>

        <div class="employee-info">
          <div class="info-row">
            <span><strong>Empleado:</strong> ${data.employee.name}</span>
            <span><strong>DNI:</strong> ${data.employee.dni}</span>
          </div>
          <div class="info-row">
            <span><strong>Puesto:</strong> ${data.employee.position}</span>
            <span><strong>Período:</strong> ${formatPeriodForDisplay(data.period)}</span>
          </div>
          <div class="info-row">
            <span><strong>Fecha de Ingreso:</strong> ${new Date(data.employee.startDate).toLocaleDateString("es-AR")}</span>
            <span><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString("es-AR")}</span>
          </div>
        </div>

        <div class="payment-details">
          <table class="details-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Cantidad/Días</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sueldo Depósito</td>
                <td>${data.payroll.baseDays} días</td>
                <td>$${formatAmount(data.payroll.whiteAmount)}</td>
              </tr>
              <tr>
                <td>Sueldo Efectivo</td>
                <td>${data.payroll.baseDays} días</td>
                <td>$${formatAmount(data.payroll.informalAmount)}</td>
              </tr>
              ${
                data.payroll.holidayDays > 0
                  ? `
              <tr>
                <td>Días Feriados</td>
                <td>${data.payroll.holidayDays} días</td>
                <td>$${formatAmount(data.payroll.holidayBonus)}</td>
              </tr>
              `
                  : ""
              }
              ${
                data.payroll.presentismoAmount > 0
                  ? `
              <tr>
                <td>Presentismo</td>
                <td>-</td>
                <td>$${formatAmount(data.payroll.presentismoAmount)}</td>
              </tr>
              `
                  : ""
              }
              ${
                data.payroll.overtimeHours > 0
                  ? `
              <tr>
                <td>Horas Extras</td>
                <td>${data.payroll.overtimeHours} horas</td>
                <td>$${formatAmount(data.payroll.overtimeAmount)}</td>
              </tr>
              `
                  : ""
              }
              ${
                data.payroll.bonusAmount > 0
                  ? `
              <tr>
                <td>Bonificaciones</td>
                <td>-</td>
                <td>$${formatAmount(data.payroll.bonusAmount)}</td>
              </tr>
              `
                  : ""
              }
              ${
                data.payroll.aguinaldo > 0
                  ? `
              <tr>
                <td>Aguinaldo</td>
                <td>-</td>
                <td>$${formatAmount(data.payroll.aguinaldo)}</td>
              </tr>
              `
                  : ""
              }
              ${
                data.payroll.advances > 0
                  ? `
              <tr>
                <td>Adelantos</td>
                <td>-</td>
                <td>-$${formatAmount(data.payroll.advances)}</td>
              </tr>
              `
                  : ""
              }
              ${
                data.payroll.discounts > 0
                  ? `
              <tr>
                <td>Descuentos</td>
                <td>-</td>
                <td>-$${formatAmount(data.payroll.discounts)}</td>
              </tr>
              `
                  : ""
              }
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL NETO A COBRAR:</span>
            <span>$${formatAmount(data.payroll.netTotal)}</span>
          </div>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">Firma del Empleado</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Firma del Empleador</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and download PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 100);
      };
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Error al generar el PDF del recibo");
  }
};

export const buildPayrollReceiptCsv = (data: ReceiptData): string => {
  return [
    ["RECIBO DE SUELDO"],
    [""],
    ["Empresa:", data.company.name],
    ["Dirección:", data.company.address],
    [""],
    ["DATOS DEL EMPLEADO"],
    ["Nombre:", data.employee.name],
    ["DNI:", data.employee.dni],
    ["Puesto:", data.employee.position],
    ["Período:", formatPeriodForDisplay(data.period)],
    [
      "Fecha de Ingreso:",
      new Date(data.employee.startDate + "T00:00:00").toLocaleDateString(
        "es-AR",
      ),
    ],
    ["Fecha de Emisión:", new Date().toLocaleDateString("es-AR")],
    [""],
    ["DETALLE DE LIQUIDACIÓN"],
    ["Concepto", "Cantidad/Días", "Importe"],
    [
      "Sueldo Depósito",
      data.payroll.baseDays + " días",
      "$" + formatAmount(data.payroll.whiteAmount),
    ],
    [
      "Sueldo Efectivo",
      data.payroll.baseDays + " días",
      "$" + formatAmount(data.payroll.informalAmount),
    ],
    ...(data.payroll.holidayDays > 0
      ? [
          [
            "Días Feriados",
            data.payroll.holidayDays + " días",
            "$" + formatAmount(data.payroll.holidayBonus),
          ],
        ]
      : []),
    ...(data.payroll.presentismoAmount > 0
      ? [
          [
            "Presentismo",
            "-",
            "$" + formatAmount(data.payroll.presentismoAmount),
          ],
        ]
      : []),
    ...(data.payroll.overtimeHours > 0
      ? [
          [
            "Horas Extras",
            data.payroll.overtimeHours + " horas",
            "$" + formatAmount(data.payroll.overtimeAmount),
          ],
        ]
      : []),
    ...(data.payroll.bonusAmount > 0
      ? [["Bonificaciones", "-", "$" + formatAmount(data.payroll.bonusAmount)]]
      : []),
    ...(data.payroll.aguinaldo > 0
      ? [["Aguinaldo", "-", "$" + formatAmount(data.payroll.aguinaldo)]]
      : []),
    ...(data.payroll.advances > 0
      ? [["Adelantos", "-", "-$" + formatAmount(data.payroll.advances)]]
      : []),
    ...(data.payroll.discounts > 0
      ? [["Descuentos", "-", "-$" + formatAmount(data.payroll.discounts)]]
      : []),
    [""],
    ["TOTAL NETO A COBRAR:", "", "$" + formatAmount(data.payroll.netTotal)],
  ]
    .map((row) => row.join(","))
    .join("\n");
};

export const generatePayrollReceiptExcel = async (data: ReceiptData) => {
  try {
    const csvContent = buildPayrollReceiptCsv(data);

    // Create and download CSV file
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `recibo_${data.employee.name.replace(/\s+/g, "_")}_${data.period}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error generating Excel:", error);
    throw new Error("Error al generar el archivo Excel del recibo");
  }
};

// Helper functions
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatPeriodForDisplay = (period: string): string => {
  const [year, month] = period.split("-");
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};
