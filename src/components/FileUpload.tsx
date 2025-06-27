import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  Plus,
  Calendar,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useFiles, { FileDocument } from "@/hooks/use-files";
import { useAuth } from "@/hooks/use-auth";

interface FileDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: string;
  description?: string;
  category: "payroll" | "personal" | "contract" | "other";
}

interface FileUploadProps {
  entityId: number;
  entityType: "employee" | "payroll";
  title: string;
  description?: string;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  onFileUploaded?: (file: FileDocument) => void;
  existingFiles?: FileDocument[];
}

const FileUpload = ({
  entityId,
  entityType,
  title,
  description,
  allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"],
  maxSize = 10,
  onFileUploaded,
  existingFiles = [],
}: FileUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileDocument[]>(existingFiles);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = async (fileList: File[]) => {
    setError("");

    for (const file of fileList) {
      // Validate file type
      const isValidType = allowedTypes.some((type) =>
        file.name.toLowerCase().endsWith(type.toLowerCase().replace(".", "")),
      );

      if (!isValidType) {
        setError(
          `Tipo de archivo no permitido: ${file.name}. Tipos permitidos: ${allowedTypes.join(", ")}`,
        );
        continue;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(
          `Archivo muy grande: ${file.name}. Tamaño máximo: ${maxSize}MB`,
        );
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      // Simulate file upload (in real app, upload to server/cloud storage)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newFile: FileDocument = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // In real app, this would be the server URL
        uploadDate: new Date().toISOString(),
        category: entityType === "payroll" ? "payroll" : "personal",
      };

      setFiles((prev) => [...prev, newFile]);
      onFileUploaded?.(newFile);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setError("Error al subir el archivo. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    // In real app, also delete from server
  };

  const handleDownload = (file: FileDocument) => {
    // Create download link
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop();
    if (extension === "pdf") {
      return <FileText className="h-4 w-4 text-red-600" />;
    } else if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) {
      return <Image className="h-4 w-4 text-blue-600" />;
    }
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          {files.length > 0 ? `${files.length} archivos` : "Subir archivos"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Arrastra archivos aquí o haz click para seleccionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Tipos permitidos: {allowedTypes.join(", ")} | Tamaño máximo:{" "}
                  {maxSize}MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Seleccionar archivos
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allowedTypes.join(",")}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {uploading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Subiendo archivo...</span>
              </div>
            )}
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Archivos ({files.length})
                </h3>
                <Badge variant="secondary">
                  Total:{" "}
                  {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.name)}
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(file.uploadDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              file.category === "payroll"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {file.category === "payroll"
                              ? "Liquidación"
                              : "Personal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(file.id)}
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUpload;
