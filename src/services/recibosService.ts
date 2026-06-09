import type { ProcessedReceipt, SendResult, BatchHistory } from "@/types/recibos";

const API_BASE = import.meta.env.VITE_RECIBOS_API_URL || "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Error ${res.status}`);
  }
  return res.json();
}

/**
 * Check if the Python API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Process PDFs and enrich with employee data from Supabase.
 * Returns one entry per uploaded file.
 */
export async function procesarPDFs(files: File[]): Promise<ProcessedReceipt[]> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  const res = await fetch(`${API_BASE}/api/pdf/separar-y-enriquecer`, {
    method: "POST",
    body: form,
  });

  const data = await handleResponse<ProcessedReceipt[]>(res);
  return data.map((r) => ({ ...r, selected: true }));
}

/**
 * Send selected receipts to employees via email.
 * Receipts without a matched employee are skipped.
 */
export async function enviarRecibos(
  receipts: ProcessedReceipt[],
  signatureFile?: File
): Promise<SendResult> {
  const form = new FormData();
  const batchId = crypto.randomUUID();

  const receiptData = receipts
    .filter((r) => r.selected && r.employee?.email)
    .map((r) => ({
      employee_id: r.employee!.id,
      email: r.employee!.email!,
      employee_name: r.employee!.name,
      period: r.period,
      cuil: r.cuil,
      receipt_type: r.receipt_type,
    }));

  form.append("batch_id", batchId);
  form.append("include_signature", signatureFile ? "true" : "false");
  form.append("receipt_data", JSON.stringify(receiptData));

  if (signatureFile) {
    form.append("signature_file", signatureFile);
  }

  const res = await fetch(`${API_BASE}/api/envio/enviar`, {
    method: "POST",
    body: form,
  });

  return handleResponse<SendResult>(res);
}

/**
 * Get all batch sending history
 */
export async function obtenerHistorial(): Promise<BatchHistory[]> {
  const res = await fetch(`${API_BASE}/api/envio/historial`);
  const data = await handleResponse<{ batches: BatchHistory[] }>(res);
  return data.batches ?? [];
}

/**
 * Get detailed records for a specific batch
 */
export async function obtenerBatch(batchId: string): Promise<BatchHistory> {
  const res = await fetch(`${API_BASE}/api/envio/historial?batch_id=${batchId}`);
  const data = await handleResponse<{ batch: BatchHistory; records: any[] }>(res);
  return { ...data.batch, records: data.records };
}

/**
 * Retry failed sends for a batch
 */
export async function reintentar(batchId: string): Promise<{
  retried_count: number;
  success_count: number;
  still_failed_count: number;
}> {
  const res = await fetch(`${API_BASE}/api/envio/reintentar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batch_id: batchId }),
  });
  return handleResponse(res);
}
