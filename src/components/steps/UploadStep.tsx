import { AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFDropzone } from "@/components/PDFDropzone";

interface UploadStepProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onProcesar: (files: File[]) => void;
  isLoading: boolean;
  error?: string;
}

export function UploadStep({ files, onFilesChange, onProcesar, isLoading, error }: UploadStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Cargar PDFs de recibos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Podés subir uno o varios PDFs en un mismo lote. El sistema detectará el tipo de recibo,
          el período y buscará al empleado correspondiente por CUIL o DNI.
        </p>
      </div>

      <PDFDropzone files={files} onChange={onFilesChange} disabled={isLoading} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => onProcesar(files)}
          disabled={files.length === 0 || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Procesar {files.length > 0 ? `(${files.length} PDF${files.length > 1 ? "s" : ""})` : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
