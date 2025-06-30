import { useState, useEffect } from "react";
import {
  documentService,
  type EmployeeDocument,
  type CreateDocumentRequest,
} from "@/services/documentService";

export const useDocuments = (employeeId?: string) => {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async (empId?: string) => {
    if (!empId && !employeeId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await documentService.getEmployeeDocuments(
        empId || employeeId!,
      );
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading documents");
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (request: CreateDocumentRequest) => {
    try {
      setError(null);
      const newDocument = await documentService.uploadDocument(request);
      setDocuments((prev) => [newDocument, ...prev]);
      return newDocument;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error uploading document";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      setError(null);
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error deleting document";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const downloadDocument = async (id: string, fileName: string) => {
    try {
      const url = await documentService.downloadDocument(id);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error downloading document";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return documentService.getCategoryDisplayName(category);
  };

  useEffect(() => {
    if (employeeId) {
      fetchDocuments(employeeId);
    }
  }, [employeeId]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getCategoryDisplayName,
  };
};
