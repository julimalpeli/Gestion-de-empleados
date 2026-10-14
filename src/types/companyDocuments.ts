export const COMPANY_DOCUMENT_CATEGORIES = [
  "reglamento",
  "vacaciones",
  "contrato",
  "regla_interna",
  "otro",
] as const;

export type CompanyDocumentCategory =
  (typeof COMPANY_DOCUMENT_CATEGORIES)[number];

export interface CompanyDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  notes?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface CompanyDocument {
  id: string;
  title: string;
  category: CompanyDocumentCategory;
  description?: string;
  requiresSignature: boolean;
  currentVersionId?: string;
  currentVersion?: CompanyDocumentVersion;
  versions: CompanyDocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSignature {
  id: string;
  documentVersionId: string;
  employeeId: string;
  signedFilePath: string;
  signedFileName: string;
  mimeType: string;
  size: number;
  signedAt: string;
}
