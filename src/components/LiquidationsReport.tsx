import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  FileDown,
} from "lucide-react";
import { usePayroll } from "@/hooks/use-payroll";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Real report data - will be populated from database
const reportData = [];

interface LiquidationsReportProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiquidationsReport = ({ isOpen, onClose }: LiquidationsReportProps) => {
  const { payrollRecords } = usePayroll();

  // Get unique periods from real payroll data
  const availablePeriods = [
    ...new Set(payrollRecords.map((record) => record.period)),
  ].sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  const [selectedPeriod, setSelectedPeriod] = useState(
    availablePeriods[0] || "2024-12",
  );
  const [selectedType, setSelectedType] = useState("all");

  // Filter records by selected period - real data from database
  const reportData = payrollRecords
    .filter((record) => record.period === selectedPeriod)
    .map((record) => {
      // Calcular sueldo base (días trabajados * salario diario)
      const baseDays = record.baseDays || 0;
      const holidayDays = record.holidayDays || 0;
      const overtimeHours = record.overtimeHours || 0;
      const overtimeAmount = record.overtimeAmount || 0;
      const presentismo = record.presentismoAmount || 0;
      const bonusAmount = record.bonusAmount || 0;
      const advances = record.advances || 0;
      const discounts = record.discounts || 0;
      const holidayBonus = record.holidayBonus || 0;
      const aguinaldo = record.aguinaldo || 0;

      // Calcular sueldo base aproximado
      const baseSalary =
        (record.netTotal || 0) -
        presentismo -
        overtimeAmount -
        bonusAmount -
        holidayBonus -
        aguinaldo +
        advances +
        discounts;

      return {
        id: record.id,
        employeeName: record.employeeName,
        period: record.period,
        // Datos de días y horas
        baseDays,
        holidayDays,
        overtimeHours,
        // Montos de conceptos
        baseSalary,
        presentismo,
        overtimeAmount,
        bonusAmount,
        advances,
        discounts,
        holidayBonus,
        aguinaldo,
        // Totales por forma de pago - corregir efectivo cuando whiteAmount es 0
        efectivo:
          (record.whiteAmount || 0) === 0
            ? record.netTotal || 0
            : record.informalAmount || 0,
        deposito: record.whiteAmount || 0,
        totalNeto: record.netTotal || 0,
        hasAguinaldo: aguinaldo > 0,
        status: record.status || "draft",
      };
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredData = reportData.filter((record) => {
    if (selectedType === "with-aguinaldo") return record.hasAguinaldo;
    if (selectedType === "without-aguinaldo") return !record.hasAguinaldo;
    return true;
  });

  const totals = filteredData.reduce(
    (acc, record) => ({
      baseSalary: acc.baseSalary + record.baseSalary,
      presentismo: acc.presentismo + record.presentismo,
      overtimeAmount: acc.overtimeAmount + record.overtimeAmount,
      bonusAmount: acc.bonusAmount + record.bonusAmount,
      advances: acc.advances + record.advances,
      discounts: acc.discounts + record.discounts,
      holidayBonus: acc.holidayBonus + record.holidayBonus,
      aguinaldo: acc.aguinaldo + record.aguinaldo,
      efectivo: acc.efectivo + record.efectivo,
      deposito: acc.deposito + record.deposito,
      totalNeto: acc.totalNeto + record.totalNeto,
    }),
    {
      baseSalary: 0,
      presentismo: 0,
      overtimeAmount: 0,
      bonusAmount: 0,
      advances: 0,
      discounts: 0,
      holidayBonus: 0,
      aguinaldo: 0,
      efectivo: 0,
      deposito: 0,
      totalNeto: 0,
    },
  );

  const exportToCSV = () => {
    const headers = [
      "Empleado",
      "Período",
      "Días Trabajados",
      "Días Feriados",
      "Sueldo Base",
      "Presentismo",
      "Horas Extra",
      "Monto H.Extra",
      "Bonificaciones",
      "Adelantos",
      "Descuentos",
      "Feriado Doble",
      "Efectivo",
      "Depósito",
      "Total Neto",
      "Estado",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((record) =>
        [
          record.employeeName,
          record.period,
          record.baseDays,
          record.holidayDays,
          record.baseSalary,
          record.presentismo,
          record.overtimeHours,
          record.overtimeAmount,
          record.bonusAmount,
          -record.advances, // Negativo para mostrar como descuento
          -record.discounts, // Negativo para mostrar como descuento
          record.holidayBonus,
          record.efectivo,
          record.deposito,
          record.totalNeto,
          record.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `liquidaciones-${selectedPeriod}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToPDF = () => {
    // Create PDF in landscape orientation for better table fit
    const doc = new jsPDF("landscape", "mm", "a4");

    // Set default font to Helvetica for better readability
    doc.setFont("helvetica", "normal");

    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Liquidaciones", 15, 20);

    // Add period
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const [year, month] = selectedPeriod.split("-");
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
    const monthName = monthNames[parseInt(month) - 1];
    doc.text(`Período: ${monthName} ${year}`, 15, 28);

    // Add summary in columns with better spacing
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen:", 15, 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Efectivo: ${formatCurrency(totals.efectivo)}`, 15, 45);
    doc.text(`Total Depósito: ${formatCurrency(totals.deposito)}`, 15, 52);
    doc.text(`Total Aguinaldo: ${formatCurrency(totals.aguinaldo)}`, 140, 45);
    doc.text(`Total General: ${formatCurrency(totals.totalNeto)}`, 140, 52);

    // Simplified table with main columns for better readability
    const tableData = filteredData.map((record) => [
      record.employeeName, // Sin truncar el nombre
      record.period,
      record.baseDays.toString(),
      formatCurrency(record.baseSalary),
      record.presentismo > 0 ? formatCurrency(record.presentismo) : "-",
      record.overtimeHours > 0 ? `${record.overtimeHours}h` : "-",
      record.bonusAmount > 0 ? formatCurrency(record.bonusAmount) : "-",
      record.advances > 0 ? formatCurrency(-record.advances) : "-", // Adelantos
      record.discounts > 0 ? formatCurrency(-record.discounts) : "-", // Descuentos
      record.holidayBonus > 0 ? formatCurrency(record.holidayBonus) : "-", // Feriados
      formatCurrency(record.efectivo),
      formatCurrency(record.deposito),
      formatCurrency(record.totalNeto),
      record.status === "paid"
        ? "Pagada"
        : record.status === "processed"
          ? "Procesada"
          : record.status === "approved"
            ? "Aprobada"
            : record.status === "pending"
              ? "Pendiente"
              : "Borrador",
    ]);

    // Add totals row
    tableData.push([
      "TOTALES",
      "",
      "",
      formatCurrency(totals.baseSalary),
      formatCurrency(totals.presentismo),
      "",
      formatCurrency(totals.bonusAmount),
      formatCurrency(-totals.advances), // Total adelantos
      formatCurrency(-totals.discounts), // Total descuentos
      formatCurrency(totals.holidayBonus), // Total de feriados
      formatCurrency(totals.efectivo),
      formatCurrency(totals.deposito),
      formatCurrency(totals.totalNeto),
      "",
    ]);

    autoTable(doc, {
      head: [
        [
          "Empleado",
          "Período",
          "Días",
          "Sueldo Base",
          "Presentismo",
          "H.Extra",
          "Bonificac.",
          "Adelantos",
          "Descuentos",
          "Feriados",
          "Efectivo",
          "Depósito",
          "Total Neto",
          "Estado",
        ],
      ],
      body: tableData,
      startY: 60,
      margin: { left: 10, right: 10 }, // Usar más espacio horizontal
      styles: {
        fontSize: 6, // Reducido de 7 a 6 para evitar saltos
        cellPadding: 3, // Más padding para mejor legibilidad
        halign: "center",
        valign: "middle",
        lineWidth: 0.1,
        font: "helvetica",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 6, // Reducido de 7 a 6 para evitar saltos
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 35, halign: "left" }, // Empleado
        1: { cellWidth: 16, halign: "center" }, // Período
        2: { cellWidth: 10, halign: "center" }, // Días
        3: { cellWidth: 22, halign: "right" }, // Sueldo Base
        4: { cellWidth: 20, halign: "right" }, // Presentismo
        5: { cellWidth: 12, halign: "center" }, // H.Extra
        6: { cellWidth: 18, halign: "right" }, // Bonificaciones
        7: { cellWidth: 18, halign: "right" }, // Adelantos
        8: { cellWidth: 18, halign: "right" }, // Descuentos
        9: { cellWidth: 16, halign: "right" }, // Feriados
        10: { cellWidth: 22, halign: "right" }, // Efectivo
        11: { cellWidth: 22, halign: "right" }, // Depósito
        12: { cellWidth: 25, halign: "right" }, // Total Neto
        13: { cellWidth: 16, halign: "center" }, // Estado
      },
      headStyles: { fillColor: [41, 128, 185] },
      didParseCell: function (data: any) {
        // Make totals row bold
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [236, 240, 241];
        }
      },
    });

    // Save the PDF
    doc.save(`liquidaciones-${selectedPeriod}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reporte de Liquidaciones
          </DialogTitle>
          <DialogDescription>
            Reporte detallado con montos de efectivo, depósito y aguinaldos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período:</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.length > 0 ? (
                    availablePeriods.map((period) => {
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
                      const monthName = monthNames[parseInt(month) - 1];
                      return (
                        <SelectItem key={period} value={period}>
                          {monthName} {year}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No hay períodos disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo:</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las liquidaciones</SelectItem>
                  <SelectItem value="with-aguinaldo">Con aguinaldo</SelectItem>
                  <SelectItem value="without-aguinaldo">
                    Sin aguinaldo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Efectivo
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.efectivo)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pagos en efectivo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Depósito
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totals.deposito)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Transferencias bancarias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Aguinaldo
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totals.aguinaldo)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sueldo anual complementario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total General
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totals.totalNeto)}
                </div>
                <p className="text-xs text-muted-foreground">Total a pagar</p>
              </CardContent>
            </Card>
          </div>

          {/* Report Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Liquidaciones</CardTitle>
              <CardDescription>
                Montos desglosados por empleado y forma de pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-center">D.Trab</TableHead>
                      <TableHead className="text-center">D.Fer</TableHead>
                      <TableHead className="text-right">Sueldo Base</TableHead>
                      <TableHead className="text-right">Presentismo</TableHead>
                      <TableHead className="text-center">H.Extra</TableHead>
                      <TableHead className="text-right">Monto H.E</TableHead>
                      <TableHead className="text-right">Bonificac.</TableHead>
                      <TableHead className="text-right">Adelantos</TableHead>
                      <TableHead className="text-right">Descuentos</TableHead>
                      <TableHead className="text-right">Fer.Doble</TableHead>
                      <TableHead className="text-right">Aguinaldo</TableHead>
                      <TableHead className="text-right">Efectivo</TableHead>
                      <TableHead className="text-right">Depósito</TableHead>
                      <TableHead className="text-right">Total Neto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.employeeName}
                        </TableCell>
                        <TableCell>{record.period}</TableCell>
                        <TableCell className="text-center">
                          {record.baseDays}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.holidayDays || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          {formatCurrency(record.baseSalary)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {record.presentismo > 0
                            ? formatCurrency(record.presentismo)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.overtimeHours > 0
                            ? `${record.overtimeHours}h`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {record.overtimeAmount > 0
                            ? formatCurrency(record.overtimeAmount)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-purple-600">
                          {record.bonusAmount > 0
                            ? formatCurrency(record.bonusAmount)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {record.advances > 0
                            ? formatCurrency(-record.advances)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {record.discounts > 0
                            ? formatCurrency(-record.discounts)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {record.holidayBonus > 0
                            ? formatCurrency(record.holidayBonus)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-purple-600">
                          {record.aguinaldo > 0
                            ? formatCurrency(record.aguinaldo)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(record.efectivo)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          {formatCurrency(record.deposito)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(record.totalNeto)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              record.status === "paid"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : record.status === "processed"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : record.status === "approved"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : record.status === "pending"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {record.status === "paid"
                              ? "Pagada"
                              : record.status === "processed"
                                ? "Procesada"
                                : record.status === "approved"
                                  ? "Aprobada"
                                  : record.status === "pending"
                                    ? "Pendiente"
                                    : "Borrador"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Totals Row */}
                    <TableRow className="border-t-2 font-bold bg-muted/50">
                      <TableCell colSpan={4}>TOTALES</TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(totals.baseSalary)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(totals.presentismo)}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(totals.overtimeAmount)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        {formatCurrency(totals.bonusAmount)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(-totals.advances)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(-totals.discounts)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(totals.holidayBonus)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        {formatCurrency(totals.aguinaldo)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(totals.efectivo)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(totals.deposito)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.totalNeto)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Descargar Reporte
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Descargar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Descargar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiquidationsReport;
