import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, X, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PDFDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function PDFDropzone({ files, onChange, disabled }: PDFDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      // Merge new files (avoid duplicates by name)
      const existing = new Set(files.map((f) => f.name));
      const newFiles = accepted.filter((f) => !existing.has(f.name));
      onChange([...files, ...newFiles]);
    },
    [files, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    disabled,
    multiple: true,
  });

  const remove = (name: string) => {
    onChange(files.filter((f) => f.name !== name));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">
            {isDragActive ? "Sueltá los archivos acá" : "Arrastrá PDFs o hacé click para seleccionar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Podés cargar múltiples PDFs a la vez
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 shrink-0 text-red-500" />
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => { e.stopPropagation(); remove(file.name); }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
