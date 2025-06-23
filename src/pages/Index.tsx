import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Index = () => {
  const currentMonth = new Date().toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de {currentMonth}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empleados Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Liquidaciones Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Para esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,840,500</div>
            <p className="text-xs text-muted-foreground">
              +12% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Trabajadas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,842</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximas Acciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Próximas Acciones
            </CardTitle>
            <CardDescription>
              Tareas importantes para esta semana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  Liquidar sueldos de febrero
                </p>
                <p className="text-xs text-muted-foreground">
                  Vence el 4 de marzo
                </p>
              </div>
              <Badge variant="secondary">Pendiente</Badge>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Calcular aguinaldos</p>
                <p className="text-xs text-muted-foreground">
                  Primer semestre 2024
                </p>
              </div>
              <Badge variant="outline">Planificado</Badge>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  Revisar vacaciones pendientes
                </p>
                <p className="text-xs text-muted-foreground">
                  3 empleados con vacaciones acumuladas
                </p>
              </div>
              <Badge variant="destructive">Urgente</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos cambios en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  Nuevo empleado agregado: María González
                </p>
                <p className="text-xs text-muted-foreground">Hace 2 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">Liquidación procesada para Juan Pérez</p>
                <p className="text-xs text-muted-foreground">Hace 5 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  Descuento aplicado: Adelanto de sueldo
                </p>
                <p className="text-xs text-muted-foreground">Ayer</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">Backup automático completado</p>
                <p className="text-xs text-muted-foreground">Hace 2 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
