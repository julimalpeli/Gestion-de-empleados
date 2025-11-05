import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Edit, Calendar } from "lucide-react";
import { useSalaryHistory } from "@/hooks/use-salary-history";
import { SalaryHistoryRecord } from "@/services/salaryHistoryService";

interface SalaryHistoryTableProps {
  employeeId: string;
  employeeName?: string;
}

const SalaryHistoryTable = ({
  employeeId,
  employeeName,
}: SalaryHistoryTableProps) => {
  const { salaryHistory, loading, error, refresh, getSalaryHistoryStats } =
    useSalaryHistory(employeeId);
  const [stats, setStats] = useState<any>(null);

  // Cargar estadísticas
  useEffect(() => {
    const loadStats = async () => {
      const historyStats = await getSalaryHistoryStats();
      setStats(historyStats);
    };
    if (employeeId) {
      loadStats();
    }
  }, [employeeId, salaryHistory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR");
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split("-");
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const calculateTotalSalary = (record: SalaryHistoryRecord) => {
    return (record as any).base_wage ?? record.white_wage + record.informal_wage;
  };

  const calculatePreviousTotalSalary = (record: SalaryHistoryRecord) => {
    return (
      (record as any).previous_base_wage ??
      (record.previous_white_wage || 0) + (record.previous_informal_wage || 0)
    );
  };

  const getChangeType = (changeType: string) => {
    switch (changeType) {
      case "aumento":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            Aumento
          </Badge>
        );
      case "correccion":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Edit className="h-3 w-3 mr-1" />
            Corrección
          </Badge>
        );
      default:
        return <Badge variant="secondary">{changeType}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Error al cargar el historial: {error}
            </p>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cambios
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.totalChanges}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aumentos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalIncreases}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Correcciones
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalCorrections}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de historial */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial Salarial
              {employeeName && (
                <span className="text-muted-foreground">- {employeeName}</span>
              )}
            </CardTitle>
          </div>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {salaryHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay cambios salariales registrados</p>
              <p className="text-sm">
                Los aumentos y correcciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Efectiva</TableHead>
                    <TableHead>Período Impacto</TableHead>
                    <TableHead>Sueldo Anterior</TableHead>
                    <TableHead>Sueldo Nuevo</TableHead>
                    <TableHead>Presentismo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {formatDate(record.effective_date)}
                      </TableCell>
                      <TableCell>
                        {formatPeriod(record.impact_period)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Total:{" "}
                            {formatCurrency(
                              calculatePreviousTotalSalary(record),
                            )}
                          </div>
                          <div className="text-xs">
                            Blanco:{" "}
                            {formatCurrency(record.previous_white_wage || 0)}
                          </div>
                          <div className="text-xs">
                            Informal:{" "}
                            {formatCurrency(record.previous_informal_wage || 0)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Total:{" "}
                            {formatCurrency(calculateTotalSalary(record))}
                          </div>
                          <div className="text-xs">
                            Blanco: {formatCurrency(record.white_wage)}
                          </div>
                          <div className="text-xs">
                            Informal: {formatCurrency(record.informal_wage)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {formatCurrency(record.presentismo)}
                          </div>
                          {record.previous_presentismo && (
                            <div className="text-xs text-muted-foreground">
                              Anterior:{" "}
                              {formatCurrency(record.previous_presentismo)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getChangeType(record.change_type)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={record.reason || ""}>
                          {record.reason || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryHistoryTable;
