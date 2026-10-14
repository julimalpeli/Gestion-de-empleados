import { useCallback, useEffect, useState } from "react";
import {
  companyDocumentsService,
  type CreateCompanyDocumentRequest,
} from "@/services/companyDocumentsService";
import type { CompanyDocument } from "@/types/companyDocuments";

export const useCompanyDocuments = () => {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDocuments(await companyDocumentsService.listDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDocument = async (request: CreateCompanyDocumentRequest) => {
    const id = await companyDocumentsService.createDocument(request);
    await refresh();
    return id;
  };

  const addVersion = async (documentId: string, file: File, notes?: string) => {
    await companyDocumentsService.addVersion(documentId, file, notes);
    await refresh();
  };

  return { documents, loading, error, refresh, createDocument, addVersion };
};
