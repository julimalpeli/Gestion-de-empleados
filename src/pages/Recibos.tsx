import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Upload, ScanSearch, Eye, CheckCircle, Send, WifiOff, AlertTriangle } from "lucide-react";
import { useRecibosWorkflow } from "@/hooks/useRecibosWorkflow";
import { UploadStep } from "@/components/steps/UploadStep";
import { PreviewStep } from "@/components/steps/PreviewStep";
import { ConfirmStep } from "@/components/steps/ConfirmStep";
import { SendStep } from "@/components/steps/SendStep";
import { checkApiHealth } from "@/services/recibosService";
import type { ApiStatus } from "@/services/recibosService";
import type { WorkflowStep } from "@/types/recibos";

const STEPS: { id: WorkflowStep; label: string; icon: React.ElementType }[] = [
  { id: 1, label: "Cargar", icon: Upload },
  { id: 2, label: "Detectar", icon: ScanSearch },
  { id: 3, label: "Revisar", icon: Eye },
  { id: 4, label: "Confirmar", icon: CheckCircle },
  { id: 5, label: "Historial", icon: Send },
];

export default function Recibos() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  // Local file state, isolated from the workflow hook so reset works cleanly
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  const {
    currentStep,
    processedReceipts,
    sendResult,
    batchHistory,
    isLoading,
    error,
    handleProcesar,
    toggleSelection,
    selectAll,
    handleEnviar,
    loadHistorial,
    handleReintentar,
    goToStep,
    reset,
  } = useRecibosWorkflow();

  // Check if Python API is reachable on mount
  useEffect(() => {
    checkApiHealth().then(setApiStatus);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Envío de Recibos</h1>
          <p className="text-sm text-muted-foreground">
            Procesá y enviá recibos de sueldo por email a los empleados
          </p>
        </div>

        {apiStatus === null && (
          <Badge variant="outline" className="text-muted-foreground">
            Verificando API…
          </Badge>
        )}
        {apiStatus === "online" && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✓ API conectada
          </Badge>
        )}
        {apiStatus === "cors-error" && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
            <AlertTriangle className="h-3 w-3" />
            API online · CORS pendiente
          </Badge>
        )}
        {apiStatus === "offline" && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
            <WifiOff className="h-3 w-3" />
            API offline
          </Badge>
        )}
      </div>

      {/* CORS error banner */}
      {apiStatus === "cors-error" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            La API está online pero falta configurar CORS. Ejecutá{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">fly deploy</code>{" "}
            desde tu terminal para aplicar la corrección. Mientras tanto, la carga de PDFs
            puede fallar desde el browser.
          </AlertDescription>
        </Alert>
      )}

      {/* API offline banner */}
      {apiStatus === "offline" && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            La API no responde en{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {import.meta.env.VITE_RECIBOS_API_URL || "http://localhost:8000"}
            </code>
            . Verificá que el servidor esté corriendo.
          </AlertDescription>
        </Alert>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isReachable = step.id === 1 || step.id === 5 || currentStep >= step.id;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isReachable && goToStep(step.id)}
                disabled={!isReachable}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "text-primary hover:bg-primary/10 cursor-pointer",
                  !isCurrent && !isCompleted && "text-muted-foreground cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
                {isCompleted && !isCurrent && (
                  <span className="hidden sm:inline text-xs">✓</span>
                )}
              </button>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "h-px w-8 mx-1 shrink-0",
                  currentStep > step.id ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {currentStep === 1 && (
          <UploadStep
            files={localFiles}
            onFilesChange={setLocalFiles}
            onProcesar={(files) => {
              handleProcesar(files);
            }}
            isLoading={isLoading}
            error={error}
          />
        )}

        {currentStep === 3 && (
          <PreviewStep
            receipts={processedReceipts}
            onToggle={toggleSelection}
            onSelectAll={selectAll}
            onNext={() => goToStep(4)}
            onBack={() => goToStep(1)}
          />
        )}

        {currentStep === 4 && (
          <ConfirmStep
            receipts={processedReceipts}
            onEnviar={handleEnviar}
            onBack={() => goToStep(3)}
            isLoading={isLoading}
          />
        )}

        {currentStep === 5 && (
          <SendStep
            sendResult={sendResult}
            batchHistory={batchHistory}
            isLoading={isLoading}
            onLoadHistorial={loadHistorial}
            onReintentar={handleReintentar}
            onNuevoLote={() => { reset(); setLocalFiles([]); }}
          />
        )}
      </div>
    </div>
  );
}
