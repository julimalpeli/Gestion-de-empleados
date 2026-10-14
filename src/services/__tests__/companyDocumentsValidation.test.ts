import { describe, it, expect } from "vitest";
import {
  COMPANY_DOCUMENT_MAX_SIZE,
  getExtensionForMimeType,
  validateCompanyDocumentFile,
} from "@/services/companyDocumentsValidation";

describe("validateCompanyDocumentFile", () => {
  it("acepta PDF, DOCX, JPG y PNG dentro del límite", () => {
    const types = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];
    for (const type of types) {
      expect(validateCompanyDocumentFile({ type, size: 1024 })).toBeNull();
    }
  });

  it("rechaza tipos no permitidos", () => {
    expect(validateCompanyDocumentFile({ type: "application/x-msdownload", size: 1024 })).not.toBeNull();
    expect(validateCompanyDocumentFile({ type: "text/plain", size: 1024 })).not.toBeNull();
  });

  it("acepta exactamente 10 MB y rechaza un byte más", () => {
    expect(
      validateCompanyDocumentFile({ type: "application/pdf", size: COMPANY_DOCUMENT_MAX_SIZE }),
    ).toBeNull();
    expect(
      validateCompanyDocumentFile({ type: "application/pdf", size: COMPANY_DOCUMENT_MAX_SIZE + 1 }),
    ).not.toBeNull();
  });

  it("rechaza archivos vacíos", () => {
    expect(validateCompanyDocumentFile({ type: "application/pdf", size: 0 })).not.toBeNull();
  });
});

describe("getExtensionForMimeType", () => {
  it("devuelve la extensión de cada tipo permitido", () => {
    expect(getExtensionForMimeType("application/pdf")).toBe("pdf");
    expect(getExtensionForMimeType("image/jpeg")).toBe("jpg");
    expect(getExtensionForMimeType("image/png")).toBe("png");
  });

  it("devuelve null para tipos desconocidos", () => {
    expect(getExtensionForMimeType("text/html")).toBeNull();
  });
});
