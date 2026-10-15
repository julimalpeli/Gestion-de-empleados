import { supabase } from "@/lib/supabase";
import type {
  CompanyDocument,
  CompanyDocumentCategory,
  CompanyDocumentVersion,
  DocumentSignature,
} from "@/types/companyDocuments";
import {
  getExtensionForMimeType,
  validateCompanyDocumentFile,
} from "@/services/companyDocumentsValidation";

const BUCKET_NAME = "company-documents";
const SIGNED_URL_TTL_SECONDS = 3600;

export interface CreateCompanyDocumentRequest {
  title: string;
  category: CompanyDocumentCategory;
  description?: string;
  requiresSignature: boolean;
  file: File;
  notes?: string;
}

export interface ActiveEmployee {
  id: string;
  name: string;
}

const assertValidFile = (file: File) => {
  const error = validateCompanyDocumentFile(file);
  if (error) throw new Error(error);
  const extension = getExtensionForMimeType(file.type);
  if (!extension) throw new Error("Formato no permitido.");
  return extension;
};

const mapVersion = (row: any): CompanyDocumentVersion => ({
  id: row.id,
  documentId: row.document_id,
  versionNumber: row.version_number,
  filePath: row.file_path,
  fileName: row.file_name,
  mimeType: row.mime_type,
  size: Number(row.size),
  notes: row.notes ?? undefined,
  uploadedBy: row.uploaded_by ?? undefined,
  uploadedAt: row.uploaded_at,
});

const mapSignature = (row: any): DocumentSignature => ({
  id: row.id,
  documentVersionId: row.document_version_id,
  employeeId: row.employee_id,
  signedFilePath: row.signed_file_path,
  signedFileName: row.signed_file_name,
  mimeType: row.mime_type,
  size: Number(row.size),
  signedAt: row.signed_at,
});

const mapDocument = (row: any): CompanyDocument => {
  const versions: CompanyDocumentVersion[] = (row.versions ?? [])
    .map(mapVersion)
    .sort((a: CompanyDocumentVersion, b: CompanyDocumentVersion) => b.versionNumber - a.versionNumber);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description ?? undefined,
    requiresSignature: row.requires_signature,
    currentVersionId: row.current_version_id ?? undefined,
    currentVersion: versions.find((v) => v.id === row.current_version_id),
    versions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const uploadFile = async (path: string, file: File) => {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);
};

const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

export const companyDocumentsService = {
  async listDocuments(): Promise<CompanyDocument[]> {
    const { data, error } = await supabase
      .from("company_documents")
      .select("*, versions:company_document_versions!document_id(*)")
      .order("title", { ascending: true });

    if (error) throw new Error(`Error al cargar documentos: ${error.message}`);
    return (data ?? []).map(mapDocument);
  },

  async createDocument(request: CreateCompanyDocumentRequest): Promise<string> {
    const extension = assertValidFile(request.file);
    const documentId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const filePath = `${documentId}/v1/${versionId}.${extension}`;
    const uploadedBy = await getCurrentUserId();

    await uploadFile(filePath, request.file);

    const { error: documentError } = await supabase
      .from("company_documents")
      .insert({
        id: documentId,
        title: request.title.trim(),
        category: request.category,
        description: request.description?.trim() || null,
        requires_signature: request.requiresSignature,
        created_by: uploadedBy,
      });

    if (documentError) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      throw new Error(`No se pudo crear el documento: ${documentError.message}`);
    }

    const { error: versionError } = await supabase
      .from("company_document_versions")
      .insert({
        id: versionId,
        document_id: documentId,
        version_number: 1,
        file_path: filePath,
        file_name: request.file.name,
        mime_type: request.file.type,
        size: request.file.size,
        notes: request.notes?.trim() || null,
        uploaded_by: uploadedBy,
      });

    if (versionError) {
      throw new Error(`No se pudo registrar la versión: ${versionError.message}`);
    }

    const { error: pointerError } = await supabase
      .from("company_documents")
      .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
      .eq("id", documentId);

    if (pointerError) {
      throw new Error(`No se pudo asociar la versión: ${pointerError.message}`);
    }

    return documentId;
  },

  async addVersion(
    documentId: string,
    file: File,
    notes?: string,
  ): Promise<void> {
    const extension = assertValidFile(file);

    const { data: latest, error: latestError } = await supabase
      .from("company_document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      throw new Error(`No se pudo calcular la versión: ${latestError.message}`);
    }

    const versionNumber = (latest?.version_number ?? 0) + 1;
    const versionId = crypto.randomUUID();
    const filePath = `${documentId}/v${versionNumber}/${versionId}.${extension}`;
    const uploadedBy = await getCurrentUserId();

    await uploadFile(filePath, file);

    const { error: versionError } = await supabase
      .from("company_document_versions")
      .insert({
        id: versionId,
        document_id: documentId,
        version_number: versionNumber,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        size: file.size,
        notes: notes?.trim() || null,
        uploaded_by: uploadedBy,
      });

    if (versionError) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      throw new Error(`No se pudo registrar la versión: ${versionError.message}`);
    }

    const { error: pointerError } = await supabase
      .from("company_documents")
      .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
      .eq("id", documentId);

    if (pointerError) {
      throw new Error(`No se pudo actualizar el documento: ${pointerError.message}`);
    }
  },

  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

    if (error || !data) {
      throw new Error("No se pudo generar el enlace de descarga.");
    }
    return data.signedUrl;
  },

  async listSignatures(versionId: string): Promise<DocumentSignature[]> {
    const { data, error } = await supabase
      .from("company_document_signatures")
      .select("*")
      .eq("document_version_id", versionId);

    if (error) throw new Error(`Error al cargar firmas: ${error.message}`);
    return (data ?? []).map(mapSignature);
  },

  async uploadSignature(
    versionId: string,
    employeeId: string,
    file: File,
  ): Promise<void> {
    const extension = assertValidFile(file);
    const filePath = `signatures/${versionId}/${employeeId}_${Date.now()}.${extension}`;
    const uploadedBy = await getCurrentUserId();

    const { data: existing, error: existingError } = await supabase
      .from("company_document_signatures")
      .select("signed_file_path")
      .eq("document_version_id", versionId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`No se pudo verificar la firma: ${existingError.message}`);
    }

    await uploadFile(filePath, file);

    const { error } = await supabase
      .from("company_document_signatures")
      .upsert(
        {
          document_version_id: versionId,
          employee_id: employeeId,
          signed_file_path: filePath,
          signed_file_name: file.name,
          mime_type: file.type,
          size: file.size,
          signed_at: new Date().toISOString(),
          uploaded_by: uploadedBy,
        },
        { onConflict: "document_version_id,employee_id" },
      );

    if (error) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      throw new Error(`No se pudo registrar la firma: ${error.message}`);
    }

    if (existing?.signed_file_path) {
      await supabase.storage.from(BUCKET_NAME).remove([existing.signed_file_path]);
    }
  },

  async listActiveEmployees(): Promise<ActiveEmployee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw new Error(`Error al cargar empleados: ${error.message}`);
    return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
  },
};
