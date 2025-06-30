import { supabase } from "@/lib/supabase";

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  category: "recibo_sueldo" | "sac" | "documentos" | "formularios" | "otros";
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl: string;
}

export interface CreateDocumentRequest {
  employeeId: string;
  file: File;
  category: "recibo_sueldo" | "sac" | "documentos" | "formularios" | "otros";
  description?: string;
}

class DocumentService {
  private readonly BUCKET_NAME = "employee-documents";

  async uploadDocument(
    request: CreateDocumentRequest,
  ): Promise<EmployeeDocument> {
    try {
      const fileExt = request.file.name.split(".").pop();
      const fileName = `${request.employeeId}/${Date.now()}_${request.category}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, request.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

      // Save document metadata to database
      const { data, error } = await supabase
        .from("employee_documents")
        .insert({
          employee_id: request.employeeId,
          file_name: fileName,
          original_file_name: request.file.name,
          file_type: request.file.type,
          file_size: request.file.size,
          category: request.category,
          description: request.description,
          file_url: publicUrl,
          uploaded_by: "system", // TODO: Get from auth context
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapFromSupabase(data);
    } catch (error) {
      console.error("Error uploading document:", error);
      throw new Error("Failed to upload document");
    }
  }

  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    try {
      console.log("Fetching documents for employee:", employeeId);

      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .order("uploaded_at", { ascending: false });

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error(
          "Supabase error details:",
          JSON.stringify(error, null, 2),
        );

        // Handle table not exists error
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          console.log(
            "employee_documents table does not exist yet, returning empty array",
          );
          return [];
        }

        throw new Error(
          `Database error: ${error.message || error.details || error.hint || "Unknown error"}`,
        );
      }

      if (!data) {
        console.log("No data returned, returning empty array");
        return [];
      }

      const mappedData = data.map(this.mapFromSupabase);
      console.log("Mapped documents:", mappedData);
      return mappedData;
    } catch (error) {
      console.error("Error fetching documents:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Failed to fetch documents: ${error && typeof error === "object" ? JSON.stringify(error) : String(error)}`,
      );
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from("employee_documents")
        .select("file_name")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([document.file_name]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw new Error("Failed to delete document");
    }
  }

  async downloadDocument(id: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("employee_documents")
        .select("file_url, original_file_name")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data.file_url;
    } catch (error) {
      console.error("Error getting download URL:", error);
      throw new Error("Failed to get download URL");
    }
  }

  getCategoryDisplayName(category: string): string {
    const categoryNames = {
      recibo_sueldo: "Recibo de Sueldo",
      sac: "SAC",
      documentos: "Documentos",
      formularios: "Formularios",
      otros: "Otros Documentos",
    };
    return categoryNames[category] || category;
  }

  private mapFromSupabase(data: any): EmployeeDocument {
    return {
      id: data.id,
      employeeId: data.employee_id,
      fileName: data.file_name,
      originalFileName: data.original_file_name,
      fileType: data.file_type,
      fileSize: data.file_size,
      category: data.category,
      description: data.description,
      uploadedAt: data.uploaded_at,
      uploadedBy: data.uploaded_by,
      fileUrl: data.file_url,
    };
  }
}

export const documentService = new DocumentService();
