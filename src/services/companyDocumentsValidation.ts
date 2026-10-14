export const COMPANY_DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const COMPANY_DOCUMENT_ACCEPT = Object.keys(ALLOWED_TYPES).join(",");

export function validateCompanyDocumentFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!ALLOWED_TYPES[file.type]) {
    return "Formato no permitido. Usá PDF, Word (DOCX) o imagen (JPG/PNG).";
  }
  if (file.size > COMPANY_DOCUMENT_MAX_SIZE) {
    return "El archivo supera el máximo de 10 MB.";
  }
  if (file.size === 0) {
    return "El archivo está vacío.";
  }
  return null;
}

export function getExtensionForMimeType(mimeType: string): string | null {
  return ALLOWED_TYPES[mimeType] ?? null;
}
