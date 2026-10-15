import { supabase } from "@/lib/supabase";
import { documentService } from "@/services/documentService";
import { separarPaginasRecibos } from "@/services/recibosService";
import type { AttachResult, ReceiptPage } from "@/types/recibos";

export async function adjuntarRecibosALiquidaciones(files: File[]): Promise<AttachResult[]> {
  const results: AttachResult[] = [];

  for (const file of files) {
    const pages = await separarPaginasRecibos(file);
    for (const page of pages) {
      results.push(await adjuntarPagina(page));
    }
  }

  return results;
}

async function adjuntarPagina(page: ReceiptPage): Promise<AttachResult> {
  const base = {
    fileName: page.file_name,
    employeeName: page.employee?.name,
    period: page.period,
  };

  if (!page.employee) return { ...base, status: "sin-empleado" };
  if (!page.period) return { ...base, status: "sin-periodo" };

  const { data: payroll, error: payrollError } = await supabase
    .from("payroll_records")
    .select("id")
    .eq("employee_id", page.employee.id)
    .eq("period", page.period)
    .maybeSingle();

  if (payrollError) throw new Error(`Error buscando liquidación: ${payrollError.message}`);
  if (!payroll) return { ...base, status: "sin-liquidacion" };

  const { data: existing, error: existingError } = await supabase
    .from("employee_documents")
    .select("id")
    .eq("payroll_id", payroll.id)
    .eq("category", "recibo_sueldo")
    .eq("original_file_name", page.file_name)
    .limit(1);

  if (existingError) throw new Error(`Error verificando duplicados: ${existingError.message}`);
  if (existing && existing.length > 0) return { ...base, status: "duplicado" };

  const file = new File([base64ToBlob(page.pdf_base64, "application/pdf")], page.file_name, {
    type: "application/pdf",
  });

  await documentService.uploadDocument({
    employeeId: page.employee.id,
    payrollId: payroll.id,
    file,
    category: "recibo_sueldo",
    description: "Recibo importado desde Envío de Recibos",
  });

  return { ...base, status: "adjuntado" };
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}
