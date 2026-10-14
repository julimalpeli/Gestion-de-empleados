import { useEffect, useMemo, useRef, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCompanyDocuments } from "@/hooks/use-company-documents";
import usePermissions from "@/hooks/use-permissions";
import {
  companyDocumentsService,
  type ActiveEmployee,
} from "@/services/companyDocumentsService";
import {
  COMPANY_DOCUMENT_ACCEPT,
  validateCompanyDocumentFile,
} from "@/services/companyDocumentsValidation";
import {
  COMPANY_DOCUMENT_CATEGORIES,
  type CompanyDocument,
  type CompanyDocumentCategory,
  type CompanyDocumentVersion,
  type DocumentSignature,
} from "@/types/companyDocuments";
import {
  Plus,
  Search,
  Download,
  Upload,
  History,
  PenLine,
  FileText,
} from "lucide-react";

const CATEGORY_LABELS: Record<CompanyDocumentCategory, string> = {
  reglamento: "Reglamentos",
  vacaciones: "Vacaciones",
  contrato: "Contratos",
  regla_interna: "Reglas internas",
  otro: "Otros",
};

type DialogState =
  | { kind: "create" }
  | { kind: "version"; documentId: string }
  | { kind: "history"; documentId: string }
  | { kind: "signatures"; documentId: string }
  | null;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR");

