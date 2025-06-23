import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Plus,
  Calculator,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const payrollRecords = [
  {
    id: 1,
    employeeName: "Juan Pérez",
    period: "Febrero 2024",
    baseDays: 22,
    holidayDays: 2,
    baseAmount: 330000,
    holidayBonus: 60000,
    discounts: 50000,
    advances: 50000,
    whiteAmount: 220000,
    informalAmount: 120000,
    netTotal: 340000,
    status: "processed",
  },
  {
    id: 2,
    employeeName: "María González",
    period: "Febrero 2024",
    baseDays: 20,
    holidayDays: 1,
    baseAmount: 240000,
    holidayBonus: 12000,
    discounts: 0,
    advances: 30000,
    whiteAmount: 160000,
    informalAmount: 62000,
    netTotal: 222000,
    status: "pending",
  },
  {
    id: 3,
    employeeName: "Carlos López",
    period: "Febrero 2024",
    baseDays: 21,
    holidayDays: 0,
    baseAmount: 283500,
    holidayBonus: 0,
    discounts: 15000,
    advances: 0,
    whiteAmount: 199500,
    informalAmount: 69000,
    netTotal: 268500,
    status: "draft",
  },
];

const employees = [
  { id: 1, name: "Juan Pérez", dailyWage: 15000 },
  { id: 2, name: "María González", dailyWage: 12000 },
  { id: 3, name: "Carlos López", dailyWage: 13500 },
  { id: 4, name: "Ana Martínez", dailyWage: 11000 },
];

const Payroll = () => {
  const [isNewPayrollOpen, setIsNewPayrollOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [workDays, setWorkDays] = useState("");
  const [holidayDays, setHolidayDays] = useState("");
  const [advances, setAdvances] = useState("");
  const [discounts, setDiscounts] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePayroll = () => {
    if (!selectedEmployee || !workDays) return null;

    const employee = employees.find(
      (e) => e.id.toString() === selectedEmployee,
    );
    if (!employee) return null;

    const basePay = employee.dailyWage * parseInt(workDays);
    const holidayPay = employee.dailyWage * 2 * (parseInt(holidayDays) || 0);
    const totalAdvances = parseInt(advances) || 0;
    const totalDiscounts = parseInt(discounts) || 0;

    const grossTotal = basePay + holidayPay;
    const netTotal = grossTotal - totalAdvances - totalDiscounts;

    // Assuming 70% white, 30% informal split
    const whiteAmount = Math.round(netTotal * 0.7);
    const informalAmount = netTotal - whiteAmount;

    return {
      basePay,
      holidayPay,
      grossTotal,
      totalAdvances,
      totalDiscounts,
      netTotal,
      whiteAmount,
      informalAmount,
    };
  };

  const calculation = calculatePayroll();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Liquidaciones</h1>
            <p className="text-muted-foreground">
              Gestión de sueldos y liquidaciones
            </p>
          </div>
        </div>

        <Dialog open={isNewPayrollOpen} onOpenChange={setIsNewPayrollOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Liquidación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Calcular Nueva Liquidación</DialogTitle>
              <DialogDescription>
                Completa los datos para generar la liquidación del empleado
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Empleado</Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={employee.id.toString()}
                        >
                          {employee.name} - {formatCurrency(employee.dailyWage)}
                          /día
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workDays">Días Trabajados</Label>
                  <Input
                    id="workDays"
                    type="number"
                    placeholder="22"
                    value={workDays}
                    onChange={(e) => setWorkDays(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holidayDays">
                    Días Feriados (doble pago)
                  </Label>
                  <Input
                    id="holidayDays"
                    type="number"
                    placeholder="0"
                    value={holidayDays}
                    onChange={(e) => setHolidayDays(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advances">Adelantos de Sueldo</Label>
                  <Input
                    id="advances"
                    type="number"
                    placeholder="0"
                    value={advances}
                    onChange={(e) => setAdvances(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discounts">Otros Descuentos</Label>
                  <Input
                    id="discounts"
                    type="number"
                    placeholder="0"
                    value={discounts}
                    onChange={(e) => setDiscounts(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vista Previa</h3>
                {calculation ? (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span>Sueldo base:</span>
                        <span>{formatCurrency(calculation.basePay)}</span>
                      </div>
                      {calculation.holidayPay > 0 && (
                        <div className="flex justify-between">
                          <span>Feriados (doble):</span>
                          <span>{formatCurrency(calculation.holidayPay)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculation.grossTotal)}</span>
                      </div>
                      {calculation.totalAdvances > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Adelantos:</span>
                          <span>
                            -{formatCurrency(calculation.totalAdvances)}
                          </span>
                        </div>
                      )}
                      {calculation.totalDiscounts > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Descuentos:</span>
                          <span>
                            -{formatCurrency(calculation.totalDiscounts)}
                          </span>
                        </div>
                      )}
                      <hr />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Neto:</span>
                        <span>{formatCurrency(calculation.netTotal)}</span>
                      </div>
                      <hr />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>En blanco (70%):</span>
                          <span>{formatCurrency(calculation.whiteAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Informal (30%):</span>
                          <span>
                            {formatCurrency(calculation.informalAmount)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      Selecciona un empleado y completa los días trabajados para
                      ver la vista previa
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setIsNewPayrollOpen(false)}
                className="w-full"
                disabled={!calculation}
              >
                Generar Liquidación
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsNewPayrollOpen(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                payrollRecords.reduce(
                  (sum, record) => sum + record.netTotal,
                  0,
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">Febrero 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRecords.length}</div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollRecords.filter((r) => r.status === "processed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {payrollRecords.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximo Aguinaldo
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Jun 2024</div>
            <p className="text-xs text-muted-foreground">Primer semestre</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Período Actual</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="aguinaldo">Aguinaldos</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones - Febrero 2024</CardTitle>
              <CardDescription>
                Estado actual de las liquidaciones del período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Días Base</TableHead>
                    <TableHead>Feriados</TableHead>
                    <TableHead>Adelantos</TableHead>
                    <TableHead>En Blanco</TableHead>
                    <TableHead>Informal</TableHead>
                    <TableHead>Total Neto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.employeeName}
                      </TableCell>
                      <TableCell>{record.baseDays} días</TableCell>
                      <TableCell>{record.holidayDays} días</TableCell>
                      <TableCell>{formatCurrency(record.advances)}</TableCell>
                      <TableCell>
                        {formatCurrency(record.whiteAmount)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(record.informalAmount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(record.netTotal)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "processed"
                              ? "default"
                              : record.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {record.status === "processed"
                            ? "Procesada"
                            : record.status === "pending"
                              ? "Pendiente"
                              : "Borrador"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  El historial de liquidaciones estará disponible próximamente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aguinaldo">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>El cálculo de aguinaldos estará disponible próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;
