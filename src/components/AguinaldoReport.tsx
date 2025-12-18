import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, DollarSign, Info } from "lucide-react";
import { usePayroll } from "@/hooks/use-payroll";
import { useEmployees } from "@/hooks/use-employees";
import { calculateAguinaldo } from "@/utils/aguinaldo";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";

interface AguinaldoReportRecord {
  id: string;
  employeeName: string;
  period: string;
  aguinaldoTotal: number;
  aguinaldoPagoEfectivo: number;
  aguinaldoPagoDeposito: number;
  bestSalary: number;
  bestSalaryPeriod: string;
  daysWorked: number;
  totalDays: number;
  proportional: boolean;
  startDate: string;
  status: string;
}

export default function AguinaldoReport() {
  const { employees, loading: employeesLoading } = useEmployees();
  const { payrollRecords, loading: payrollLoading } = usePayroll();
  const [selectedPeriod, setSelectedPeriod] = useState("2025-2");

  // Debug: Log loaded payroll records to verify aguinaldo split data
  useEffect(() => {
    if (payrollRecords.length > 0) {
      const withAguinaldoSplit = payrollRecords.filter(
        (p) => p.aguinaldoPagoEfectivo > 0 || p.aguinaldoPagoDeposito > 0,
      );
      console.log("📊 Payroll records loaded:", payrollRecords.length);
      console.log("💰 Records with aguinaldo split:", withAguinaldoSplit.length);
      if (withAguinaldoSplit.length > 0) {
        console.log("Sample record with split:", withAguinaldoSplit[0]);
      }
    }
  }, [payrollRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR");
  };

  const reportData: AguinaldoReportRecord[] = employees
    .filter((emp) => {
      // Mostrar empleados activos o que tengan registros de payroll en este período
      const hasPayrollInPeriod = payrollRecords.some(
        (p) => p.employeeId === emp.id && p.period === selectedPeriod,
      );
      return emp.status === "active" || hasPayrollInPeriod;
    })
    .map((emp) => {
      const aguinaldoResult = calculateAguinaldo(emp, selectedPeriod, payrollRecords);
      const payrollRecord = payrollRecords.find(
        (p) => p.employeeId === emp.id && p.period === selectedPeriod,
      );

      return {
        id: emp.id.toString(),
        employeeName: emp.name,
        period: selectedPeriod,
        aguinaldoTotal: aguinaldoResult.amount,
        aguinaldoPagoEfectivo: payrollRecord?.aguinaldoPagoEfectivo || 0,
        aguinaldoPagoDeposito: payrollRecord?.aguinaldoPagoDeposito || 0,
        bestSalary: aguinaldoResult.bestSalary,
        bestSalaryPeriod: aguinaldoResult.bestSalaryPeriod,
        daysWorked: aguinaldoResult.daysWorked,
        totalDays: aguinaldoResult.totalDays,
        proportional: aguinaldoResult.proportional,
        startDate: emp.startDate,
        status: payrollRecord?.status || "sin_liquidacion",
      };
    });

  const totals = reportData.reduce(
    (acc, record) => ({
      aguinaldoTotal: acc.aguinaldoTotal + record.aguinaldoTotal,
      aguinaldoPagoEfectivo: acc.aguinaldoPagoEfectivo + record.aguinaldoPagoEfectivo,
      aguinaldoPagoDeposito: acc.aguinaldoPagoDeposito + record.aguinaldoPagoDeposito,
    }),
    { aguinaldoTotal: 0, aguinaldoPagoEfectivo: 0, aguinaldoPagoDeposito: 0 },
  );

  const exportToPDF = () => {
    const doc = new jsPDF("landscape", "mm", "a4");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Aguinaldo (SAC)", 15, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${selectedPeriod}`, 15, 25);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-AR")}`, 15, 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Resumen:", 15, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Aguinaldo: ${formatCurrency(totals.aguinaldoTotal)}`, 15, 50);
    doc.text(
      `Total Aguinaldo Efectivo: ${formatCurrency(totals.aguinaldoPagoEfectivo)}`,
      15,
      57,
    );
    doc.text(
      `Total Aguinaldo Depósito: ${formatCurrency(totals.aguinaldoPagoDeposito)}`,
      15,
      64,
    );

    const tableData = reportData.map((record) => [
      record.employeeName,
      record.period,
      formatCurrency(record.aguinaldoTotal),
      formatCurrency(record.aguinaldoPagoEfectivo),
      formatCurrency(record.aguinaldoPagoDeposito),
      formatCurrency(record.bestSalary),
      record.bestSalaryPeriod,
      `${record.daysWorked}/${record.totalDays}`,
      record.proportional ? "Proporcional" : "Completo",
    ]);

    tableData.push([
      "TOTALES",
      "",
      formatCurrency(totals.aguinaldoTotal),
      formatCurrency(totals.aguinaldoPagoEfectivo),
      formatCurrency(totals.aguinaldoPagoDeposito),
      "",
      "",
      "",
      "",
    ]);

    autoTable(doc, {
      head: [
        [
          "Empleado",
          "Período",
          "Aguinaldo Total",
          "Pago Efectivo",
          "Pago Depósito",
          "Mejor Sueldo",
          "Período Salario",
          "Días Trabajados",
          "Tipo",
        ],
      ],
      body: tableData,
      startY: 75,
      margin: { left: 15, right: 15 },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: "center",
        font: "helvetica",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 45, halign: "left" },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
        5: { cellWidth: 35, halign: "right" },
        6: { cellWidth: 35, halign: "center" },
        7: { cellWidth: 30, halign: "center" },
        8: { cellWidth: 25, halign: "center" },
      },
    });

    doc.save(`aguinaldo-${selectedPeriod}.pdf`);
  };

  const exportToCSV = () => {
    const headers = [
      "Empleado",
      "Período",
      "Aguinaldo Total",
      "Pago Efectivo",
      "Pago Depósito",
      "Mejor Sueldo",
      "Período Salario",
      "Días Trabajados",
      "Tipo",
    ];

    const csvContent = [
      headers.join(","),
      ...reportData.map((record) =>
        [
          record.employeeName,
          record.period,
          record.aguinaldoTotal,
          record.aguinaldoPagoEfectivo,
          record.aguinaldoPagoDeposito,
          record.bestSalary,
          record.bestSalaryPeriod,
          `${record.daysWorked}/${record.totalDays}`,
          record.proportional ? "Proporcional" : "Completo",
        ].join(","),
      ),
      [
        "TOTALES",
        "",
        totals.aguinaldoTotal,
        totals.aguinaldoPagoEfectivo,
        totals.aguinaldoPagoDeposito,
        "",
        "",
        "",
        "",
      ].join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `aguinaldo-${selectedPeriod}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (employeesLoading || payrollLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Cargando datos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Reporte de Aguinaldo (SAC)
          </CardTitle>
          <CardDescription>
            Detalle completo del aguinaldo por empleado con montos de pago efectivo
            y depósito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período:</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-1">Primer Semestre 2024</SelectItem>
                  <SelectItem value="2024-2">Segundo Semestre 2024</SelectItem>
                  <SelectItem value="2025-1">Primer Semestre 2025</SelectItem>
                  <SelectItem value="2025-2">Segundo Semestre 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto space-x-2">
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar CSV
              </Button>
              <Button onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Información:</p>
              <p className="text-blue-700 mt-1">
                Este reporte muestra el cálculo completo del aguinaldo (SAC) incluyendo
                los montos ingresados para pago en efectivo y depósito. Si los valores
                de pago no coinciden con el total calculado, aparecerá una alerta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Empleado</CardTitle>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Aguinaldo</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totals.aguinaldoTotal)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Efectivo</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.aguinaldoPagoEfectivo)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Depósito</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totals.aguinaldoPagoDeposito)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-right">Aguinaldo Total</TableHead>
                  <TableHead className="text-right">Pago Efectivo</TableHead>
                  <TableHead className="text-right">Pago Depósito</TableHead>
                  <TableHead className="text-right">Mejor Sueldo</TableHead>
                  <TableHead className="text-center">Período Salario</TableHead>
                  <TableHead className="text-center">Días Trabajados</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((record) => {
                  const totalPago = record.aguinaldoPagoEfectivo + record.aguinaldoPagoDeposito;
                  const hasDiscrepancy = totalPago > 0 && Math.abs(totalPago - record.aguinaldoTotal) > 0.01;

                  return (
                    <TableRow
                      key={record.id}
                      className={hasDiscrepancy ? "bg-red-50" : ""}
                    >
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell className="text-right font-bold text-purple-600">
                        {formatCurrency(record.aguinaldoTotal)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {record.aguinaldoPagoEfectivo > 0
                          ? formatCurrency(record.aguinaldoPagoEfectivo)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {record.aguinaldoPagoDeposito > 0
                          ? formatCurrency(record.aguinaldoPagoDeposito)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(record.bestSalary)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {record.bestSalaryPeriod}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {record.daysWorked}/{record.totalDays}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={record.proportional ? "secondary" : "default"}
                        >
                          {record.proportional ? "Proporcional" : "Completo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasDiscrepancy ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Badge variant="destructive" className="cursor-pointer">
                                ⚠️ Discrepancia
                              </Badge>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalle de Discrepancia</DialogTitle>
                                <DialogDescription>
                                  {record.employeeName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium">
                                    Aguinaldo Total Calculado:
                                  </p>
                                  <p className="text-lg">
                                    {formatCurrency(record.aguinaldoTotal)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    Suma de Pagos Registrados:
                                  </p>
                                  <p className="text-lg">
                                    {formatCurrency(totalPago)}
                                  </p>
                                </div>
                                <div className="p-3 bg-red-50 border border-red-200 rounded">
                                  <p className="text-sm font-medium text-red-800">
                                    Diferencia:
                                  </p>
                                  <p className="text-lg font-bold text-red-700">
                                    {formatCurrency(Math.abs(totalPago - record.aguinaldoTotal))}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Por favor revisa los montos ingresados en la sección
                                  de Liquidaciones.
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : record.aguinaldoTotal === 0 ? (
                          <Badge variant="outline">Sin aguinaldo</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50">
                            ✓ OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 pt-4 border-t grid grid-cols-9 gap-4 font-bold bg-gray-50 p-4 rounded">
            <div className="col-span-1">TOTALES</div>
            <div className="col-span-1 text-right">{formatCurrency(totals.aguinaldoTotal)}</div>
            <div className="col-span-1 text-right">{formatCurrency(totals.aguinaldoPagoEfectivo)}</div>
            <div className="col-span-1 text-right">{formatCurrency(totals.aguinaldoPagoDeposito)}</div>
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
