import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileText,
  Download,
  Trash2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import type { Employee } from "@/services/interfaces";

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const DOCUMENT_CATEGORIES = [
  { value: "recibo_sueldo", label: "Recibo de Sueldo" },
  { value: "sac", label: "SAC" },
  { value: "documentos", label: "Documentos" },
  { value: "formularios", label: "Formularios" },
  { value: "otros", label: "Otros Documentos" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export default function DocumentManager({
  isOpen,
  onClose,
  employee,
}: DocumentManagerProps) {
  const {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getCategoryDisplayName,
  } = useDocuments(employee?.id);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    category: "",
    description: "",
  });
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert("El archivo es demasiado grande. Máximo 10MB.");
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(
        "Tipo de archivo no permitido. Solo se permiten PDF, imágenes, Word y Excel.",
      );
      return;
    }

    setUploadForm({ ...uploadForm, file });
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.category || !employee) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setIsUploading(true);
      await uploadDocument({
        employeeId: employee.id,
        file: uploadForm.file,
        category: uploadForm.category as any,
        description: uploadForm.description,
      });

      // Reset form
      setUploadForm({ file: null, category: "", description: "" });
      setShowUploadForm(false);

      // Reset file input
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Error al subir el documento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${fileName}"?`)) {
      try {
        await deleteDocument(id);
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Error al eliminar el documento");
      }
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      await downloadDocument(id, fileName);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Error al descargar el documento");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      recibo_sueldo: "bg-green-100 text-green-800",
      sac: "bg-blue-100 text-blue-800",
      documentos: "bg-purple-100 text-purple-800",
      formularios: "bg-orange-100 text-orange-800",
      otros: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.otros;
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos de {employee.name}
          </DialogTitle>
          <DialogDescription>
            Gestiona los documentos y archivos del empleado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Subir Documento</h3>
              <Button
                onClick={() => setShowUploadForm(!showUploadForm)}
                variant={showUploadForm ? "outline" : "default"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {showUploadForm ? "Cancelar" : "Nuevo Documento"}
              </Button>
            </div>

            {showUploadForm && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">
                      Archivo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo 10MB. Formatos: PDF, imágenes, Word, Excel
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Categoría <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={uploadForm.category}
                      onValueChange={(value) =>
                        setUploadForm({ ...uploadForm, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del documento..."
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={
                      !uploadForm.file || !uploadForm.category || isUploading
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Subiendo..." : "Subir Documento"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Documents List */}
          <div>
            <h3 className="font-medium mb-4">
              Documentos ({documents.length})
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <p>Cargando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No hay documentos subidos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.originalFileName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getCategoryBadgeColor(doc.category)}
                            variant="secondary"
                          >
                            {getCategoryDisplayName(doc.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {doc.description || "-"}
                        </TableCell>
                        <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownload(doc.id, doc.originalFileName)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(doc.id, doc.originalFileName)
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
