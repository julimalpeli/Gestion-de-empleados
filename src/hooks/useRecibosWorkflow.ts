import { useState, useCallback } from "react";
import type { ProcessedReceipt, WorkflowStep, SendResult, BatchHistory } from "@/types/recibos";
import { procesarPDFs, enviarRecibos, obtenerHistorial, reintentar } from "@/services/recibosService";
import { toast } from "@/hooks/use-toast";

export function useRecibosWorkflow() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedReceipts, setProcessedReceipts] = useState<ProcessedReceipt[]>([]);
  const [sendResult, setSendResult] = useState<SendResult | undefined>();
  const [batchHistory, setBatchHistory] = useState<BatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  /** Step 1 → 2: Upload files and process them */
  const handleProcesar = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setIsLoading(true);
    setError(undefined);

    try {
      setUploadedFiles(files);
      const receipts = await procesarPDFs(files);
      setProcessedReceipts(receipts);
      setCurrentStep(3); // jump straight to preview with enriched data
    } catch (err: any) {
      const msg = err.message || "Error al procesar los PDFs";
      setError(msg);
      toast({ title: "Error al procesar PDFs", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Toggle selection of a receipt */
  const toggleSelection = useCallback((index: number) => {
    setProcessedReceipts((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  /** Select / deselect all receipts */
  const selectAll = useCallback((selected: boolean) => {
    setProcessedReceipts((prev) => prev.map((r) => ({ ...r, selected })));
  }, []);

  /** Step 4 → 5: Send selected receipts */
  const handleEnviar = useCallback(
    async (signatureFile?: File) => {
      const toSend = processedReceipts.filter((r) => r.selected && r.employee?.email);
      if (!toSend.length) {
        toast({
          title: "Sin destinatarios",
          description: "Ningún recibo seleccionado tiene email de empleado.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const result = await enviarRecibos(toSend, signatureFile);
        setSendResult(result);
        setCurrentStep(5);

        if (result.total_failed === 0) {
          toast({
            title: "✅ Recibos enviados",
            description: `${result.total_sent} recibo(s) enviado(s) con éxito.`,
          });
        } else {
          toast({
            title: "Envío parcial",
            description: `${result.total_sent} enviado(s), ${result.total_failed} fallido(s).`,
            variant: "destructive",
          });
        }
      } catch (err: any) {
        const msg = err.message || "Error al enviar los recibos";
        setError(msg);
        toast({ title: "Error al enviar", description: msg, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [processedReceipts]
  );

  /** Load batch history */
  const loadHistorial = useCallback(async () => {
    try {
      const history = await obtenerHistorial();
      setBatchHistory(history);
    } catch {
      // silent — history is secondary
    }
  }, []);

  /** Retry failed sends for a batch */
  const handleReintentar = useCallback(async (batchId: string) => {
    setIsLoading(true);
    try {
      const result = await reintentar(batchId);
      toast({
        title: "Reintento completado",
        description: `${result.success_count} enviado(s), ${result.still_failed_count} aún fallido(s).`,
      });
      await loadHistorial();
    } catch (err: any) {
      toast({
        title: "Error al reintentar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadHistorial]);

  /** Navigate to a specific step (only backwards or to current+1) */
  const goToStep = useCallback((step: WorkflowStep) => {
    setCurrentStep(step);
  }, []);

  /** Reset the entire workflow */
  const reset = useCallback(() => {
    setCurrentStep(1);
    setUploadedFiles([]);
    setProcessedReceipts([]);
    setSendResult(undefined);
    setError(undefined);
    setIsLoading(false);
  }, []);

  return {
    currentStep,
    uploadedFiles,
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
  };
}
