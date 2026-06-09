export type ReceiptType = "normal" | "aguinaldo" | "retenciones";
export type SendStatus = "pending" | "sent" | "failed";
export type StepStatus = "ready" | "no-match" | "processing" | "error";

export interface EmployeeMatch {
  id: string;
  name: string;
  email?: string;
  cuil?: string;
  dni?: string;
}

export interface ProcessedReceipt {
  file_name: string;
  receipt_type: ReceiptType;
  period?: string;
  cuil?: string;
  dni?: string;
  employee?: EmployeeMatch;
  total_amount?: number;
  extracted_text?: string;
  status: StepStatus;
  /** Base64-encoded PDF bytes, used for sending */
  pdf_base64?: string;
  /** Whether this receipt is selected to be sent */
  selected: boolean;
}

export interface SendResult {
  batch_id: string;
  total_sent: number;
  total_failed: number;
  messages: string[];
}

export interface BatchRecord {
  batch_id: string;
  employee_name: string;
  email: string;
  period?: string;
  file_path?: string;
  status: SendStatus;
  sent_at?: string;
  error_message?: string;
  attempts: number;
}

export interface BatchHistory {
  batch_id: string;
  created_at: string;
  total_receipts: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  status: string;
  records?: BatchRecord[];
}

export type WorkflowStep = 1 | 2 | 3 | 4 | 5;

export interface RecibosWorkflowState {
  currentStep: WorkflowStep;
  uploadedFiles: File[];
  processedReceipts: ProcessedReceipt[];
  sendResult?: SendResult;
  batchHistory: BatchHistory[];
  isLoading: boolean;
  error?: string;
}
