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
    .map((record) => ({
      id: record.id, // Add unique identifier for React key
      employeeName: record.employeeName,
      period: record.period,
      efectivo: record.informalAmount || 0,
      deposito: record.whiteAmount || 0,
      aguinaldo: record.aguinaldo || 0,
      totalNeto: record.netTotal || 0,
      hasAguinaldo: (record.aguinaldo || 0) > 0,
      status: record.status || "draft", // Include real status
    }));

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
      efectivo: acc.efectivo + record.efectivo,
      deposito: acc.deposito + record.deposito,
      aguinaldo: acc.aguinaldo + record.aguinaldo,
      totalNeto: acc.totalNeto + record.totalNeto,
    }),
    { efectivo: 0, deposito: 0, aguinaldo: 0, totalNeto: 0 },
  );

  const exportToCSV = () => {
    const headers = [
      "Empleado",
      "Período",
      "Efectivo",
      "Depósito",
      "Aguinaldo",
      "Total Neto",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((record) =>
        [
          record.employeeName,
          record.period,
          record.efectivo,
          record.deposito,
          record.aguinaldo,
          record.totalNeto,
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
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Reporte de Liquidaciones", 14, 22);

    // Add period
    doc.setFontSize(12);
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
    doc.text(`Período: ${monthName} ${year}`, 14, 32);

    // Add summary
    doc.text("Resumen:", 14, 45);
    doc.text(`Total Efectivo: ${formatCurrency(totals.efectivo)}`, 14, 52);
    doc.text(`Total Depósito: ${formatCurrency(totals.deposito)}`, 14, 59);
    doc.text(`Total Aguinaldo: ${formatCurrency(totals.aguinaldo)}`, 14, 66);
    doc.text(`Total General: ${formatCurrency(totals.totalNeto)}`, 14, 73);

    // Add table
    const tableData = filteredData.map((record) => [
      record.employeeName,
      record.period,
      formatCurrency(record.efectivo),
      formatCurrency(record.deposito),
      record.aguinaldo > 0 ? formatCurrency(record.aguinaldo) : "-",
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
      formatCurrency(totals.efectivo),
      formatCurrency(totals.deposito),
      formatCurrency(totals.aguinaldo),
      formatCurrency(totals.totalNeto),
      "",
    ]);

    autoTable(doc, {
      head: [
        [
          "Empleado",
          "Período",
          "Efectivo",
          "Depósito",
          "Aguinaldo",
          "Total Neto",
          "Estado",
        ],
      ],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
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
                      <TableHead className="text-right">Efectivo</TableHead>
                      <TableHead className="text-right">Depósito</TableHead>
                      <TableHead className="text-right">Aguinaldo</TableHead>
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
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(record.efectivo)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          {formatCurrency(record.deposito)}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.aguinaldo > 0 ? (
                            <span className="font-medium text-purple-600">
                              {formatCurrency(record.aguinaldo)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                      <TableCell colSpan={2}>TOTALES</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(totals.efectivo)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(totals.deposito)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        {formatCurrency(totals.aguinaldo)}
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
