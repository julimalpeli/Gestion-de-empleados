import { supabase } from "@/lib/supabase";

export const checkDocumentSystemAvailability = async () => {
  console.log("🔍 Checking document system availability...");

  try {
    // Check if employee_documents table exists
    const { data: employeeDocsData, error: employeeDocsError } = await supabase
      .from("employee_documents")
      .select("count")
      .limit(1);

    const employeeDocsAvailable = !employeeDocsError;

    // Check if files table exists and is accessible
    const { data: filesData, error: filesError } = await supabase
      .from("files")
      .select("count")
      .limit(1);

    const filesTableAvailable = !filesError;

    // Check storage bucket availability
    let storageAvailable = false;
    try {
      const { data: buckets, error: bucketError } =
        await supabase.storage.listBuckets();
      storageAvailable =
        !bucketError &&
        buckets?.some((bucket) => bucket.name === "employee-documents");
    } catch (storageError) {
      console.warn("Storage check failed:", storageError);
    }

    const result = {
      employeeDocsTable: employeeDocsAvailable,
      filesTable: filesTableAvailable,
      storage: storageAvailable,
      hasAnyDocumentSystem: employeeDocsAvailable || filesTableAvailable,
      isFullyConfigured: employeeDocsAvailable && storageAvailable,
    };

    console.log("📊 Document system availability:", result);
    return result;
  } catch (error) {
    console.error("❌ Error checking document system:", error);
    return {
      employeeDocsTable: false,
      filesTable: false,
      storage: false,
      hasAnyDocumentSystem: false,
      isFullyConfigured: false,
      error: error.message,
    };
  }
};

export const getDocumentSystemStatus = async () => {
  const availability = await checkDocumentSystemAvailability();

  if (availability.error) {
    return {
      status: "error",
      message: "Error al verificar el sistema de documentos",
      canShowDocuments: false,
    };
  }

  if (!availability.hasAnyDocumentSystem) {
    return {
      status: "not_configured",
      message: "El sistema de documentos será configurado próximamente",
      canShowDocuments: false,
    };
  }

  if (availability.filesTable && !availability.employeeDocsTable) {
    return {
      status: "partial",
      message: "Sistema de documentos en configuración",
      canShowDocuments: true,
    };
  }

  if (availability.isFullyConfigured) {
    return {
      status: "ready",
      message: "Sistema de documentos configurado",
      canShowDocuments: true,
    };
  }

  return {
    status: "partial",
    message: "Sistema de documentos parcialmente configurado",
    canShowDocuments: true,
  };
};

// Make functions globally available for debugging
if (typeof window !== "undefined") {
  (window as any).checkDocumentSystemAvailability =
    checkDocumentSystemAvailability;
  (window as any).getDocumentSystemStatus = getDocumentSystemStatus;

  console.log("🔧 Document system checker functions loaded:");
  console.log("   - checkDocumentSystemAvailability()");
  console.log("   - getDocumentSystemStatus()");
}
