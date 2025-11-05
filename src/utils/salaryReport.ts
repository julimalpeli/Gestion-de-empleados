import type { Employee } from "@/services/interfaces";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("es-AR");
  } catch {
    return String(dateStr);
  }
};

const buildRows = (employees: Employee[]) => {
  return employees.map((e) => {
    const base = Number((e as any).sueldoBase || 0);
    const present = Number((e as any).presentismo || 0);
    const daily = base / 30;
    return {
      name: e.name,
      dni: e.dni || "",
      position: e.position || "",
      startDate: formatDate(e.startDate),
      base,
      present,
      daily,
      status: e.status === "active" ? "Activo" : "Inactivo",
    };
  });
};

export const exportSalariesToXLS = (employees: Employee[], fileName?: string) => {
  const rows = buildRows(employees);

  const header = [
    "Nombre",
    "Documento",
    "Puesto",
    "Fecha Ingreso",
    "Sueldo Base",
    "Presentismo",
    "Sueldo Diario",
    "Estado",
  ];

  const aoa: (string | number)[][] = [header];
  rows.forEach((r) => {
    aoa.push([
      r.name,
      r.dni,
      r.position,
      r.startDate,
      r.base,
      r.present,
      Math.round(r.daily),
      r.status,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Set column widths
  const colWidths = [
    { wch: 28 }, // Nombre
    { wch: 12 }, // Documento
    { wch: 18 }, // Puesto
    { wch: 12 }, // Fecha Ingreso
    { wch: 18 }, // Sueldo Base
    { wch: 14 }, // Presentismo
    { wch: 14 }, // Diario
    { wch: 10 }, // Estado
  ];
  (ws as any)['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sueldos");

  const safeName = fileName || `reporte_sueldos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, safeName);
};

export const exportSalariesToPDF = (employees: Employee[], fileName?: string) => {
  const rows = buildRows(employees);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const title = "Reporte de Sueldos de Empleados";
  doc.setFontSize(16);
  doc.text(title, 40, 40);

  const generatedAt = new Date().toLocaleString("es-AR");
  doc.setFontSize(10);
  doc.text(`Generado: ${generatedAt}`, 40, 58);

  const body = rows.map((r) => [
    r.name,
    r.dni,
    r.position,
    r.startDate,
    formatCurrency(r.base),
    formatCurrency(r.present),
    formatCurrency(Math.round(r.daily)),
    r.status,
  ]);

  autoTable(doc, {
    startY: 70,
    head: [[
      "Nombre",
      "Documento",
      "Puesto",
      "Fecha Ingreso",
      "Sueldo Base",
      "Presentismo",
      "Sueldo Diario",
      "Estado",
    ]],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [33, 33, 33] },
    columnStyles: {
      0: { cellWidth: 180 },
      1: { cellWidth: 80 },
      2: { cellWidth: 120 },
      3: { cellWidth: 90 },
      4: { cellWidth: 120 },
      5: { cellWidth: 100 },
      6: { cellWidth: 100 },
      7: { cellWidth: 80 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.getWidth();
      doc.setFontSize(9);
      doc.text(`Página ${data.pageNumber} de ${pageCount}`,
        pageWidth - 120,
        pageSize.getHeight() - 20);
    },
  });

  const safeName = fileName || `reporte_sueldos_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeName);
};
