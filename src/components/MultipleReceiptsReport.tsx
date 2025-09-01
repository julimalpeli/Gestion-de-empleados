import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Scissors, Download, FileDown } from "lucide-react";
import { usePayroll } from "@/hooks/use-payroll";
import jsPDF from "jspdf";

interface MultipleReceiptsReportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReceiptItem {
  label: string;
  amount: number;
  isDeduction?: boolean;
}

const MultipleReceiptsReport = ({ isOpen, onClose }: MultipleReceiptsReportProps) => {
  const { payrollRecords } = usePayroll();

  // Get unique periods from real payroll data
  const availablePeriods = [
    ...new Set(payrollRecords.map((record) => record.period)),
  ].sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  const [selectedPeriod, setSelectedPeriod] = useState(
    availablePeriods[0] || "2025-07",
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Generate receipt items for each employee
  const getReceiptItems = (record: any): ReceiptItem[] => {
    const items: ReceiptItem[] = [];

    // Debug logging for data verification
    console.log(`🔍 Receipt data for ${record.employeeName}:`, {
      informalAmount: record.informalAmount,
      whiteAmount: record.whiteAmount,
      presentismoAmount: record.presentismoAmount,
      overtimeAmount: record.overtimeAmount,
      holidayBonus: record.holidayBonus,
      bonusAmount: record.bonusAmount,
      aguinaldo: record.aguinaldo,
      advances: record.advances,
      discounts: record.discounts,
      netTotal: record.netTotal,
      dataSource: 'Database via usePayroll hook'
    });

    // Solo mostrar el monto en efectivo (informal_amount) sin desglose
    const efectivoAmount = record.informalAmount || 0;
    if (efectivoAmount > 0) {
      items.push({ label: "Efectivo", amount: efectivoAmount });
    }

    // No mostrar otros conceptos - solo el total en efectivo según Opción B

    return items;
  };

  // Filter records by selected period and approved status
  const filteredRecords = payrollRecords
    .filter((record) => record.period === selectedPeriod)
    .filter((record) => ["approved", "processed", "paid"].includes(record.status || ""));

  const generatePDF = () => {
    const doc = new jsPDF("portrait", "mm", "a4");

    // Page dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const receiptWidth = (pageWidth - 4 * margin) / 3; // 3 columns
    const receiptHeight = 80; // Fixed height for consistency

    let currentX = margin;
    let currentY = margin;
    let receiptsPerRow = 0;
    const maxReceiptsPerRow = 3;

    // Set font
    doc.setFont("helvetica", "normal");

    filteredRecords.forEach((record, index) => {
      const items = getReceiptItems(record);
      const totalAmount = record.informalAmount || 0;

      // Check if we need a new page
      if (currentY + receiptHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        currentX = margin;
        receiptsPerRow = 0;
      }

      // Draw receipt border
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([1, 1], 0); // Dashed border for cutting
      doc.rect(currentX, currentY, receiptWidth, receiptHeight);
      doc.setLineDashPattern([], 0); // Reset to solid line

      // Company header
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const headerText = "CÁDIZ BAR DE TAPAS";
      const headerWidth = doc.getTextWidth(headerText);
      doc.text(headerText, currentX + (receiptWidth - headerWidth) / 2, currentY + 8);

      // Employee name
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const employeeName = record.employeeName || "Sin nombre";
      const nameWidth = doc.getTextWidth(employeeName);
      doc.text(employeeName, currentX + (receiptWidth - nameWidth) / 2, currentY + 16);

      // Period
      const [year, month] = selectedPeriod.split("-");
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                         "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const periodText = `Período: ${monthNames[parseInt(month) - 1]} ${year}`;
      doc.setFontSize(7);
      doc.text(periodText, currentX + 2, currentY + 24);

      // Items
      let itemY = currentY + 30;
      doc.setFontSize(7);

      items.forEach((item) => {
        if (itemY > currentY + receiptHeight - 15) return; // Skip if no space

        const label = item.label;
        const amount = item.isDeduction ? `-${formatCurrency(item.amount)}` : formatCurrency(item.amount);

        doc.text(label, currentX + 2, itemY);
        const amountWidth = doc.getTextWidth(amount);
        doc.text(amount, currentX + receiptWidth - amountWidth - 2, itemY);

        itemY += 4;
      });

      // Total
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const totalText = "Total:";
      const totalAmountText = formatCurrency(totalAmount);
      const totalY = currentY + receiptHeight - 10;

      doc.text(totalText, currentX + 2, totalY);
      const totalAmountWidth = doc.getTextWidth(totalAmountText);
      doc.text(totalAmountText, currentX + receiptWidth - totalAmountWidth - 2, totalY);

      // Status
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      const statusText = record.status === "paid" ? "Pagada" :
                        record.status === "processed" ? "Procesada" : "Aprobada";
      doc.text(statusText, currentX + 2, currentY + receiptHeight - 4);

      // Move to next position
      receiptsPerRow++;
      if (receiptsPerRow >= maxReceiptsPerRow) {
        // New row
        currentX = margin;
        currentY += receiptHeight + 5;
        receiptsPerRow = 0;
      } else {
        // Next column
        currentX += receiptWidth + margin;
      }
    });

    // Save the PDF
    doc.save(`recibos-multiple-${selectedPeriod}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Recibos para Imprimir
          </DialogTitle>
          <DialogDescription>
            Genera recibos múltiples en una página para imprimir y recortar
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
                      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                         "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
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

            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Generar PDF
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={generatePDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Descargar PDF para Recortar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Preview Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa - {filteredRecords.length} recibos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {filteredRecords.slice(0, 9).map((record) => {
                  const items = getReceiptItems(record);
                  const totalAmount = record.informalAmount || 0;

                  return (
                    <div key={record.id} className="border-2 border-dashed border-gray-300 p-3 bg-white">
                      <div className="text-center">
                        <h3 className="font-bold text-xs mb-1">CÁDIZ BAR DE TAPAS</h3>
                        <p className="text-xs font-medium mb-2">{record.employeeName}</p>

                        <div className="text-xs mb-2">
                          <p>Período: {(() => {
                            const [year, month] = selectedPeriod.split("-");
                            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                               "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                            return `${monthNames[parseInt(month) - 1]} ${year}`;
                          })()}</p>
                        </div>

                        <div className="space-y-1 text-xs">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.label}</span>
                              <span className={item.isDeduction ? "text-red-600" : ""}>
                                {item.isDeduction ? "-" : ""}{formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}

                          <div className="border-t pt-1 font-bold flex justify-between">
                            <span>Total:</span>
                            <span>{formatCurrency(totalAmount)}</span>
                          </div>

                          <div className="text-xs text-gray-500">
                            {record.status === "paid" ? "Pagada" :
                             record.status === "processed" ? "Procesada" : "Aprobada"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRecords.length > 9 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Y {filteredRecords.length - 9} recibos más en el PDF...
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={generatePDF}>
            <Scissors className="h-4 w-4 mr-2" />
            Generar PDF para Recortar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultipleReceiptsReport;
