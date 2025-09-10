import { supabase } from "@/lib/supabase";

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  payrollId?: string; // Optional, for payroll-specific documents
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
  payrollId?: string; // Optional, for payroll-specific documents
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
      console.log("Starting document upload:", {
        employeeId: request.employeeId,
        fileName: request.file.name,
        fileSize: request.file.size,
        fileType: request.file.type,
        category: request.category,
      });

      const fileExt = request.file.name.split(".").pop();
      const fileName = `${request.employeeId}/${Date.now()}_${request.category}.${fileExt}`;

      console.log("Generated file path:", fileName);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, request.file);

      console.log("Storage upload result:", { uploadData, uploadError });

      if (uploadError) {
        console.error(
          "Storage upload error:",
          JSON.stringify(uploadError, null, 2),
        );
        throw new Error(
          `Storage upload failed: ${uploadError.message || uploadError.error || "Unknown storage error"}`,
        );
      }

      // Save document metadata to database (no need for public URL since we use signed URLs)
      const documentData = {
        employee_id: request.employeeId,
        payroll_id: request.payrollId || null,
        file_name: fileName,
        original_file_name: request.file.name,
        file_type: request.file.type,
        file_size: request.file.size,
        category: request.category,
        description: request.description,
        file_url: "", // No longer needed - we use signed URLs for downloads
        uploaded_by: "system", // TODO: Get from auth context
      };

      console.log("Inserting document metadata:", documentData);

      const { data, error } = await supabase
        .from("employee_documents")
        .insert(documentData)
        .select()
        .single();

      console.log("Database insert result:", { data, error });

      if (error) {
        console.error("Database insert error:", JSON.stringify(error, null, 2));

        // Handle specific database errors
        if (error.code === "42P01") {
          throw new Error(
            "La tabla de documentos no existe. Contacta al administrador para configurar el sistema.",
          );
        }

        throw new Error(
          `Database error: ${error.message || error.details || error.hint || "Unknown database error"}`,
        );
      }

      const result = this.mapFromSupabase(data);
      console.log("Document uploaded successfully:", result);
      return result;
    } catch (error) {
      console.error("Error uploading document:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Failed to upload document: ${error && typeof error === "object" ? JSON.stringify(error) : String(error)}`,
      );
    }
  }

  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    try {
      console.log("Fetching documents for employee:", employeeId);

      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .is("payroll_id", null) // Only get general employee documents (not payroll-specific)
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

  async getPayrollDocuments(payrollId: string): Promise<EmployeeDocument[]> {
    try {
      console.log("Fetching documents for payroll:", payrollId);

      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("payroll_id", payrollId)
        .order("uploaded_at", { ascending: false });

      console.log("Supabase payroll documents response:", { data, error });

      if (error) {
        console.error(
          "Supabase error details:",
          JSON.stringify(error, null, 2),
        );

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
        return [];
      }

      return data.map(this.mapFromSupabase);
    } catch (error) {
      console.error("Error fetching payroll documents:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Failed to fetch payroll documents: ${error && typeof error === "object" ? JSON.stringify(error) : String(error)}`,
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
      // Get the file name from the database
      const { data, error } = await supabase
        .from("employee_documents")
        .select("file_name, original_file_name")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching document metadata:", error);
        throw new Error("Document not found");
      }

      // Create a signed URL for download (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(data.file_name, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        throw new Error("Failed to create download URL");
      }

      console.log("Created signed URL for download:", signedUrlData.signedUrl);
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error("Error getting download URL:", error);
      if (error instanceof Error) {
        throw error;
      }
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

  async verifySetup(): Promise<{
    table: boolean;
    bucket: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let tableExists = false;
    let bucketExists = false;

    try {
      // Test table access
      const { error: tableError } = await supabase
        .from("employee_documents")
        .select("id")
        .limit(1);

      if (tableError) {
        if (tableError.code === "42P01") {
          errors.push("Tabla employee_documents no existe");
        } else {
          errors.push(`Error de tabla: ${tableError.message}`);
        }
      } else {
        tableExists = true;
      }
    } catch (error) {
      errors.push(`Error verificando tabla: ${error}`);
    }

    try {
      // Test bucket access
      const { data: buckets, error: bucketError } =
        await supabase.storage.listBuckets();

      if (bucketError) {
        errors.push(`Error accediendo storage: ${bucketError.message}`);
      } else {
        bucketExists =
          buckets?.some((bucket) => bucket.id === this.BUCKET_NAME) || false;
        if (!bucketExists) {
          errors.push(`Bucket '${this.BUCKET_NAME}' no existe`);
        }
      }
    } catch (error) {
      errors.push(`Error verificando bucket: ${error}`);
    }

    return { table: tableExists, bucket: bucketExists, errors };
  }

  private mapFromSupabase(data: any): EmployeeDocument {
    return {
      id: data.id,
      employeeId: data.employee_id,
      payrollId: data.payroll_id,
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