const openFile = async (filePath: string, onError: (message: string) => void) => {
  // Abrir la pestaña antes del await: Safari iOS bloquea window.open tras un await.
  const win = window.open("", "_blank");
  try {
    const url = await companyDocumentsService.getDownloadUrl(filePath);
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (err) {
    win?.close();
    onError(err instanceof Error ? err.message : "Error al abrir el archivo");
  }
};

export default function Documents() {
  const { hasPermission } = usePermissions();
  const { documents, loading, error, createDocument, addVersion } =
    useCompanyDocuments();
  const { toast } = useToast();

  const canCreate = hasPermission("documents", "create");
  const canEdit = hasPermission("documents", "edit");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<DialogState>(null);

  const notifyError = (message: string) =>
    toast({ title: "Error", description: message, variant: "destructive" });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (categoryFilter !== "all" && doc.category !== categoryFilter) return false;
      if (!term) return true;
      return (
        doc.title.toLowerCase().includes(term) ||
        (doc.description ?? "").toLowerCase().includes(term)
      );
    });
  }, [documents, search, categoryFilter]);

  const activeDocument = (documentId: string) =>
    documents.find((doc) => doc.id === documentId) ?? null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Documentos y Reglamentos</h1>
            <p className="text-sm text-muted-foreground">
              Reglamentos, vacaciones, contratos y reglas internas
            </p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo documento
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {COMPANY_DOCUMENT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando documentos...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay documentos para mostrar.
          </CardContent>
        </Card>
      ) : (
        COMPANY_DOCUMENT_CATEGORIES.map((category) => {
          const items = filtered.filter((doc) => doc.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category} className="space-y-3">
              <h2 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    canEdit={canEdit}
                    onNewVersion={() =>
                      setDialog({ kind: "version", documentId: doc.id })
                    }
                    onHistory={() =>
                      setDialog({ kind: "history", documentId: doc.id })
                    }
                    onSignatures={() =>
                      setDialog({ kind: "signatures", documentId: doc.id })
                    }
                    onError={notifyError}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      <CreateDocumentDialog
        open={dialog?.kind === "create"}
        onClose={() => setDialog(null)}
        onSubmit={async (values) => {
          await createDocument(values);
          toast({ title: "Documento creado" });
          setDialog(null);
        }}
      />

      {dialog?.kind === "version" && activeDocument(dialog.documentId) && (
        <NewVersionDialog
          doc={activeDocument(dialog.documentId)!}
          onClose={() => setDialog(null)}
          onSubmit={async (file, notes) => {
            await addVersion(dialog.documentId, file, notes);
            toast({ title: "Nueva versión cargada" });
            setDialog(null);
          }}
        />
      )}

      {dialog?.kind === "history" && activeDocument(dialog.documentId) && (
        <HistoryDialog
          doc={activeDocument(dialog.documentId)!}
          onClose={() => setDialog(null)}
          onError={notifyError}
        />
      )}

      {dialog?.kind === "signatures" && activeDocument(dialog.documentId) && (
        <SignaturesDialog
          doc={activeDocument(dialog.documentId)!}
          canEdit={canEdit}
          onClose={() => setDialog(null)}
          onError={notifyError}
          onSaved={() =>
            toast({ title: "Firma registrada" })
          }
        />
      )}
    </div>
  );
}

interface DocumentCardProps {
  doc: CompanyDocument;
  canEdit: boolean;
  onNewVersion: () => void;
  onHistory: () => void;
  onSignatures: () => void;
  onError: (message: string) => void;
}

function DocumentCard({
  doc,
  canEdit,
  onNewVersion,
  onHistory,
  onSignatures,
  onError,
}: DocumentCardProps) {
  const current = doc.currentVersion;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{doc.title}</h3>
            {doc.description && (
              <p className="text-sm text-muted-foreground">{doc.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {current && <Badge variant="secondary">v{current.versionNumber}</Badge>}
              {doc.requiresSignature && <Badge variant="outline">Requiere firma</Badge>}
              <span className="text-muted-foreground">
                Actualizado {formatDate(doc.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {current && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openFile(current.filePath, onError)}
            >
              <Download className="h-4 w-4 mr-2" />
              Ver / descargar
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onHistory}>
            <History className="h-4 w-4 mr-2" />
            Historial
          </Button>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onNewVersion}>
              <Upload className="h-4 w-4 mr-2" />
              Nueva versión
            </Button>
          )}
          {doc.requiresSignature && current && (
            <Button size="sm" variant="outline" onClick={onSignatures}>
              <PenLine className="h-4 w-4 mr-2" />
              Firmas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateDocumentDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    category: CompanyDocumentCategory;
    description?: string;
    requiresSignature: boolean;
    file: File;
    notes?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CompanyDocumentCategory>("reglamento");
  const [description, setDescription] = useState("");
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setCategory("reglamento");
      setDescription("");
      setRequiresSignature(false);
      setNotes("");
      setFile(null);
      setFormError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) return setFormError("Ingresá un título.");
    if (!file) return setFormError("Seleccioná un archivo.");
    const fileError = validateCompanyDocumentFile(file);
    if (fileError) return setFormError(fileError);

    try {
      setSaving(true);
      setFormError(null);
      await onSubmit({
        title,
        category,
        description,
        requiresSignature,
        file,
        notes,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear el documento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo documento</DialogTitle>
          <DialogDescription>
            Se guarda como versión 1. Para actualizarlo después, usá "Nueva versión".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Título</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as CompanyDocumentCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_DOCUMENT_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {CATEGORY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-description">Descripción (opcional)</Label>
            <Textarea
              id="doc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresSignature}
              onChange={(e) => setRequiresSignature(e.target.checked)}
              className="h-4 w-4"
            />
            Requiere firma de empleados
          </label>
          <div className="space-y-2">
            <Label htmlFor="doc-file">Archivo</Label>
            <Input
              id="doc-file"
              type="file"
              accept={COMPANY_DOCUMENT_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">PDF, Word o imagen (JPG/PNG), máximo 10 MB.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-notes">Notas (opcional)</Label>
            <Input id="doc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Crear documento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewVersionDialog({
  doc,
  onClose,
  onSubmit,
}: {
  doc: CompanyDocument;
  onClose: () => void;
  onSubmit: (file: File, notes?: string) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!file) return setFormError("Seleccioná un archivo.");
    const fileError = validateCompanyDocumentFile(file);
    if (fileError) return setFormError(fileError);

    try {
      setSaving(true);
      setFormError(null);
      await onSubmit(file, notes);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al subir la versión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva versión de "{doc.title}"</DialogTitle>
          <DialogDescription>
            La versión actual ({doc.currentVersion ? `v${doc.currentVersion.versionNumber}` : "sin archivo"})
            queda en el historial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="version-file">Archivo</Label>
            <Input
              id="version-file"
              type="file"
              accept={COMPANY_DOCUMENT_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="version-notes">Notas de cambio (opcional)</Label>
            <Input id="version-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Subiendo..." : "Subir versión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  doc,
  onClose,
  onError,
}: {
  doc: CompanyDocument;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de "{doc.title}"</DialogTitle>
          <DialogDescription>Todas las versiones cargadas, de la más reciente a la más antigua.</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {doc.versions.map((version: CompanyDocumentVersion) => (
            <li
              key={version.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  v{version.versionNumber}
                  {version.id === doc.currentVersionId && (
                    <Badge variant="secondary" className="ml-2">Actual</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {version.fileName} · {formatSize(version.size)} · {formatDate(version.uploadedAt)}
                </p>
                {version.notes && <p className="text-xs text-muted-foreground">{version.notes}</p>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openFile(version.filePath, onError)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SignaturesDialog({
  doc,
  canEdit,
  onClose,
  onError,
  onSaved,
}: {
  doc: CompanyDocument;
  canEdit: boolean;
  onClose: () => void;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const versionId = doc.currentVersionId;
  const [employees, setEmployees] = useState<ActiveEmployee[]>([]);
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingEmployeeId, setUploadingEmployeeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingEmployeeId = useRef<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activeEmployees, versionSignatures] = await Promise.all([
        companyDocumentsService.listActiveEmployees(),
        versionId ? companyDocumentsService.listSignatures(versionId) : Promise.resolve([]),
      ]);
      setEmployees(activeEmployees);
      setSignatures(versionSignatures);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al cargar firmas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  const handleFileChange = async (file: File | undefined) => {
    const employeeId = pendingEmployeeId.current;
    pendingEmployeeId.current = null;
    if (!file || !employeeId || !versionId) return;

    const fileError = validateCompanyDocumentFile(file);
    if (fileError) return onError(fileError);

    try {
      setUploadingEmployeeId(employeeId);
      await companyDocumentsService.uploadSignature(versionId, employeeId, file);
      await loadData();
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al subir la firma");
    } finally {
      setUploadingEmployeeId(null);
    }
  };

  const signatureFor = (employeeId: string) =>
    signatures.find((signature) => signature.employeeId === employeeId);

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Firmas de "{doc.title}"</DialogTitle>
          <DialogDescription>
            {doc.currentVersion
              ? `Firmas sobre la versión v${doc.currentVersion.versionNumber}. Subí el escaneo firmado de cada empleado.`
              : "El documento no tiene versión cargada."}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={COMPANY_DOCUMENT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            handleFileChange(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando empleados...</p>
        ) : (
          <ul className="space-y-2">
            {employees.map((employee) => {
              const signature = signatureFor(employee.id);
              return (
                <li
                  key={employee.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{employee.name}</p>
                    <Badge variant={signature ? "default" : "outline"} className="mt-1">
                      {signature ? `Firmado ${formatDate(signature.signedAt)}` : "Pendiente"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {signature && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openFile(signature.signedFilePath, onError)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && versionId && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={uploadingEmployeeId !== null}
                        onClick={() => {
                          pendingEmployeeId.current = employee.id;
                          fileInputRef.current?.click();
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingEmployeeId === employee.id
                          ? "Subiendo..."
                          : signature
                            ? "Reemplazar"
                            : "Subir firma"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
