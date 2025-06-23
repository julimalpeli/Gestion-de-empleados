import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { FileBarChart, TrendingUp, Calendar, DollarSign } from "lucide-react";

const Reports = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis y reportes del sistema
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Reportes de Costos
            </CardTitle>
            <CardDescription>
              Análisis de costos laborales por período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reportes de Asistencia
            </CardTitle>
            <CardDescription>
              Control de días trabajados y ausentismo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Reportes Fiscales
            </CardTitle>
            <CardDescription>
              Información para presentaciones fiscales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5" />
              Dashboard Ejecutivo
            </CardTitle>
            <CardDescription>
              Métricas clave para la toma de decisiones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
